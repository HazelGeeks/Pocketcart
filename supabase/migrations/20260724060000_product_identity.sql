alter table public.products
  add column if not exists brand text,
  add column if not exists gtin text;

drop index if exists public.products_identity_key;
do $migration$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'korean_name'
  ) then
    execute $sql$
      create unique index products_identity_key
        on public.products (
          lower(regexp_replace(trim(coalesce(brand, '')), '\s+', ' ', 'g')),
          lower(regexp_replace(trim(korean_name), '\s+', ' ', 'g')),
          lower(regexp_replace(trim(coalesce(unit, '')), '\s+', ' ', 'g')),
          lower(regexp_replace(trim(category), '\s+', ' ', 'g'))
        )
    $sql$;
  else
    execute $sql$
      create unique index products_identity_key
        on public.products (
          lower(regexp_replace(trim(coalesce(brand, '')), '\s+', ' ', 'g')),
          lower(regexp_replace(trim(name), '\s+', ' ', 'g')),
          lower(regexp_replace(trim(coalesce(unit, '')), '\s+', ' ', 'g')),
          lower(regexp_replace(trim(category), '\s+', ' ', 'g'))
        )
    $sql$;
  end if;
end;
$migration$;

create unique index if not exists products_gtin_key
  on public.products (regexp_replace(gtin, '\D', '', 'g'))
  where nullif(regexp_replace(gtin, '\D', '', 'g'), '') is not null;
