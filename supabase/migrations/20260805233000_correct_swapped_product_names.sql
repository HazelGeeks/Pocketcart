-- Correct legacy rows where the English and Korean product names were imported
-- into the opposite columns. Keep resulting duplicate candidates separate so
-- an admin can review and merge their price histories explicitly.

drop index if exists public.products_identity_key;
drop index if exists public.products_identity_lookup_idx;

update public.products
set
  korean_name = english_name,
  english_name = korean_name
where english_name ~ '[가-힣]'
  and korean_name !~ '[가-힣]'
  and korean_name ~ '[A-Za-z]';

create index products_identity_lookup_idx
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
