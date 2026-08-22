-- Remove legacy catalog write policies that allowed every authenticated user.
drop policy if exists products_insert_auth on public.products;
drop policy if exists products_update_auth on public.products;
drop policy if exists products_delete_auth on public.products;
drop policy if exists stores_insert_auth on public.stores;
drop policy if exists stores_update_auth on public.stores;
drop policy if exists stores_delete_auth on public.stores;
drop policy if exists product_prices_insert_auth on public.product_prices;
drop policy if exists product_prices_update_auth on public.product_prices;
drop policy if exists product_prices_delete_auth on public.product_prices;

drop policy if exists products_insert_admin on public.products;
create policy products_insert_admin on public.products
for insert to authenticated with check ((select public.is_admin()));
drop policy if exists products_update_admin on public.products;
create policy products_update_admin on public.products
for update to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists products_delete_admin on public.products;
create policy products_delete_admin on public.products
for delete to authenticated using ((select public.is_admin()));

drop policy if exists stores_insert_admin on public.stores;
create policy stores_insert_admin on public.stores
for insert to authenticated with check ((select public.is_admin()));
drop policy if exists stores_update_admin on public.stores;
create policy stores_update_admin on public.stores
for update to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists stores_delete_admin on public.stores;
create policy stores_delete_admin on public.stores
for delete to authenticated using ((select public.is_admin()));

drop policy if exists product_prices_insert_admin on public.product_prices;
create policy product_prices_insert_admin on public.product_prices
for insert to authenticated with check ((select public.is_admin()));
drop policy if exists product_prices_update_admin on public.product_prices;
create policy product_prices_update_admin on public.product_prices
for update to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists product_prices_delete_admin on public.product_prices;
create policy product_prices_delete_admin on public.product_prices
for delete to authenticated using ((select public.is_admin()));

-- Evaluate auth helpers once per statement instead of once per row.
alter policy profiles_select_own on public.profiles using ((select auth.uid()) = id);
alter policy profiles_insert_own on public.profiles with check ((select auth.uid()) = id);
alter policy profiles_update_own on public.profiles
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
alter policy profile_preferences_select_own on public.profile_preferences
  using ((select auth.uid()) = user_id);
alter policy profile_preferences_insert_own on public.profile_preferences
  with check ((select auth.uid()) = user_id);
alter policy profile_preferences_update_own on public.profile_preferences
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter policy watchlist_select_own on public.watchlist_items
  using ((select auth.uid()) = user_id);
alter policy watchlist_insert_own on public.watchlist_items
  with check ((select auth.uid()) = user_id);
alter policy watchlist_update_own on public.watchlist_items
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter policy watchlist_delete_own on public.watchlist_items
  using ((select auth.uid()) = user_id);
alter policy shopping_list_items_select_own on public.shopping_list_items
  using ((select auth.uid()) = user_id);
alter policy shopping_list_items_insert_own on public.shopping_list_items
  with check ((select auth.uid()) = user_id);
alter policy shopping_list_items_update_own on public.shopping_list_items
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter policy shopping_list_items_delete_own on public.shopping_list_items
  using ((select auth.uid()) = user_id);
alter policy freezer_items_select_own on public.freezer_items
  using ((select auth.uid()) = user_id);
alter policy freezer_items_insert_own on public.freezer_items
  with check ((select auth.uid()) = user_id);
alter policy freezer_items_update_own on public.freezer_items
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter policy freezer_items_delete_own on public.freezer_items
  using ((select auth.uid()) = user_id);
alter policy user_push_tokens_select_own on public.user_push_tokens
  using ((select auth.uid()) = user_id);
alter policy user_push_tokens_insert_own on public.user_push_tokens
  with check ((select auth.uid()) = user_id);
alter policy user_push_tokens_update_own on public.user_push_tokens
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter policy user_push_tokens_delete_own on public.user_push_tokens
  using ((select auth.uid()) = user_id);
alter policy sale_alerts_select_own on public.sale_alerts
  using ((select auth.uid()) = user_id);
alter policy sale_alerts_insert_own on public.sale_alerts
  with check ((select auth.uid()) = user_id);
alter policy sale_alerts_update_own on public.sale_alerts
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter policy push_delivery_tickets_select_own on public.push_delivery_tickets
  using ((select auth.uid()) = user_id);
alter policy user_favorite_stores_select_own on public.user_favorite_stores
  using ((select auth.uid()) = user_id);
alter policy user_favorite_stores_insert_own on public.user_favorite_stores
  with check ((select auth.uid()) = user_id);
alter policy user_favorite_stores_delete_own on public.user_favorite_stores
  using ((select auth.uid()) = user_id);
alter policy product_identity_reviews_select_admin on public.product_identity_reviews
  using ((select public.is_admin()));
alter policy product_identity_reviews_insert_admin on public.product_identity_reviews
  with check ((select public.is_admin()) and created_by = (select auth.uid()));
alter policy product_identity_reviews_update_admin on public.product_identity_reviews
  using ((select public.is_admin()))
  with check (
    (select public.is_admin())
    and (resolved_by is null or resolved_by = (select auth.uid()))
  );
alter policy admin_audit_logs_select_admin on public.admin_audit_logs
  using ((select public.is_admin()));
alter policy admin_audit_logs_insert_admin on public.admin_audit_logs
  with check ((select public.is_admin()) and actor_user_id = (select auth.uid()));

-- A public bucket can serve known object URLs without permitting object listing.
drop policy if exists product_images_public_read on storage.objects;

-- Trigger functions must not be callable as public RPCs.
revoke all on function public.handle_new_user_profile() from public, anon, authenticated;
revoke all on function public.sync_product_primary_aliases() from public, anon, authenticated;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

do $$
declare
  target_function regprocedure;
begin
  for target_function in
    select pg_proc.oid::regprocedure
    from pg_proc
    join pg_namespace on pg_namespace.oid = pg_proc.pronamespace
    where pg_namespace.nspname = 'public'
      and pg_proc.proname = 'rls_auto_enable'
  loop
    execute format(
      'revoke all on function %s from public, anon, authenticated',
      target_function
    );
  end loop;
end;
$$;

notify pgrst, 'reload schema';
