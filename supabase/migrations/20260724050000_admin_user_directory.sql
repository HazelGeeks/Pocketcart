-- Read-only user directory for PocketCart administrators.
-- The function exposes operational account/profile summaries, never auth secrets.

create or replace function public.admin_list_users()
returns table (
  id uuid,
  email text,
  full_name text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  email_confirmed_at timestamptz,
  is_admin boolean,
  preferences_completed boolean,
  shopping_frequency text,
  interested_categories text[],
  favorite_stores text[],
  watchlist_count bigint,
  shopping_list_count bigint,
  sale_alert_count bigint,
  active_push_token_count bigint
)
language plpgsql
security definer
set search_path = public, pg_temp
stable
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required'
      using errcode = '42501';
  end if;

  return query
  with watchlist_counts as (
    select user_id, count(*) as item_count
    from public.watchlist_items
    group by user_id
  ),
  shopping_list_counts as (
    select user_id, count(*) as item_count
    from public.shopping_list_items
    group by user_id
  ),
  sale_alert_counts as (
    select user_id, count(*) as item_count
    from public.sale_alerts
    group by user_id
  ),
  push_token_counts as (
    select user_id, count(*) filter (where enabled) as item_count
    from public.user_push_tokens
    group by user_id
  )
  select
    users.id,
    coalesce(nullif(users.email, ''), nullif(profiles.email, ''), ''),
    profiles.full_name,
    users.created_at,
    users.last_sign_in_at,
    users.email_confirmed_at,
    admins.user_id is not null,
    preferences.completed_at is not null,
    preferences.shopping_frequency,
    coalesce(preferences.interested_categories, '{}'::text[]),
    coalesce(preferences.favorite_stores, '{}'::text[]),
    coalesce(watchlist_counts.item_count, 0)::bigint,
    coalesce(shopping_list_counts.item_count, 0)::bigint,
    coalesce(sale_alert_counts.item_count, 0)::bigint,
    coalesce(push_token_counts.item_count, 0)::bigint
  from auth.users as users
  left join public.profiles as profiles on profiles.id = users.id
  left join public.profile_preferences as preferences
    on preferences.user_id = users.id
  left join public.admin_users as admins on admins.user_id = users.id
  left join watchlist_counts on watchlist_counts.user_id = users.id
  left join shopping_list_counts on shopping_list_counts.user_id = users.id
  left join sale_alert_counts on sale_alert_counts.user_id = users.id
  left join push_token_counts on push_token_counts.user_id = users.id
  order by users.created_at desc, users.id;
end;
$$;

revoke all on function public.admin_list_users() from public, anon;
grant execute on function public.admin_list_users() to authenticated;

notify pgrst, 'reload schema';
