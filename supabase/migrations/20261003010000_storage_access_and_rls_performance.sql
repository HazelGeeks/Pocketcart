-- Correct live legacy policies: only admins may manage catalog image objects.
-- Public image delivery stays enabled on the bucket; object listing is admin-only.
drop policy if exists product_images_auth_insert on storage.objects;
drop policy if exists product_images_auth_update on storage.objects;
drop policy if exists product_images_auth_delete on storage.objects;
drop policy if exists product_images_admin_read on storage.objects;
drop policy if exists product_images_admin_insert on storage.objects;
drop policy if exists product_images_admin_update on storage.objects;
drop policy if exists product_images_admin_delete on storage.objects;
create policy product_images_admin_read on storage.objects for select to authenticated
using (bucket_id = 'product-images' and (select public.is_admin()));
create policy product_images_admin_insert on storage.objects for insert to authenticated
with check (bucket_id = 'product-images' and (select public.is_admin()));
create policy product_images_admin_update on storage.objects for update to authenticated
using (bucket_id = 'product-images' and (select public.is_admin()))
with check (bucket_id = 'product-images' and (select public.is_admin()));
create policy product_images_admin_delete on storage.objects for delete to authenticated
using (bucket_id = 'product-images' and (select public.is_admin()));

-- Preserve personal/family ownership conditions; cache stable auth helpers per query.
alter policy freezer_read on public.freezer_items
using ((family_id is null and user_id = (select auth.uid())) or family_id = (select public.current_family_id()));
alter policy freezer_insert on public.freezer_items
with check (user_id = (select auth.uid()) and (family_id is null or family_id = (select public.current_family_id())));
alter policy freezer_update on public.freezer_items
using ((family_id is null and user_id = (select auth.uid())) or family_id = (select public.current_family_id()))
with check ((family_id is null and user_id = (select auth.uid())) or family_id = (select public.current_family_id()));
alter policy freezer_delete on public.freezer_items
using ((family_id is null and user_id = (select auth.uid())) or family_id = (select public.current_family_id()));
alter policy storage_read on public.freezer_storage_units
using (user_id = (select auth.uid()) or family_id = (select public.current_family_id()));
alter policy storage_insert on public.freezer_storage_units
with check (user_id = (select auth.uid()) or family_id = (select public.current_family_id()));
alter policy storage_update on public.freezer_storage_units
using (user_id = (select auth.uid()) or family_id = (select public.current_family_id()))
with check (user_id = (select auth.uid()) or family_id = (select public.current_family_id()));
alter policy storage_delete on public.freezer_storage_units
using (user_id = (select auth.uid()) or family_id = (select public.current_family_id()));
