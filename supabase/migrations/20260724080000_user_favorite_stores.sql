create table if not exists public.user_favorite_stores (
  user_id uuid not null references auth.users(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, store_id)
);

create index if not exists user_favorite_stores_store_idx
  on public.user_favorite_stores(store_id);

alter table public.user_favorite_stores enable row level security;

drop policy if exists user_favorite_stores_select_own on public.user_favorite_stores;
create policy user_favorite_stores_select_own
on public.user_favorite_stores
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists user_favorite_stores_insert_own on public.user_favorite_stores;
create policy user_favorite_stores_insert_own
on public.user_favorite_stores
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists user_favorite_stores_delete_own on public.user_favorite_stores;
create policy user_favorite_stores_delete_own
on public.user_favorite_stores
for delete
to authenticated
using (auth.uid() = user_id);

revoke all on table public.user_favorite_stores from anon;
grant select, insert, delete on table public.user_favorite_stores to authenticated;
