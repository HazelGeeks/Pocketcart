create table if not exists public.shopping_list_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  unit text,
  quantity integer not null default 1 check (quantity between 1 and 99),
  updated_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

alter table public.shopping_list_items enable row level security;

drop policy if exists shopping_list_items_select_own on public.shopping_list_items;
create policy shopping_list_items_select_own
on public.shopping_list_items
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists shopping_list_items_insert_own on public.shopping_list_items;
create policy shopping_list_items_insert_own
on public.shopping_list_items
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists shopping_list_items_update_own on public.shopping_list_items;
create policy shopping_list_items_update_own
on public.shopping_list_items
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists shopping_list_items_delete_own on public.shopping_list_items;
create policy shopping_list_items_delete_own
on public.shopping_list_items
for delete to authenticated
using (auth.uid() = user_id);

notify pgrst, 'reload schema';
