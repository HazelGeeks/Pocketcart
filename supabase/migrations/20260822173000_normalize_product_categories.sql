create or replace function public.canonical_product_category(value text)
returns text
language sql
immutable
strict
set search_path = pg_catalog
as $$
  select case
    when regexp_replace(lower(trim(value)), '[^a-z0-9]+', '', 'g') in
      ('bakery', 'bakerysnacks')
      then 'Bakery'
    when regexp_replace(lower(trim(value)), '[^a-z0-9]+', '', 'g') in
      ('baverage', 'baverages', 'beverage', 'beverages', 'dairybeverage')
      then 'Beverages'
    when regexp_replace(lower(trim(value)), '[^a-z0-9]+', '', 'g') in
      ('frozen', 'frozenfood', 'frozenfoods', 'frozenmeal')
      then 'Frozen Food'
    when regexp_replace(lower(trim(value)), '[^a-z0-9]+', '', 'g') in
      ('houseware', 'kitchen')
      then 'Houseware'
    when regexp_replace(lower(trim(value)), '[^a-z0-9]+', '', 'g') in
      ('noodle', 'noodles')
      then 'Noodles'
    when regexp_replace(lower(trim(value)), '[^a-z0-9]+', '', 'g') in
      ('preparedfood', 'preparedfoods')
      then 'Prepared Foods'
    when regexp_replace(lower(trim(value)), '[^a-z0-9]+', '', 'g') in
      ('readymeal', 'readymeals', 'readytoeat', 'readytoeatmeal', 'readytoeatmeals')
      then 'Ready Meals'
    when regexp_replace(lower(trim(value)), '[^a-z0-9]+', '', 'g') in
      ('rice', 'ricegrain', 'ricegrains')
      then 'Rice & Grains'
    when regexp_replace(lower(trim(value)), '[^a-z0-9]+', '', 'g') in
      ('ricecake', 'ricecakes')
      then 'Rice Cakes'
    when regexp_replace(lower(trim(value)), '[^a-z0-9]+', '', 'g') in
      (
        'condiment',
        'condiments',
        'sauce',
        'sauces',
        'saucecondiment',
        'saucecondiments',
        'saucepaste',
        'sauceseasoning',
        'saucescondiments'
      )
      then 'Sauces & Condiments'
    when regexp_replace(lower(trim(value)), '[^a-z0-9]+', '', 'g') in
      ('seafood', 'seafoodsnack')
      then 'Seafood'
    when regexp_replace(lower(trim(value)), '[^a-z0-9]+', '', 'g') in
      ('snack', 'snacks')
      then 'Snacks'
    else trim(value)
  end;
$$;

update public.products
set category = public.canonical_product_category(category)
where category is distinct from public.canonical_product_category(category);

update public.products
set category = case id
  when '7904a16e-aa03-4b8e-a865-56696175aab1'::uuid then 'Instant Noodles'
  when 'a746db80-efd4-4517-bf9c-cfe3e24a7e9e'::uuid then 'Dairy'
  else category
end
where id in (
  '7904a16e-aa03-4b8e-a865-56696175aab1'::uuid,
  'a746db80-efd4-4517-bf9c-cfe3e24a7e9e'::uuid
);

create or replace function public.set_canonical_product_category()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.category := public.canonical_product_category(new.category);
  return new;
end;
$$;

drop trigger if exists products_set_canonical_category on public.products;
create trigger products_set_canonical_category
before insert or update of category
on public.products
for each row execute function public.set_canonical_product_category();

notify pgrst, 'reload schema';
