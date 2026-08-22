-- Foreign-key indexes used by joins and cascading updates/deletes.
create index if not exists admin_audit_logs_actor_user_idx
  on public.admin_audit_logs(actor_user_id);
create index if not exists product_identity_reviews_created_by_idx
  on public.product_identity_reviews(created_by);
create index if not exists product_identity_reviews_product_idx
  on public.product_identity_reviews(product_id);
create index if not exists product_identity_reviews_resolved_by_idx
  on public.product_identity_reviews(resolved_by);
create index if not exists product_identity_reviews_resolved_product_idx
  on public.product_identity_reviews(resolved_product_id);
create index if not exists push_delivery_tickets_alert_idx
  on public.push_delivery_tickets(alert_id);
create index if not exists push_delivery_tickets_push_token_idx
  on public.push_delivery_tickets(push_token_id);
create index if not exists sale_alerts_product_idx
  on public.sale_alerts(product_id);
create index if not exists sale_alerts_store_idx
  on public.sale_alerts(store_id);
create index if not exists sale_alerts_watchlist_item_idx
  on public.sale_alerts(watchlist_item_id);
create index if not exists shopping_list_items_product_idx
  on public.shopping_list_items(product_id);
create index if not exists watchlist_items_product_idx
  on public.watchlist_items(product_id);
create index if not exists watchlist_items_store_idx
  on public.watchlist_items(store_id);

create index if not exists product_prices_product_session_store_price_idx
  on public.product_prices(
    product_id,
    (coalesce(valid_from, observed_at)) desc,
    store_id,
    price
  ) include (valid_to);

-- Return distinct categories rather than transferring every product category row.
create or replace function public.list_product_categories()
returns table (category text)
language sql
stable
set search_path = public
as $$
  select distinct products.category
  from public.products
  where nullif(trim(products.category), '') is not null
  order by products.category;
$$;

revoke all on function public.list_product_categories() from public;
grant execute on function public.list_product_categories() to anon, authenticated;

-- Use indexed per-product lookups instead of materializing all historical prices.
create or replace function public.list_product_price_summaries(
  p_store_ids uuid[] default null
)
returns table (
  product_id uuid,
  current_price numeric,
  previous_price numeric,
  current_session_start timestamptz,
  current_session_end timestamptz,
  previous_session_start timestamptz,
  previous_session_end timestamptz,
  best_store_id uuid,
  best_store_brand text,
  best_store_name text,
  best_store_area text
)
language sql
stable
set search_path = public
as $$
  select
    product.id,
    current_price_row.price,
    previous_price_row.price,
    current_session.session_start,
    current_session.session_end,
    previous_session.session_start,
    previous_session.session_end,
    current_price_row.store_id,
    store.brand,
    store.name,
    store.area
  from public.products as product
  cross join lateral (
    select
      coalesce(price.valid_from, price.observed_at) as session_start,
      price.valid_to as session_end
    from public.product_prices as price
    where price.product_id = product.id
      and (p_store_ids is null or price.store_id = any(p_store_ids))
      and coalesce(price.valid_from, price.observed_at) <= now()
      and (price.valid_to is null or price.valid_to >= now())
    group by coalesce(price.valid_from, price.observed_at), price.valid_to
    order by session_start desc, session_end desc nulls first
    limit 1
  ) as current_session
  cross join lateral (
    select price.price, price.store_id
    from public.product_prices as price
    where price.product_id = product.id
      and (p_store_ids is null or price.store_id = any(p_store_ids))
      and coalesce(price.valid_from, price.observed_at) = current_session.session_start
      and price.valid_to is not distinct from current_session.session_end
    order by price.price, price.store_id, price.id
    limit 1
  ) as current_price_row
  left join lateral (
    select
      coalesce(price.valid_from, price.observed_at) as session_start,
      price.valid_to as session_end
    from public.product_prices as price
    where price.product_id = product.id
      and (p_store_ids is null or price.store_id = any(p_store_ids))
      and coalesce(price.valid_from, price.observed_at) < current_session.session_start
    group by coalesce(price.valid_from, price.observed_at), price.valid_to
    order by session_start desc, session_end desc nulls first
    limit 1
  ) as previous_session on true
  left join lateral (
    select price.price
    from public.product_prices as price
    where price.product_id = product.id
      and (p_store_ids is null or price.store_id = any(p_store_ids))
      and coalesce(price.valid_from, price.observed_at) = previous_session.session_start
      and price.valid_to is not distinct from previous_session.session_end
    order by price.price, price.store_id, price.id
    limit 1
  ) as previous_price_row on true
  left join public.stores as store on store.id = current_price_row.store_id;
$$;

revoke all on function public.list_product_price_summaries(uuid[]) from public;
grant execute on function public.list_product_price_summaries(uuid[]) to anon, authenticated;

-- Batch current and previous sale rows for shopping plans and sale alerts.
create or replace function public.list_product_recent_price_rows(p_product_ids uuid[])
returns table (
  id uuid,
  product_id uuid,
  store_id uuid,
  price numeric,
  observed_at timestamptz,
  valid_from timestamptz,
  valid_to timestamptz,
  store_brand text,
  store_name text,
  store_area text
)
language sql
stable
set search_path = public
as $$
  with session_catalog as (
    select
      source.product_id,
      source.store_id,
      coalesce(source.valid_from, source.observed_at) as session_start,
      source.valid_to as session_end
    from public.product_prices as source
    where source.product_id = any(coalesce(p_product_ids, '{}'::uuid[]))
    group by
      source.product_id,
      source.store_id,
      coalesce(source.valid_from, source.observed_at),
      source.valid_to
  ),
  active_sessions as (
    select
      session_catalog.*,
      row_number() over (
        partition by product_id, store_id
        order by session_start desc, session_end desc nulls first
      ) as active_rank
    from session_catalog
    where session_start <= now()
      and (session_end is null or session_end >= now())
  ),
  current_sessions as (
    select product_id, store_id, session_start, session_end, 1 as session_rank
    from active_sessions
    where active_rank = 1
  ),
  previous_sessions as (
    select product_id, store_id, session_start, session_end, 2 as session_rank
    from (
      select
        candidate.*,
        row_number() over (
          partition by candidate.product_id, candidate.store_id
          order by candidate.session_start desc, candidate.session_end desc nulls first
        ) as previous_rank
      from session_catalog as candidate
      join current_sessions as current
        using (product_id, store_id)
      where candidate.session_start < current.session_start
    ) as ranked_previous
    where previous_rank = 1
  ),
  selected_sessions as (
    select * from current_sessions
    union all
    select * from previous_sessions
  ),
  selected_prices as (
    select
      source.*,
      row_number() over (
        partition by source.product_id, source.store_id, session.session_rank
        order by source.price, source.id
      ) as price_rank
    from public.product_prices as source
    join selected_sessions as session
      on session.product_id = source.product_id
      and session.store_id = source.store_id
      and session.session_start = coalesce(source.valid_from, source.observed_at)
      and session.session_end is not distinct from source.valid_to
  )
  select
    selected.id,
    selected.product_id,
    selected.store_id,
    selected.price,
    selected.observed_at,
    selected.valid_from,
    selected.valid_to,
    store.brand,
    store.name,
    store.area
  from selected_prices as selected
  left join public.stores as store on store.id = selected.store_id
  where selected.price_rank = 1
  order by selected.product_id, selected.store_id, selected.valid_from desc nulls last;
$$;

revoke all on function public.list_product_recent_price_rows(uuid[]) from public;
grant execute on function public.list_product_recent_price_rows(uuid[]) to anon, authenticated;

notify pgrst, 'reload schema';
