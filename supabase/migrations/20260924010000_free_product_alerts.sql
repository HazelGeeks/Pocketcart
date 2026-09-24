-- Product alerts are free for every authenticated account. Preserve existing rows
-- and the service-only RPC signature for older clients; p_plus no longer gates saves.
drop trigger if exists watchlist_free_quota on public.watchlist_items;
drop function if exists public.guard_watchlist_free_quota();

create or replace function public.save_watchlist_with_plan(
  p_user_id uuid, p_product_id uuid, p_store_id uuid,
  p_name text, p_store text, p_target_price text, p_plus boolean default false
) returns public.watchlist_items
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  existing public.watchlist_items;
  result public.watchlist_items;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 731));
  select * into existing from public.watchlist_items
    where user_id = p_user_id and product_id = p_product_id limit 1;
  if existing.id is not null then
    update public.watchlist_items set name = p_name, store = p_store,
      store_id = p_store_id, target_price = p_target_price
      where id = existing.id returning * into result;
  else
    insert into public.watchlist_items(user_id, product_id, store_id, name, store, target_price)
      values(p_user_id, p_product_id, p_store_id, p_name, p_store, p_target_price)
      returning * into result;
  end if;
  return result;
end;
$$;
revoke all on function public.save_watchlist_with_plan(uuid, uuid, uuid, text, text, text, boolean) from public, anon, authenticated;
grant execute on function public.save_watchlist_with_plan(uuid, uuid, uuid, text, text, text, boolean) to service_role;
