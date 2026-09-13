-- Flyer announcements share the existing inbox and Expo receipt pipeline.
create table public.flyer_notifications (
  id uuid primary key default gen_random_uuid(),
  retailer text not null,
  flyer_date date not null,
  title text not null,
  body text not null,
  test boolean not null default false,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_email text,
  created_at timestamptz not null default now()
);
create unique index flyer_notifications_unique_issue on public.flyer_notifications(lower(retailer), flyer_date) where not test;
create table public.flyer_notification_recipients (
  campaign_id uuid not null references public.flyer_notifications(id) on delete cascade,
  alert_id uuid not null references public.sale_alerts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','processing','accepted','failed','skipped')),
  accepted integer not null default 0,
  failed integer not null default 0,
  error text,
  claimed_at timestamptz,
  primary key (campaign_id, user_id)
);
create index flyer_notification_pending on public.flyer_notification_recipients(campaign_id, status);
alter table public.flyer_notifications enable row level security;
alter table public.flyer_notification_recipients enable row level security;
create policy flyer_notifications_admin_read on public.flyer_notifications for select to authenticated using (public.is_admin());
create policy flyer_recipients_admin_read on public.flyer_notification_recipients for select to authenticated using (public.is_admin());

create function public.flyer_notification_audience() returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() is not true then raise exception 'Admin access required'; end if;
  return jsonb_build_object(
    'users', (select count(*) from auth.users where not is_anonymous and deleted_at is null),
    'pushUsers', (select count(distinct t.user_id) from public.user_push_tokens t join auth.users u on u.id=t.user_id where t.enabled and not u.is_anonymous and u.deleted_at is null));
end $$;

create function public.create_flyer_notification(p_retailer text, p_flyer_date date, p_test boolean default false) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_retailer text; v_title text; v_body text;
begin
  if public.is_admin() is not true then raise exception 'Admin access required'; end if;
  if p_test is null or p_flyer_date is null or p_flyer_date > current_date then raise exception 'Choose a valid Flyer start date that is not in the future'; end if;
  select coalesce(nullif(trim(brand),''),trim(name)) into v_retailer from public.stores
    where lower(coalesce(nullif(trim(brand),''),trim(name)))=lower(trim(p_retailer)) and is_active
    order by coalesce(nullif(trim(brand),''),trim(name)) limit 1;
  if v_retailer is null then raise exception 'Choose an active retailer'; end if;
  if p_test and not exists(select 1 from public.user_push_tokens where user_id=auth.uid() and enabled) then
    raise exception 'Enable notifications in the app with this admin account before testing';
  end if;
  v_title := v_retailer || ' flyer updated!';
  v_body := 'New deals are now available at ' || v_retailer || '. Check out the latest offers!';
  insert into public.flyer_notifications(retailer,flyer_date,title,body,test,actor_user_id,actor_email)
    values(v_retailer,p_flyer_date,v_title,v_body,p_test,auth.uid(),auth.jwt()->>'email') returning id into v_id;
  with inserted as (
    insert into public.sale_alerts(user_id,store_id,alert_key,title,body)
    select id,null,'flyer|'||v_id::text,case when p_test then '[Test] ' else '' end||v_title,v_body
    from auth.users where deleted_at is null and not is_anonymous and (not p_test or id=auth.uid())
    returning id,user_id
  ) insert into public.flyer_notification_recipients(campaign_id,alert_id,user_id) select v_id,id,user_id from inserted;
  insert into public.admin_audit_logs(actor_user_id,actor_email,action,entity_type,entity_id,summary)
    values(auth.uid(),auth.jwt()->>'email','create','flyer_notification',v_id::text,case when p_test then 'Test: ' else '' end||v_title);
  return v_id;
end $$;

-- Only the verified server can claim work. Claims are never automatically retried:
-- a lost Expo response may already have delivered a push.
create function public.claim_flyer_notification(p_campaign_id uuid) returns setof public.flyer_notification_recipients
language sql security definer set search_path = public as $$
  update public.flyer_notification_recipients set status='processing',claimed_at=now()
  where (campaign_id,user_id) in (
    select campaign_id,user_id from public.flyer_notification_recipients
    where campaign_id=p_campaign_id and status='pending' order by user_id for update skip locked limit 10
  ) returning *;
$$;
create function public.flyer_notification_history() returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() is not true then raise exception 'Admin access required'; end if;
  return coalesce((select jsonb_agg(row_data order by created_at desc) from (
    select c.created_at, to_jsonb(c) || r.stats as row_data
    from (select * from public.flyer_notifications order by created_at desc limit 30) c
    cross join lateral (
      select jsonb_build_object(
        'users',count(*),'pending',count(*) filter(where status='pending'),
        'processing',count(*) filter(where status='processing'),
        'accepted',coalesce(sum(accepted),0),'failed',coalesce(sum(failed),0),
        'errors',count(*) filter(where error is not null),
        'skipped',count(*) filter(where status='skipped')) as stats
      from public.flyer_notification_recipients where campaign_id=c.id
    ) r
  ) h),'[]'::jsonb);
end $$;
revoke all on function public.flyer_notification_audience() from public, anon;
revoke all on function public.create_flyer_notification(text,date,boolean) from public, anon;
revoke all on function public.flyer_notification_history() from public, anon;
revoke all on function public.claim_flyer_notification(uuid) from public, anon, authenticated;
grant execute on function public.flyer_notification_audience(), public.create_flyer_notification(text,date,boolean), public.flyer_notification_history() to authenticated;
grant execute on function public.claim_flyer_notification(uuid) to service_role;

-- Resolve only the caller's own announcement to all active branches of its retailer.
create function public.flyer_notification_destination(p_alert_id uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('retailer',c.retailer,'storeIds',
    coalesce((select jsonb_agg(s.id order by s.id) from public.stores s
      where s.is_active and lower(coalesce(nullif(trim(s.brand),''),trim(s.name)))=lower(c.retailer)), '[]'::jsonb))
  from public.sale_alerts a join public.flyer_notifications c on a.alert_key='flyer|'||c.id::text
  where a.id=p_alert_id and a.user_id=auth.uid();
$$;
revoke all on function public.flyer_notification_destination(uuid) from public, anon;
grant execute on function public.flyer_notification_destination(uuid) to authenticated;
