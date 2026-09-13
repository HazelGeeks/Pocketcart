-- Family data is separate from personal data. All membership changes use locked RPCs.
create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 60),
  owner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create table public.family_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  joined_at timestamptz not null default now()
);
create index on public.family_members(family_id);
create table public.family_invites (
  token_hash text primary key,
  family_id uuid not null references public.families(id) on delete cascade,
  expires_at timestamptz not null default now() + interval '7 days'
);
create table public.family_carts (
  family_id uuid primary key references public.families(id) on delete cascade,
  items jsonb not null default '[]',
  revision bigint not null default 0
);
alter table public.freezer_items add column family_id uuid references public.families(id) on delete cascade;
create index on public.freezer_items(family_id) where family_id is not null;

create function public.current_family_id() returns uuid language sql stable security definer
set search_path = public as $$ select family_id from public.family_members where user_id = auth.uid() $$;
revoke all on function public.current_family_id() from public;
grant execute on function public.current_family_id() to authenticated;

alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.family_invites enable row level security;
alter table public.family_carts enable row level security;
create policy family_read on public.families for select to authenticated using (id = public.current_family_id());
create policy member_read on public.family_members for select to authenticated using (family_id = public.current_family_id());
create policy cart_read on public.family_carts for select to authenticated using (family_id = public.current_family_id());
revoke all on public.families, public.family_members, public.family_invites, public.family_carts from anon, authenticated;
grant select on public.families, public.family_members, public.family_carts to authenticated;

-- Replace own-only policies, so removed members cannot retain access via creator id.
drop policy freezer_items_select_own on public.freezer_items;
drop policy freezer_items_insert_own on public.freezer_items;
drop policy freezer_items_update_own on public.freezer_items;
drop policy freezer_items_delete_own on public.freezer_items;
create policy freezer_read on public.freezer_items for select to authenticated
using ((family_id is null and user_id = auth.uid()) or family_id = public.current_family_id());
create policy freezer_insert on public.freezer_items for insert to authenticated
with check (user_id = auth.uid() and (family_id is null or family_id = public.current_family_id()));
create policy freezer_update on public.freezer_items for update to authenticated
using ((family_id is null and user_id = auth.uid()) or family_id = public.current_family_id())
with check ((family_id is null and user_id = auth.uid()) or family_id = public.current_family_id());
create policy freezer_delete on public.freezer_items for delete to authenticated
using ((family_id is null and user_id = auth.uid()) or family_id = public.current_family_id());
-- Prevent ordinary row updates from moving food to another scope or changing its creator.
create function public.guard_freezer_scope() returns trigger language plpgsql set search_path = public as $$
begin
 if current_user = 'authenticated' and (new.family_id is distinct from old.family_id or new.user_id is distinct from old.user_id) then
  raise exception 'Food ownership cannot be changed directly';
 end if;
 new.updated_at := clock_timestamp();
 return new;
end $$;
create trigger freezer_scope_guard before update on public.freezer_items for each row execute function public.guard_freezer_scope();

create function public.family_action(p_action text, p_value text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); f uuid; owner uuid; token text; invite public.family_invites; target uuid;
begin
 if u is null then raise exception 'Please sign in first'; end if;
 perform pg_advisory_xact_lock(hashtextextended(u::text, 42));
 select family_id into f from public.family_members where user_id = u;
 if p_action = 'create' then
  if f is not null then raise exception 'You already belong to a family'; end if;
  insert into public.families(name, owner_id) values (trim(p_value), u) returning id into f;
  insert into public.family_members(user_id,family_id) values (u,f);
  insert into public.family_carts(family_id) values (f);
 elsif p_action = 'join' then
  -- Lock the family before the invite, matching invite/revoke/leave lock order.
  select family_id into target from public.family_invites where token_hash = md5(p_value);
  perform 1 from public.families where id = target for update;
  select * into invite from public.family_invites where token_hash = md5(p_value) for update;
  if invite.family_id is null or invite.expires_at <= now() then raise exception 'This invite has expired or was already used. Ask for a new link.'; end if;
  if f = invite.family_id then return jsonb_build_object('family_id',f); end if;
  if f is not null then raise exception 'Leave your current family before joining another'; end if;
  insert into public.family_members(user_id,family_id) values(u,invite.family_id);
  delete from public.family_invites where token_hash = md5(p_value);
  f := invite.family_id;
 else
  if f is null then raise exception 'You do not belong to a family'; end if;
  select owner_id into owner from public.families where id = f for update;
  if f is distinct from public.current_family_id() then raise exception 'Family membership changed. Try again.'; end if;
  if p_action in ('invite','revoke','remove') and owner is distinct from u then raise exception 'Only the family owner can do this'; end if;
  if p_action = 'invite' then
   token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
   delete from public.family_invites where family_id = f;
   insert into public.family_invites(token_hash,family_id) values(md5(token), f);
   return jsonb_build_object('token', token);
  elsif p_action = 'revoke' then
   delete from public.family_invites where family_id = f;
  elsif p_action in ('leave','remove') then
   target := case when p_action = 'leave' then u else p_value::uuid end;
   if p_action = 'remove' and target = u then raise exception 'Use Leave family instead'; end if;
   delete from public.family_members where user_id = target and family_id = f;
   if not exists(select 1 from public.family_members where family_id = f) then
    delete from public.families where id = f;
   else
    update public.freezer_items set user_id = (select user_id from public.family_members where family_id = f order by joined_at,user_id limit 1) where family_id = f and user_id = target;
    update public.families set owner_id = (select user_id from public.family_members where family_id = f order by joined_at,user_id limit 1) where id = f and owner_id = target;
   end if;
   delete from public.family_invites where family_id = f;
  elsif p_action = 'import_freezer' then
   update public.freezer_items set family_id = f where user_id = u and family_id is null;
  else raise exception 'Unknown family action'; end if;
 end if;
 return jsonb_build_object('family_id',f);
end $$;
revoke all on function public.family_action(text,text) from public;
grant execute on function public.family_action(text,text) to authenticated;

create function public.save_family_cart(p_family_id uuid, p_revision bigint, p_items jsonb) returns boolean
language plpgsql security definer set search_path = public as $$
begin
 perform 1 from public.families where id = p_family_id for update;
 if auth.uid() is null or p_family_id is distinct from public.current_family_id() then raise exception 'Family access denied'; end if;
 if jsonb_typeof(p_items) is distinct from 'array' or octet_length(p_items::text) > 1000000 then raise exception 'Invalid cart'; end if;
 if exists(select 1 from jsonb_array_elements(p_items) item where
  jsonb_typeof(item->'productId') is distinct from 'string' or length(item->>'productId') not between 1 and 160 or
  jsonb_typeof(item->'name') is distinct from 'string' or length(item->>'name') not between 1 and 300 or
  jsonb_typeof(item->'quantity') is distinct from 'number' or (item->>'quantity')::numeric not between 1 and 99 or
  (item->>'quantity')::numeric <> trunc((item->>'quantity')::numeric)) then raise exception 'Invalid cart item'; end if;
 if (select count(*) <> count(distinct item->>'productId') from jsonb_array_elements(p_items) item) then raise exception 'Duplicate cart item'; end if;
 update public.family_carts set items = p_items, revision = revision + 1 where family_id = p_family_id and revision = p_revision;
 return found;
end $$;
revoke all on function public.save_family_cart(uuid,bigint,jsonb) from public;
grant execute on function public.save_family_cart(uuid,bigint,jsonb) to authenticated;

-- A deleted account must not orphan its family's ownership or delete shared food.
create function public.family_before_user_delete() returns trigger language plpgsql security definer set search_path = public as $$
declare f uuid; successor uuid;
begin
 select family_id into f from public.family_members where user_id = old.id;
 perform 1 from public.families where id = f for update;
 select user_id into successor from public.family_members where family_id = f and user_id <> old.id order by joined_at,user_id limit 1;
 if successor is not null then
  update public.families set owner_id = successor where id = f and owner_id = old.id;
  update public.freezer_items set user_id = successor where family_id = f and user_id = old.id;
 elsif f is not null then delete from public.families where id = f;
 end if;
 return old;
end $$;
create trigger family_user_delete before delete on auth.users for each row execute function public.family_before_user_delete();
notify pgrst, 'reload schema';

create function public.list_family_members() returns table(user_id uuid, display_name text, joined_at timestamptz)
language sql stable security definer set search_path = public as $$
 select m.user_id, coalesce(nullif(trim(p.full_name),''),'Family member'), m.joined_at
 from public.family_members m left join public.profiles p on p.id = m.user_id
 where m.family_id = public.current_family_id() order by m.joined_at, m.user_id
$$;
revoke all on function public.list_family_members() from public;
grant execute on function public.list_family_members() to authenticated;
