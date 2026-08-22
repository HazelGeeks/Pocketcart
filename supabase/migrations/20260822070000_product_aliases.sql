create or replace function public.normalize_product_alias_name(value text)
returns text
language sql
immutable
strict
set search_path = pg_catalog
as $$
  select lower(regexp_replace(trim(value), '[[:space:][:punct:]]+', '', 'g'));
$$;

create or replace function public.normalize_product_unit(value text)
returns text
language plpgsql
immutable
set search_path = pg_catalog
as $$
declare
  compact text := lower(regexp_replace(trim(coalesce(value, '')), '[[:space:][:punct:]]+', '', 'g'));
begin
  return case
    when compact in ('lb', 'lbs', 'perlb', 'pound', 'pounds') then 'lb'
    when compact in ('kg', 'kgs', 'perkg', 'kilogram', 'kilograms') then 'kg'
    when compact in ('g', 'perg', 'gram', 'grams') then 'g'
    when compact in ('l', 'perl', 'liter', 'liters', 'litre', 'litres') then 'l'
    when compact in ('ml', 'perml', 'milliliter', 'milliliters', 'millilitre', 'millilitres') then 'ml'
    when compact in ('ea', 'each', 'perea', 'pereach') then 'ea'
    else compact
  end;
end;
$$;

create table if not exists public.product_aliases (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  alias_name text not null,
  unit text,
  alias_key text generated always as (public.normalize_product_alias_name(alias_name)) stored,
  unit_key text generated always as (public.normalize_product_unit(unit)) stored,
  created_at timestamptz not null default now(),
  constraint product_aliases_name_required check (nullif(trim(alias_name), '') is not null),
  constraint product_aliases_product_name_unit_unique unique (product_id, alias_key, unit_key)
);

create index if not exists product_aliases_lookup_idx
  on public.product_aliases(alias_key, unit_key);

alter table public.product_aliases enable row level security;

drop policy if exists product_aliases_select_public on public.product_aliases;
create policy product_aliases_select_public
on public.product_aliases
for select
to anon, authenticated
using (true);

drop policy if exists product_aliases_insert_admin on public.product_aliases;
create policy product_aliases_insert_admin
on public.product_aliases
for insert
to authenticated
with check (public.is_admin());

drop policy if exists product_aliases_update_admin on public.product_aliases;
create policy product_aliases_update_admin
on public.product_aliases
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists product_aliases_delete_admin on public.product_aliases;
create policy product_aliases_delete_admin
on public.product_aliases
for delete
to authenticated
using (public.is_admin());

create or replace function public.sync_product_primary_aliases()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.product_aliases (product_id, alias_name, unit)
  select new.id, names.alias_name, new.unit
  from unnest(array[new.english_name, new.korean_name]) as names(alias_name)
  where nullif(trim(names.alias_name), '') is not null
  on conflict (product_id, alias_key, unit_key) do nothing;
  return new;
end;
$$;

drop trigger if exists products_sync_primary_aliases on public.products;
create trigger products_sync_primary_aliases
after insert or update of english_name, korean_name, unit
on public.products
for each row execute function public.sync_product_primary_aliases();

insert into public.product_aliases (product_id, alias_name, unit)
select products.id, names.alias_name, products.unit
from public.products
cross join lateral unnest(array[products.english_name, products.korean_name]) as names(alias_name)
where nullif(trim(names.alias_name), '') is not null
on conflict (product_id, alias_key, unit_key) do nothing;

create or replace function public.merge_products_with_aliases(
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
  merge_result jsonb;
  preserved_aliases integer := 0;
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  insert into public.product_aliases (product_id, alias_name, unit)
  select p_target_product_id, aliases.alias_name, aliases.unit
  from public.product_aliases as aliases
  where aliases.product_id = any(coalesce(p_source_product_ids, '{}'::uuid[]))
    and aliases.product_id <> p_target_product_id
  on conflict (product_id, alias_key, unit_key) do nothing;
  get diagnostics preserved_aliases = row_count;

  merge_result := public.merge_products(
    p_source_product_ids,
    p_target_product_id,
    p_review_id
  );

  return merge_result || jsonb_build_object('preserved_aliases', preserved_aliases);
end;
$$;

revoke all on function public.merge_products_with_aliases(uuid[], uuid, uuid) from public, anon;
grant execute on function public.merge_products_with_aliases(uuid[], uuid, uuid) to authenticated;

notify pgrst, 'reload schema';
