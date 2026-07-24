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
