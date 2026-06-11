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

-- admin_users
-- Add admins with service-role SQL, for example:
-- insert into public.admin_users (user_id) values ('00000000-0000-0000-0000-000000000000');
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;

drop policy if exists admin_users_select_admin on public.admin_users;
create policy admin_users_select_admin
on public.admin_users
for select
to authenticated
using (public.is_admin());

drop policy if exists admin_users_insert_admin on public.admin_users;
create policy admin_users_insert_admin
on public.admin_users
for insert
to authenticated
with check (public.is_admin());

drop policy if exists admin_users_delete_admin on public.admin_users;
create policy admin_users_delete_admin
on public.admin_users
for delete
to authenticated
using (public.is_admin());

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
drop policy if exists products_insert_admin on public.products;
create policy products_insert_admin
on public.products
for insert
to authenticated
with check (public.is_admin());

drop policy if exists products_update_auth on public.products;
drop policy if exists products_update_admin on public.products;
create policy products_update_admin
on public.products
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists products_delete_auth on public.products;
drop policy if exists products_delete_admin on public.products;
create policy products_delete_admin
on public.products
for delete
to authenticated
using (public.is_admin());

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
drop policy if exists stores_insert_admin on public.stores;
create policy stores_insert_admin
on public.stores
for insert
to authenticated
with check (public.is_admin());

drop policy if exists stores_update_auth on public.stores;
drop policy if exists stores_update_admin on public.stores;
create policy stores_update_admin
on public.stores
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists stores_delete_auth on public.stores;
drop policy if exists stores_delete_admin on public.stores;
create policy stores_delete_admin
on public.stores
for delete
to authenticated
using (public.is_admin());

-- admin_audit_logs
create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_email text,
  action text not null,
  entity_type text not null,
  entity_id text,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_logs_created_idx
  on public.admin_audit_logs(created_at desc);

alter table public.admin_audit_logs enable row level security;

drop policy if exists admin_audit_logs_select_admin on public.admin_audit_logs;
create policy admin_audit_logs_select_admin
on public.admin_audit_logs
for select
to authenticated
using (public.is_admin());

drop policy if exists admin_audit_logs_insert_admin on public.admin_audit_logs;
create policy admin_audit_logs_insert_admin
on public.admin_audit_logs
for insert
to authenticated
with check (public.is_admin() and actor_user_id = auth.uid());

-- product_prices
create table if not exists public.product_prices (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  price numeric(10, 2) not null check (price >= 0),
  valid_from timestamptz,
  valid_to timestamptz,
  observed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.product_prices
  add column if not exists valid_from timestamptz;

alter table public.product_prices
  add column if not exists valid_to timestamptz;

update public.product_prices
set valid_from = observed_at
where valid_from is null;

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
drop policy if exists product_prices_insert_admin on public.product_prices;
create policy product_prices_insert_admin
on public.product_prices
for insert
to authenticated
with check (public.is_admin());

drop policy if exists product_prices_update_auth on public.product_prices;
drop policy if exists product_prices_update_admin on public.product_prices;
create policy product_prices_update_admin
on public.product_prices
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists product_prices_delete_auth on public.product_prices;
drop policy if exists product_prices_delete_admin on public.product_prices;
create policy product_prices_delete_admin
on public.product_prices
for delete
to authenticated
using (public.is_admin());

-- storage: product-images bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists product_images_public_read on storage.objects;
create policy product_images_public_read
on storage.objects
for select
to public
using (bucket_id = 'product-images');

drop policy if exists product_images_auth_insert on storage.objects;
drop policy if exists product_images_admin_insert on storage.objects;
create policy product_images_admin_insert
on storage.objects
for insert
to authenticated
with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists product_images_auth_update on storage.objects;
drop policy if exists product_images_admin_update on storage.objects;
create policy product_images_admin_update
on storage.objects
for update
to authenticated
using (bucket_id = 'product-images' and public.is_admin())
with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists product_images_auth_delete on storage.objects;
drop policy if exists product_images_admin_delete on storage.objects;
create policy product_images_admin_delete
on storage.objects
for delete
to authenticated
using (bucket_id = 'product-images' and public.is_admin());
