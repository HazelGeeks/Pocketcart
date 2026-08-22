do $$
declare
  canonical_product_id constant uuid := '2de03947-b7c0-4c20-abd3-58322f3b6391';
  duplicate_product_ids constant uuid[] := array[
    'a530aca2-8193-4ad3-b985-6e0264dd4e46'::uuid,
    '69d63e24-9061-49be-9b19-731e6642d1db'::uuid
  ];
  admin_user_id uuid;
  existing_count integer;
  valid_duplicate_count integer;
begin
  select count(*)
  into existing_count
  from public.products
  where id = canonical_product_id
    or id = any(duplicate_product_ids);

  -- Other environments may not contain this production data correction.
  if existing_count = 0 then
    return;
  end if;

  if not exists (
    select 1
    from public.products
    where id = canonical_product_id
      and english_name = 'Taiwan Cabbage'
      and public.normalize_product_unit(unit) = 'lb'
  ) then
    raise exception 'Taiwan Cabbage canonical product no longer matches the reviewed target';
  end if;

  select count(*)
  into valid_duplicate_count
  from public.products
  where id = any(duplicate_product_ids)
    and english_name in ('Taiwan Cabbage', 'Taiwan Cabbage (From BC)')
    and public.normalize_product_unit(unit) = 'lb';

  -- The correction is intentionally idempotent after both duplicates are merged.
  if valid_duplicate_count = 0 and existing_count = 1 then
    return;
  end if;
  if valid_duplicate_count <> cardinality(duplicate_product_ids) then
    raise exception 'Taiwan Cabbage duplicate products no longer match the reviewed sources';
  end if;

  select user_id
  into admin_user_id
  from public.admin_users
  order by created_at, user_id
  limit 1;

  if admin_user_id is null then
    raise exception 'An admin user is required to record the Taiwan Cabbage merge';
  end if;

  perform set_config('request.jwt.claim.sub', admin_user_id::text, true);
  perform public.merge_products_with_aliases(
    duplicate_product_ids,
    canonical_product_id,
    null
  );
end;
$$;
