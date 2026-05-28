-- PocketCart Supabase schema source of truth
-- Keep SQL changes in this file (not in README).

create extension if not exists pgcrypto;

-- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- watchlist_items
create table if not exists public.watchlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  store text not null,
  target_price text,
  latest_price text,
  created_at timestamptz not null default now()
);

alter table public.watchlist_items enable row level security;

drop policy if exists watchlist_select_own on public.watchlist_items;
create policy watchlist_select_own
on public.watchlist_items
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists watchlist_insert_own on public.watchlist_items;
create policy watchlist_insert_own
on public.watchlist_items
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists watchlist_update_own on public.watchlist_items;
create policy watchlist_update_own
on public.watchlist_items
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists watchlist_delete_own on public.watchlist_items;
create policy watchlist_delete_own
on public.watchlist_items
for delete
to authenticated
using (auth.uid() = user_id);

-- products
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  thumbnail_url text,
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;

drop policy if exists products_select_public on public.products;
create policy products_select_public
on public.products
for select
to anon, authenticated
using (true);

drop policy if exists products_insert_auth on public.products;
create policy products_insert_auth
on public.products
for insert
to authenticated
with check (true);

drop policy if exists products_update_auth on public.products;
create policy products_update_auth
on public.products
for update
to authenticated
using (true)
with check (true);

drop policy if exists products_delete_auth on public.products;
create policy products_delete_auth
on public.products
for delete
to authenticated
using (true);

-- stores
create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  area text not null,
  latitude numeric not null,
  longitude numeric not null,
  price_note text,
  created_at timestamptz not null default now()
);

alter table public.stores enable row level security;

drop policy if exists stores_select_public on public.stores;
create policy stores_select_public
on public.stores
for select
to anon, authenticated
using (true);

drop policy if exists stores_insert_auth on public.stores;
create policy stores_insert_auth
on public.stores
for insert
to authenticated
with check (true);

drop policy if exists stores_update_auth on public.stores;
create policy stores_update_auth
on public.stores
for update
to authenticated
using (true)
with check (true);

drop policy if exists stores_delete_auth on public.stores;
create policy stores_delete_auth
on public.stores
for delete
to authenticated
using (true);

-- product_prices
create table if not exists public.product_prices (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  price numeric(10, 2) not null check (price >= 0),
  observed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists product_prices_product_observed_idx
  on public.product_prices(product_id, observed_at desc);

create index if not exists product_prices_store_observed_idx
  on public.product_prices(store_id, observed_at desc);

alter table public.product_prices enable row level security;

drop policy if exists product_prices_select_public on public.product_prices;
create policy product_prices_select_public
on public.product_prices
for select
to anon, authenticated
using (true);

drop policy if exists product_prices_insert_auth on public.product_prices;
create policy product_prices_insert_auth
on public.product_prices
for insert
to authenticated
with check (true);

drop policy if exists product_prices_update_auth on public.product_prices;
create policy product_prices_update_auth
on public.product_prices
for update
to authenticated
using (true)
with check (true);

drop policy if exists product_prices_delete_auth on public.product_prices;
create policy product_prices_delete_auth
on public.product_prices
for delete
to authenticated
using (true);
