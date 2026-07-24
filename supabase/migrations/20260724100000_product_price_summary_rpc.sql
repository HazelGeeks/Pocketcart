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
  with scoped_prices as (
    select
      pp.id,
      pp.product_id,
      pp.store_id,
      pp.price,
      coalesce(pp.valid_from, pp.observed_at) as session_start,
      pp.valid_to as session_end
    from public.product_prices pp
    where p_store_ids is null or pp.store_id = any(p_store_ids)
  ),
  session_catalog as (
    select
      product_id,
      session_start,
      session_end
    from scoped_prices
    group by product_id, session_start, session_end
  ),
  active_sessions as (
    select
      sessions.*,
      row_number() over (
        partition by sessions.product_id
        order by sessions.session_start desc, sessions.session_end desc nulls first
      ) as session_rank
    from session_catalog sessions
    where
      sessions.session_start <= now()
      and (sessions.session_end is null or sessions.session_end >= now())
  ),
  current_sessions as (
    select product_id, session_start, session_end
    from active_sessions
    where session_rank = 1
  ),
  current_prices as (
    select
      prices.*,
      row_number() over (
        partition by prices.product_id
        order by prices.price asc, prices.store_id asc, prices.id asc
      ) as price_rank
    from scoped_prices prices
    join current_sessions current_session_row
      on current_session_row.product_id = prices.product_id
      and current_session_row.session_start = prices.session_start
      and current_session_row.session_end is not distinct from prices.session_end
  ),
  previous_sessions_ranked as (
    select
      sessions.*,
      row_number() over (
        partition by sessions.product_id
        order by sessions.session_start desc, sessions.session_end desc nulls first
      ) as session_rank
    from session_catalog sessions
    join current_sessions current_session_row using (product_id)
    where sessions.session_start < current_session_row.session_start
  ),
  previous_sessions as (
    select product_id, session_start, session_end
    from previous_sessions_ranked
    where session_rank = 1
  ),
  previous_prices as (
    select
      prices.*,
      row_number() over (
        partition by prices.product_id
        order by prices.price asc, prices.store_id asc, prices.id asc
      ) as price_rank
    from scoped_prices prices
    join previous_sessions previous_session_row
      on previous_session_row.product_id = prices.product_id
      and previous_session_row.session_start = prices.session_start
      and previous_session_row.session_end is not distinct from prices.session_end
  )
  select
    current_price_row.product_id,
    current_price_row.price as current_price,
    previous_price_row.price as previous_price,
    current_price_row.session_start as current_session_start,
    current_price_row.session_end as current_session_end,
    previous_price_row.session_start as previous_session_start,
    previous_price_row.session_end as previous_session_end,
    current_price_row.store_id as best_store_id,
    stores.brand as best_store_brand,
    stores.name as best_store_name,
    stores.area as best_store_area
  from current_prices current_price_row
  left join previous_prices previous_price_row
    on previous_price_row.product_id = current_price_row.product_id
    and previous_price_row.price_rank = 1
  left join public.stores stores
    on stores.id = current_price_row.store_id
  where current_price_row.price_rank = 1;
$$;

grant execute on function public.list_product_price_summaries(uuid[]) to anon, authenticated;
