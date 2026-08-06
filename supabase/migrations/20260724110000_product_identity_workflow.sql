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

  select coalesce(
    nullif(trim(products.english_name), ''),
    nullif(trim(to_jsonb(products) ->> 'korean_name'), ''),
    to_jsonb(products) ->> 'name'
  ), products.unit
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

    update public.watchlist_items
    set product_id = p_target_product_id
    where product_id = source_id;
    get diagnostics affected = row_count;
    moved_watchlist_items := moved_watchlist_items + affected;

    update public.sale_alerts
    set product_id = p_target_product_id
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

select public.seed_existing_product_identity_reviews();

notify pgrst, 'reload schema';
