-- Keep older clients working within the free quota. Paid writes use the
-- service-only RPC after RevenueCat verification. Existing rows are retained.
create or replace function public.guard_watchlist_free_quota()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare item_count integer;
begin
  if auth.role() not in ('authenticated', 'anon') or auth.role() is null then return new; end if;
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text, 731));
  if tg_op = 'UPDATE' and new.user_id = old.user_id and new.product_id is not distinct from old.product_id then return new; end if;
  select count(distinct coalesce(product_id, id)) into item_count
    from public.watchlist_items where user_id = new.user_id and id <> new.id;
  if item_count >= 5 and not exists (
    select 1 from public.watchlist_items where user_id = new.user_id and product_id = new.product_id
  ) then
    raise exception 'Free accounts can monitor 5 products. Remove a product to add another.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_watchlist_free_quota() from public, anon, authenticated;
drop trigger if exists watchlist_free_quota on public.watchlist_items;
create trigger watchlist_free_quota before insert or update on public.watchlist_items
  for each row execute function public.guard_watchlist_free_quota();
grant insert, update on public.watchlist_items to authenticated;

create or replace function public.save_watchlist_with_plan(
  p_user_id uuid, p_product_id uuid, p_store_id uuid,
  p_name text, p_store text, p_target_price text, p_plus boolean default false
) returns public.watchlist_items
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  existing public.watchlist_items;
  result public.watchlist_items;
  item_count integer;
  item_rank integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 731));
  select * into existing from public.watchlist_items
    where user_id = p_user_id and product_id = p_product_id limit 1;
  select count(distinct coalesce(product_id, id)) into item_count
    from public.watchlist_items where user_id = p_user_id;
  if existing.id is not null then
    select count(*) into item_rank from public.watchlist_items
      where user_id = p_user_id and (created_at, id) <= (existing.created_at, existing.id);
  end if;
  if not coalesce(p_plus, false) and ((existing.id is null and item_count >= 5) or item_rank > 5) then
    raise exception 'WATCHLIST_LIMIT_REACHED' using errcode = 'P0001';
  end if;
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
