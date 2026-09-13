-- The existing ON DELETE SET NULL food reference preserves all stored food.
grant delete on public.freezer_storage_units to authenticated;

drop policy if exists storage_delete on public.freezer_storage_units;
create policy storage_delete on public.freezer_storage_units
for delete to authenticated
using (user_id = auth.uid() or family_id = public.current_family_id());

notify pgrst, 'reload schema';
