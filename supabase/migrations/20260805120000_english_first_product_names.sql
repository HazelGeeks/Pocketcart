do $migration$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'name'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'korean_name'
  ) then
    alter table public.products rename column name to korean_name;
  end if;
end;
$migration$;

drop index if exists public.products_identity_key;
create unique index products_identity_key
  on public.products (
    lower(regexp_replace(trim(coalesce(brand, '')), '\s+', ' ', 'g')),
    lower(regexp_replace(trim(korean_name), '\s+', ' ', 'g')),
    lower(regexp_replace(trim(coalesce(unit, '')), '\s+', ' ', 'g')),
    lower(regexp_replace(trim(category), '\s+', ' ', 'g'))
  );

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

notify pgrst, 'reload schema';
