-- Keep one linked watchlist row per user and product before enforcing the
-- invariant. Prefer the row carrying the most store/price configuration.
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

-- Product merges performed before this guard may have moved product_id while
-- leaving the source product UUID at the beginning of alert_key. Normalize
-- those keys and keep the most useful record when two historical alerts become
-- the same logical alert.
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

  select products.name, products.unit
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
      candidate_count = greatest(
        0,
        candidate_count
          - case when source_id = any(candidate_product_ids) then 1 else 0 end
      )
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

notify pgrst, 'reload schema';
