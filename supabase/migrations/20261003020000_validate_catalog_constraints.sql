-- Existing data was checked before deployment. Abort rather than change rows
-- if invalid coordinates or GTINs are introduced before this transaction.
alter table public.stores validate constraint stores_latitude_range;
alter table public.stores validate constraint stores_longitude_range;
alter table public.products validate constraint products_gtin_format_check;
