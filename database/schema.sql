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

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_user_profile();

-- profile preferences
create table if not exists public.profile_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  interested_categories text[] not null default '{}',
  shopping_frequency text,
  favorite_stores text[] not null default '{}',
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint profile_preferences_frequency_check check (
    shopping_frequency is null or shopping_frequency in (
      'multiple_weekly', 'weekly', 'biweekly', 'monthly'
    )
  )
);

alter table public.profile_preferences enable row level security;

drop policy if exists profile_preferences_select_own on public.profile_preferences;
create policy profile_preferences_select_own on public.profile_preferences
for select to authenticated using (auth.uid() = user_id);

drop policy if exists profile_preferences_insert_own on public.profile_preferences;
create policy profile_preferences_insert_own on public.profile_preferences
for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists profile_preferences_update_own on public.profile_preferences;
create policy profile_preferences_update_own on public.profile_preferences
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

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
  korean_name text not null,
  category text not null,
  unit text,
  english_name text,
  brand text,
  gtin text,
  thumbnail_url text,
  created_at timestamptz not null default now()
);

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'name'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'korean_name'
  ) then
    alter table public.products rename column name to korean_name;
  end if;
end;
$$;

alter table public.products
  add column if not exists unit text,
  add column if not exists english_name text,
  add column if not exists brand text,
  add column if not exists gtin text;

drop index if exists public.products_identity_key;
create unique index products_identity_key
  on public.products (
    lower(regexp_replace(trim(coalesce(brand, '')), '\s+', ' ', 'g')),
    lower(regexp_replace(trim(korean_name), '\s+', ' ', 'g')),
    lower(regexp_replace(trim(coalesce(unit, '')), '\s+', ' ', 'g')),
    lower(regexp_replace(trim(category), '\s+', ' ', 'g'))
  );

create unique index if not exists products_gtin_key
  on public.products (regexp_replace(gtin, '\D', '', 'g'))
  where nullif(regexp_replace(gtin, '\D', '', 'g'), '') is not null;

alter table public.products
  drop constraint if exists products_gtin_format_check;

create or replace function public.is_valid_gtin(value text)
returns boolean
language sql
immutable
strict
set search_path = pg_catalog
as $$
  select
    value ~ '^[0-9]+$'
    and length(value) in (8, 12, 13, 14)
    and (
      10 - (
        coalesce((
          select sum(
            substring(value from digits.pos for 1)::integer *
            case when (length(value) - digits.pos) % 2 = 1 then 3 else 1 end
          )
          from generate_series(1, length(value) - 1) as digits(pos)
        ), 0) % 10
      )
    ) % 10 = right(value, 1)::integer;
$$;

alter table public.products
  add constraint products_gtin_format_check
  check (
    gtin is null
    or public.is_valid_gtin(gtin)
  )
  not valid;

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

-- shopping_list_items
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

-- stores
create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  brand text,
  name text not null,
  area text,
  latitude numeric not null,
  longitude numeric not null,
  price_note text,
  address text,
  place_id text,
  phone text,
  website text,
  hours text,
  store_type text not null default 'grocery',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.stores
  add column if not exists brand text,
  add column if not exists address text,
  add column if not exists place_id text,
  add column if not exists phone text,
  add column if not exists website text,
  add column if not exists hours text,
  add column if not exists store_type text not null default 'grocery',
  add column if not exists is_active boolean not null default true;

alter table public.stores alter column area drop not null;
alter table public.stores drop constraint if exists stores_name_area_unique;
drop index if exists stores_brand_name_area_unique;

create unique index if not exists stores_brand_name_unique
  on public.stores (
    lower(regexp_replace(trim(coalesce(brand, '')), '\s+', ' ', 'g')),
    lower(regexp_replace(trim(name), '\s+', ' ', 'g'))
  );

alter table public.stores drop constraint if exists stores_latitude_range;
alter table public.stores
  add constraint stores_latitude_range
  check (latitude >= -90 and latitude <= 90) not valid;

alter table public.stores drop constraint if exists stores_longitude_range;
alter table public.stores
  add constraint stores_longitude_range
  check (longitude >= -180 and longitude <= 180) not valid;

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

-- user_favorite_stores
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

-- watchlist product/store links
alter table public.watchlist_items
  add column if not exists product_id uuid references public.products(id) on delete set null,
  add column if not exists store_id uuid references public.stores(id) on delete set null;

with ranked_watchlist_items as (
  select
    watchlist_items.id,
    row_number() over (
      partition by watchlist_items.user_id, watchlist_items.product_id
      order by
        (watchlist_items.store_id is not null) desc,
        (nullif(trim(watchlist_items.target_price), '') is not null) desc,
        (nullif(trim(watchlist_items.latest_price), '') is not null) desc,
        watchlist_items.created_at asc,
        watchlist_items.id asc
    ) as duplicate_rank
  from public.watchlist_items
  where watchlist_items.product_id is not null
)
delete from public.watchlist_items
using ranked_watchlist_items
where watchlist_items.id = ranked_watchlist_items.id
  and ranked_watchlist_items.duplicate_rank > 1;

drop index if exists public.watchlist_items_user_product_idx;

create unique index if not exists watchlist_items_user_product_unique
  on public.watchlist_items(user_id, product_id)
  where product_id is not null;

-- user_push_tokens
create table if not exists public.user_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null,
  platform text,
  enabled boolean not null default true,
  last_seen_at timestamptz not null default now(),
  last_error text,
  created_at timestamptz not null default now()
);

create unique index if not exists user_push_tokens_user_token_unique
  on public.user_push_tokens(user_id, token);

create index if not exists user_push_tokens_user_enabled_idx
  on public.user_push_tokens(user_id, enabled);

alter table public.user_push_tokens enable row level security;

drop policy if exists user_push_tokens_select_own on public.user_push_tokens;
create policy user_push_tokens_select_own
on public.user_push_tokens
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists user_push_tokens_insert_own on public.user_push_tokens;
create policy user_push_tokens_insert_own
on public.user_push_tokens
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists user_push_tokens_update_own on public.user_push_tokens;
create policy user_push_tokens_update_own
on public.user_push_tokens
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists user_push_tokens_delete_own on public.user_push_tokens;
create policy user_push_tokens_delete_own
on public.user_push_tokens
for delete
to authenticated
using (auth.uid() = user_id);

-- sale_alerts
create table if not exists public.sale_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  watchlist_item_id uuid references public.watchlist_items(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  store_id uuid references public.stores(id) on delete set null,
  alert_key text not null,
  title text not null,
  body text not null,
  sale_price numeric(10, 2),
  previous_price numeric(10, 2),
  sale_started_at text,
  push_sent_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.sale_alerts
  add column if not exists push_sent_at timestamptz;

create unique index if not exists sale_alerts_user_alert_key_unique
  on public.sale_alerts(user_id, alert_key);

with normalized_alerts as (
  select
    sale_alerts.id,
    sale_alerts.user_id,
    sale_alerts.product_id::text
      || substring(
        sale_alerts.alert_key
        from position('|' in sale_alerts.alert_key)
      ) as normalized_alert_key,
    sale_alerts.push_sent_at,
    sale_alerts.created_at
  from public.sale_alerts
  where sale_alerts.product_id is not null
    and position('|' in sale_alerts.alert_key) > 0
),
ranked_alerts as (
  select
    normalized_alerts.id,
    row_number() over (
      partition by
        normalized_alerts.user_id,
        normalized_alerts.normalized_alert_key
      order by
        (normalized_alerts.push_sent_at is not null) desc,
        normalized_alerts.created_at desc,
        normalized_alerts.id asc
    ) as duplicate_rank
  from normalized_alerts
)
delete from public.sale_alerts
using ranked_alerts
where sale_alerts.id = ranked_alerts.id
  and ranked_alerts.duplicate_rank > 1;

update public.sale_alerts
set alert_key =
  sale_alerts.product_id::text
  || substring(
    sale_alerts.alert_key
    from position('|' in sale_alerts.alert_key)
  )
where sale_alerts.product_id is not null
  and position('|' in sale_alerts.alert_key) > 0
  and sale_alerts.alert_key is distinct from (
    sale_alerts.product_id::text
    || substring(
      sale_alerts.alert_key
      from position('|' in sale_alerts.alert_key)
    )
  );

create index if not exists sale_alerts_user_created_idx
  on public.sale_alerts(user_id, created_at desc);

alter table public.sale_alerts enable row level security;

drop policy if exists sale_alerts_select_own on public.sale_alerts;
create policy sale_alerts_select_own
on public.sale_alerts
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists sale_alerts_insert_own on public.sale_alerts;
create policy sale_alerts_insert_own
on public.sale_alerts
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists sale_alerts_update_own on public.sale_alerts;
create policy sale_alerts_update_own
on public.sale_alerts
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- push_delivery_tickets
create table if not exists public.push_delivery_tickets (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid not null references public.sale_alerts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  push_token_id uuid references public.user_push_tokens(id) on delete set null,
  token text not null,
  expo_ticket_id text not null,
  status text not null default 'pending'
    check (status in ('pending', 'delivered', 'failed', 'expired')),
  error_code text,
  error_message text,
  checked_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists push_delivery_tickets_expo_ticket_unique
  on public.push_delivery_tickets(expo_ticket_id);

create index if not exists push_delivery_tickets_pending_created_idx
  on public.push_delivery_tickets(created_at)
  where status = 'pending';

create index if not exists push_delivery_tickets_user_created_idx
  on public.push_delivery_tickets(user_id, created_at desc);

alter table public.push_delivery_tickets enable row level security;

drop policy if exists push_delivery_tickets_select_own on public.push_delivery_tickets;
create policy push_delivery_tickets_select_own
on public.push_delivery_tickets
for select
to authenticated
using (auth.uid() = user_id);

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

do $$
begin
  if exists (
    select 1
    from public.product_prices legacy
    join public.product_prices localized
      on localized.product_id = legacy.product_id
      and localized.store_id = legacy.store_id
      and localized.id <> legacy.id
      and localized.valid_from = (
        ((legacy.valid_from at time zone 'UTC')::date)::timestamp
        at time zone 'America/Vancouver'
      )
    where
      (legacy.valid_from at time zone 'UTC')::time = time '00:00:00'
      and (legacy.valid_to at time zone 'UTC')::time = time '23:59:59.999'
  ) then
    raise exception
      'Legacy UTC sale periods overlap already-localized periods. Resolve duplicate rows before applying this migration.';
  end if;
end;
$$;

update public.product_prices
set
  observed_at = case
    when observed_at = valid_from then
      (((valid_from at time zone 'UTC')::date)::timestamp at time zone 'America/Vancouver')
    else observed_at
  end,
  valid_from =
    (((valid_from at time zone 'UTC')::date)::timestamp at time zone 'America/Vancouver'),
  valid_to =
    (
      ((((valid_to at time zone 'UTC')::date + 1)::timestamp) at time zone 'America/Vancouver')
      - interval '1 millisecond'
    )
where
  (valid_from at time zone 'UTC')::time = time '00:00:00'
  and (valid_to at time zone 'UTC')::time = time '23:59:59.999';

drop index if exists public.product_prices_product_store_valid_from_key;

create unique index if not exists product_prices_product_store_sale_period_key
  on public.product_prices (
    product_id,
    store_id,
    valid_from,
    coalesce(valid_to, 'infinity'::timestamptz)
  );

create or replace function public.list_product_price_summaries(
  p_store_ids uuid[] default null
)
returns table (
  product_id uuid,
  current_price numeric,
  previous_price numeric,
  current_session_start timestamptz,
  current_session_end timestamptz,
  previous_session_start timestamptz,
  previous_session_end timestamptz,
  best_store_id uuid,
  best_store_brand text,
  best_store_name text,
  best_store_area text
)
language sql
stable
set search_path = public
as $$
  with scoped_prices as (
    select
      pp.id,
      pp.product_id,
      pp.store_id,
      pp.price,
      coalesce(pp.valid_from, pp.observed_at) as session_start,
      pp.valid_to as session_end
    from public.product_prices pp
    where p_store_ids is null or pp.store_id = any(p_store_ids)
  ),
  session_catalog as (
    select product_id, session_start, session_end
    from scoped_prices
    group by product_id, session_start, session_end
  ),
  active_sessions as (
    select
      sessions.*,
      row_number() over (
        partition by sessions.product_id
        order by sessions.session_start desc, sessions.session_end desc nulls first
      ) as session_rank
    from session_catalog sessions
    where
      sessions.session_start <= now()
      and (sessions.session_end is null or sessions.session_end >= now())
  ),
  current_sessions as (
    select product_id, session_start, session_end
    from active_sessions
    where session_rank = 1
  ),
  current_prices as (
    select
      prices.*,
      row_number() over (
        partition by prices.product_id
        order by prices.price asc, prices.store_id asc, prices.id asc
      ) as price_rank
    from scoped_prices prices
    join current_sessions current_session_row
      on current_session_row.product_id = prices.product_id
      and current_session_row.session_start = prices.session_start
      and current_session_row.session_end is not distinct from prices.session_end
  ),
  previous_sessions_ranked as (
    select
      sessions.*,
      row_number() over (
        partition by sessions.product_id
        order by sessions.session_start desc, sessions.session_end desc nulls first
      ) as session_rank
    from session_catalog sessions
    join current_sessions current_session_row using (product_id)
    where sessions.session_start < current_session_row.session_start
  ),
  previous_sessions as (
    select product_id, session_start, session_end
    from previous_sessions_ranked
    where session_rank = 1
  ),
  previous_prices as (
    select
      prices.*,
      row_number() over (
        partition by prices.product_id
        order by prices.price asc, prices.store_id asc, prices.id asc
      ) as price_rank
    from scoped_prices prices
    join previous_sessions previous_session_row
      on previous_session_row.product_id = prices.product_id
      and previous_session_row.session_start = prices.session_start
      and previous_session_row.session_end is not distinct from prices.session_end
  )
  select
    current_price_row.product_id,
    current_price_row.price as current_price,
    previous_price_row.price as previous_price,
    current_price_row.session_start as current_session_start,
    current_price_row.session_end as current_session_end,
    previous_price_row.session_start as previous_session_start,
    previous_price_row.session_end as previous_session_end,
    current_price_row.store_id as best_store_id,
    stores.brand as best_store_brand,
    stores.name as best_store_name,
    stores.area as best_store_area
  from current_prices current_price_row
  left join previous_prices previous_price_row
    on previous_price_row.product_id = current_price_row.product_id
    and previous_price_row.price_rank = 1
  left join public.stores stores
    on stores.id = current_price_row.store_id
  where current_price_row.price_rank = 1;
$$;

grant execute on function public.list_product_price_summaries(uuid[]) to anon, authenticated;

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

-- product_identity_reviews
create table if not exists public.product_identity_reviews (
  id uuid primary key default gen_random_uuid(),
  review_key text not null,
  source text not null default 'csv_import',
  row_number integer,
  product_id uuid references public.products(id) on delete set null,
  reason text not null,
  match_method text,
  candidate_count integer not null default 0 check (candidate_count >= 0),
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'resolved')),
  created_by uuid references auth.users(id) on delete set null,
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.product_identity_reviews
  add column if not exists review_key text;

update public.product_identity_reviews
set review_key = id::text
where review_key is null;

alter table public.product_identity_reviews
  alter column review_key set not null;

create index if not exists product_identity_reviews_pending_created_idx
  on public.product_identity_reviews(status, created_at desc);

create unique index if not exists product_identity_reviews_pending_key
  on public.product_identity_reviews(review_key)
  where status = 'pending';

alter table public.product_identity_reviews enable row level security;

drop policy if exists product_identity_reviews_select_admin on public.product_identity_reviews;
create policy product_identity_reviews_select_admin
on public.product_identity_reviews
for select
to authenticated
using (public.is_admin());

drop policy if exists product_identity_reviews_insert_admin on public.product_identity_reviews;
create policy product_identity_reviews_insert_admin
on public.product_identity_reviews
for insert
to authenticated
with check (public.is_admin() and created_by = auth.uid());

drop policy if exists product_identity_reviews_update_admin on public.product_identity_reviews;
create policy product_identity_reviews_update_admin
on public.product_identity_reviews
for update
to authenticated
using (public.is_admin())
with check (
  public.is_admin()
  and (resolved_by is null or resolved_by = auth.uid())
);

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

-- account_deletion_requests
create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null check (char_length(email) <= 320 and position('@' in email) > 1),
  platform text not null default 'unknown' check (platform in ('ios', 'android', 'web', 'unknown')),
  details text,
  status text not null default 'open' check (status in ('open', 'in_review', 'completed', 'rejected')),
  source text not null default 'web',
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists account_deletion_requests_status_created_idx
  on public.account_deletion_requests(status, created_at desc);

create index if not exists account_deletion_requests_email_idx
  on public.account_deletion_requests(lower(email));

alter table public.account_deletion_requests enable row level security;

drop policy if exists account_deletion_requests_select_admin on public.account_deletion_requests;
create policy account_deletion_requests_select_admin
on public.account_deletion_requests
for select
to authenticated
using (public.is_admin());

drop policy if exists account_deletion_requests_update_admin on public.account_deletion_requests;
create policy account_deletion_requests_update_admin
on public.account_deletion_requests
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists account_deletion_requests_delete_admin on public.account_deletion_requests;
create policy account_deletion_requests_delete_admin
on public.account_deletion_requests
for delete
to authenticated
using (public.is_admin());

-- admin user directory
create or replace function public.admin_list_users()
returns table (
  id uuid,
  email text,
  full_name text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  email_confirmed_at timestamptz,
  is_admin boolean,
  preferences_completed boolean,
  shopping_frequency text,
  interested_categories text[],
  favorite_stores text[],
  watchlist_count bigint,
  shopping_list_count bigint,
  sale_alert_count bigint,
  active_push_token_count bigint
)
language plpgsql
security definer
set search_path = public, pg_temp
stable
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required'
      using errcode = '42501';
  end if;

  return query
  with watchlist_counts as (
    select user_id, count(*) as item_count
    from public.watchlist_items
    group by user_id
  ),
  shopping_list_counts as (
    select user_id, count(*) as item_count
    from public.shopping_list_items
    group by user_id
  ),
  sale_alert_counts as (
    select user_id, count(*) as item_count
    from public.sale_alerts
    group by user_id
  ),
  push_token_counts as (
    select user_id, count(*) filter (where enabled) as item_count
    from public.user_push_tokens
    group by user_id
  )
  select
    users.id,
    coalesce(nullif(users.email, ''), nullif(profiles.email, ''), ''),
    profiles.full_name,
    users.created_at,
    users.last_sign_in_at,
    users.email_confirmed_at,
    admins.user_id is not null,
    preferences.completed_at is not null,
    preferences.shopping_frequency,
    coalesce(preferences.interested_categories, '{}'::text[]),
    coalesce(preferences.favorite_stores, '{}'::text[]),
    coalesce(watchlist_counts.item_count, 0)::bigint,
    coalesce(shopping_list_counts.item_count, 0)::bigint,
    coalesce(sale_alert_counts.item_count, 0)::bigint,
    coalesce(push_token_counts.item_count, 0)::bigint
  from auth.users as users
  left join public.profiles as profiles on profiles.id = users.id
  left join public.profile_preferences as preferences
    on preferences.user_id = users.id
  left join public.admin_users as admins on admins.user_id = users.id
  left join watchlist_counts on watchlist_counts.user_id = users.id
  left join shopping_list_counts on shopping_list_counts.user_id = users.id
  left join sale_alert_counts on sale_alert_counts.user_id = users.id
  left join push_token_counts on push_token_counts.user_id = users.id
  order by users.created_at desc, users.id;
end;
$$;

revoke all on function public.admin_list_users() from public, anon;
grant execute on function public.admin_list_users() to authenticated;

notify pgrst, 'reload schema';

-- Product identity review and merge workflow
alter table public.product_identity_reviews
  add column if not exists candidate_product_ids uuid[] not null default '{}'::uuid[],
  add column if not exists resolved_product_id uuid references public.products(id) on delete set null,
  add column if not exists resolution_action text;

create or replace function public.seed_existing_product_identity_reviews()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_count integer := 0;
begin
  if auth.uid() is not null and not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  with normalized_products as (
    select
      products.id,
      products.english_name,
      products.unit,
      lower(regexp_replace(trim(products.english_name), '[^a-zA-Z0-9]+', '', 'g')) as name_key,
      lower(regexp_replace(trim(coalesce(products.unit, '')), '\s+', '', 'g')) as unit_key
    from public.products
    where nullif(trim(products.english_name), '') is not null
  ),
  duplicate_groups as (
    select
      name_key,
      unit_key,
      min(english_name) as english_name,
      min(unit) as unit,
      array_agg(id order by id) as candidate_ids,
      count(*)::integer as candidate_count
    from normalized_products
    where name_key <> ''
    group by name_key, unit_key
    having count(*) > 1
  )
  insert into public.product_identity_reviews (
    review_key,
    source,
    reason,
    match_method,
    candidate_count,
    candidate_product_ids,
    payload,
    status
  )
  select
    'existing-duplicate:' || md5(name_key || '|' || unit_key),
    'identity_backfill',
    'existing_duplicate_candidates',
    'canonical_identity',
    candidate_count,
    candidate_ids,
    jsonb_build_object(
      'english_name', english_name,
      'korean_name', null,
      'unit', unit,
      'candidate_product_ids', to_jsonb(candidate_ids),
      'backfill_reason', 'Same normalized English name and unit'
    ),
    'pending'
  from duplicate_groups
  where not exists (
    select 1
    from public.product_identity_reviews as existing_review
    where existing_review.review_key =
      'existing-duplicate:' || md5(duplicate_groups.name_key || '|' || duplicate_groups.unit_key)
  )
  on conflict do nothing;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

revoke all on function public.seed_existing_product_identity_reviews() from public, anon;
grant execute on function public.seed_existing_product_identity_reviews() to authenticated;

create or replace function public.merge_products(
  p_source_product_ids uuid[],
  p_target_product_id uuid,
  p_review_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  source_id uuid;
  source_ids uuid[];
  target_name text;
  target_unit text;
  moved_prices integer := 0;
  merged_price_conflicts integer := 0;
  moved_shopping_items integer := 0;
  moved_watchlist_items integer := 0;
  moved_sale_alerts integer := 0;
  affected integer := 0;
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;
  if p_target_product_id is null then
    raise exception 'Target product is required';
  end if;

  select coalesce(nullif(trim(products.english_name), ''), products.korean_name), products.unit
  into target_name, target_unit
  from public.products
  where products.id = p_target_product_id
  for update;

  if not found then
    raise exception 'Target product was not found';
  end if;

  select coalesce(array_agg(distinct source_values.source_id), '{}'::uuid[])
  into source_ids
  from unnest(coalesce(p_source_product_ids, '{}'::uuid[])) as source_values(source_id)
  where source_values.source_id is not null
    and source_values.source_id <> p_target_product_id;

  if cardinality(source_ids) = 0 then
    raise exception 'At least one different source product is required';
  end if;

  if exists (
    select 1
    from unnest(source_ids) as requested(source_id)
    left join public.products on products.id = requested.source_id
    where products.id is null
  ) then
    raise exception 'One or more source products were not found';
  end if;

  perform 1
  from public.products
  where id = any(source_ids)
  order by id
  for update;

  foreach source_id in array source_ids loop
    update public.product_prices as target_price
    set
      price = least(target_price.price, source_price.price),
      observed_at = greatest(target_price.observed_at, source_price.observed_at)
    from public.product_prices as source_price
    where target_price.product_id = p_target_product_id
      and source_price.product_id = source_id
      and target_price.store_id = source_price.store_id
      and target_price.valid_from is not distinct from source_price.valid_from
      and target_price.valid_to is not distinct from source_price.valid_to;
    get diagnostics affected = row_count;
    merged_price_conflicts := merged_price_conflicts + affected;

    delete from public.product_prices as source_price
    using public.product_prices as target_price
    where source_price.product_id = source_id
      and target_price.product_id = p_target_product_id
      and target_price.store_id = source_price.store_id
      and target_price.valid_from is not distinct from source_price.valid_from
      and target_price.valid_to is not distinct from source_price.valid_to;

    update public.product_prices
    set product_id = p_target_product_id
    where product_id = source_id;
    get diagnostics affected = row_count;
    moved_prices := moved_prices + affected;

    insert into public.shopping_list_items as target_item (
      user_id,
      product_id,
      name,
      unit,
      quantity,
      updated_at
    )
    select
      shopping_list_items.user_id,
      p_target_product_id,
      target_name,
      target_unit,
      shopping_list_items.quantity,
      shopping_list_items.updated_at
    from public.shopping_list_items
    where shopping_list_items.product_id = source_id
    on conflict (user_id, product_id) do update
    set
      quantity = least(99, target_item.quantity + excluded.quantity),
      name = excluded.name,
      unit = excluded.unit,
      updated_at = greatest(target_item.updated_at, excluded.updated_at);
    get diagnostics affected = row_count;
    moved_shopping_items := moved_shopping_items + affected;

    delete from public.shopping_list_items
    where product_id = source_id;

    insert into public.watchlist_items as target_item (
      user_id,
      product_id,
      store_id,
      name,
      store,
      target_price,
      latest_price,
      created_at
    )
    select
      watchlist_items.user_id,
      p_target_product_id,
      watchlist_items.store_id,
      target_name,
      watchlist_items.store,
      watchlist_items.target_price,
      watchlist_items.latest_price,
      watchlist_items.created_at
    from public.watchlist_items
    where watchlist_items.product_id = source_id
    on conflict (user_id, product_id)
      where product_id is not null
    do update
    set
      name = excluded.name,
      store_id = coalesce(target_item.store_id, excluded.store_id),
      store = case
        when target_item.store_id is not null then target_item.store
        when excluded.store_id is not null then excluded.store
        else target_item.store
      end,
      target_price = coalesce(
        nullif(trim(target_item.target_price), ''),
        excluded.target_price
      ),
      latest_price = coalesce(
        nullif(trim(target_item.latest_price), ''),
        excluded.latest_price
      ),
      created_at = least(target_item.created_at, excluded.created_at);
    get diagnostics affected = row_count;
    moved_watchlist_items := moved_watchlist_items + affected;

    delete from public.watchlist_items
    where product_id = source_id;

    delete from public.sale_alerts as source_alert
    using public.sale_alerts as target_alert
    where source_alert.product_id = source_id
      and position('|' in source_alert.alert_key) > 0
      and target_alert.user_id = source_alert.user_id
      and target_alert.id <> source_alert.id
      and target_alert.alert_key = (
        p_target_product_id::text
        || substring(
          source_alert.alert_key
          from position('|' in source_alert.alert_key)
        )
      );
    get diagnostics affected = row_count;
    moved_sale_alerts := moved_sale_alerts + affected;

    update public.sale_alerts
    set
      product_id = p_target_product_id,
      alert_key = case
        when position('|' in alert_key) > 0 then
          p_target_product_id::text
          || substring(alert_key from position('|' in alert_key))
        else alert_key
      end
    where product_id = source_id;
    get diagnostics affected = row_count;
    moved_sale_alerts := moved_sale_alerts + affected;

    update public.product_identity_reviews
    set
      product_id = case when product_id = source_id then p_target_product_id else product_id end,
      resolved_product_id = case
        when resolved_product_id = source_id then p_target_product_id
        else resolved_product_id
      end,
      candidate_product_ids = array_remove(candidate_product_ids, source_id),
      candidate_count = greatest(0, candidate_count - case when source_id = any(candidate_product_ids) then 1 else 0 end)
    where product_id = source_id
      or resolved_product_id = source_id
      or source_id = any(candidate_product_ids);

    delete from public.products
    where id = source_id;
  end loop;

  if p_review_id is not null then
    update public.product_identity_reviews
    set
      status = 'resolved',
      resolved_by = auth.uid(),
      resolved_at = now(),
      resolved_product_id = p_target_product_id,
      resolution_action = 'merged'
    where id = p_review_id
      and status = 'pending';
  end if;

  insert into public.admin_audit_logs (
    actor_user_id,
    actor_email,
    action,
    entity_type,
    entity_id,
    summary,
    metadata
  )
  select
    auth.uid(),
    auth.users.email,
    'merge_products',
    'product',
    p_target_product_id::text,
    format('Merged %s product(s) into %s', cardinality(source_ids), target_name),
    jsonb_build_object(
      'source_product_ids', to_jsonb(source_ids),
      'target_product_id', p_target_product_id,
      'review_id', p_review_id,
      'moved_prices', moved_prices,
      'merged_price_conflicts', merged_price_conflicts,
      'moved_shopping_items', moved_shopping_items,
      'moved_watchlist_items', moved_watchlist_items,
      'moved_sale_alerts', moved_sale_alerts
    )
  from auth.users
  where auth.users.id = auth.uid();

  return jsonb_build_object(
    'source_product_ids', to_jsonb(source_ids),
    'target_product_id', p_target_product_id,
    'moved_prices', moved_prices,
    'merged_price_conflicts', merged_price_conflicts,
    'moved_shopping_items', moved_shopping_items,
    'moved_watchlist_items', moved_watchlist_items,
    'moved_sale_alerts', moved_sale_alerts
  );
end;
$$;

revoke all on function public.merge_products(uuid[], uuid, uuid) from public, anon;
grant execute on function public.merge_products(uuid[], uuid, uuid) to authenticated;

update public.shopping_list_items as item
set name = coalesce(nullif(trim(product.english_name), ''), product.korean_name)
from public.products as product
where item.product_id = product.id
  and item.name is distinct from coalesce(nullif(trim(product.english_name), ''), product.korean_name);

update public.watchlist_items as item
set name = coalesce(nullif(trim(product.english_name), ''), product.korean_name)
from public.products as product
where item.product_id = product.id
  and item.name is distinct from coalesce(nullif(trim(product.english_name), ''), product.korean_name);

select public.seed_existing_product_identity_reviews();

notify pgrst, 'reload schema';
