create table if not exists public.freezer_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 100),
  storage_area text not null default 'fridge' check (storage_area in ('fridge', 'freezer')),
  quantity numeric(8, 2) not null default 1 check (quantity > 0 and quantity <= 9999),
  unit text check (unit is null or char_length(unit) <= 30),
  expires_on date,
  note text check (note is null or char_length(note) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists freezer_items_user_storage_expiry_idx
on public.freezer_items (user_id, storage_area, expires_on);

alter table public.freezer_items enable row level security;

drop policy if exists freezer_items_select_own on public.freezer_items;
create policy freezer_items_select_own on public.freezer_items
for select to authenticated using (auth.uid() = user_id);

drop policy if exists freezer_items_insert_own on public.freezer_items;
create policy freezer_items_insert_own on public.freezer_items
for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists freezer_items_update_own on public.freezer_items;
create policy freezer_items_update_own on public.freezer_items
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists freezer_items_delete_own on public.freezer_items;
create policy freezer_items_delete_own on public.freezer_items
for delete to authenticated using (auth.uid() = user_id);

notify pgrst, 'reload schema';
