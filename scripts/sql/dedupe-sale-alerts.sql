begin;

create temporary table sale_alert_cleanup_candidates on commit drop as
with keyed as (
  select
    sale_alerts.id,
    sale_alerts.user_id,
    sale_alerts.product_id,
    sale_alerts.store_id,
    sale_alerts.created_at,
    sale_alerts.push_sent_at,
    sale_alerts.read_at,
    case
      when sale_alerts.sale_started_at ~ '^\d{4}-\d{2}-\d{2}T' then
        (sale_alerts.sale_started_at::timestamptz at time zone 'America/Vancouver')::date
      when sale_alerts.sale_started_at ~ '^[A-Za-z]{3} \d{1,2}, \d{4}$' then
        to_date(sale_alerts.sale_started_at, 'Mon DD, YYYY')
      else null
    end as sale_date,
    sale_alerts.alert_key ~ '\|\d{4}-\d{2}-\d{2}t.*\.\..*\|' as canonical_key
  from public.sale_alerts
), ranked as (
  select
    keyed.*,
    row_number() over (
      partition by keyed.user_id, keyed.product_id, keyed.store_id, keyed.sale_date
      order by keyed.canonical_key desc, keyed.created_at, keyed.id
    ) as duplicate_rank,
    max(keyed.push_sent_at) over (
      partition by keyed.user_id, keyed.product_id, keyed.store_id, keyed.sale_date
    ) as merged_push_sent_at,
    max(keyed.read_at) over (
      partition by keyed.user_id, keyed.product_id, keyed.store_id, keyed.sale_date
    ) as merged_read_at,
    count(*) over (
      partition by keyed.user_id, keyed.product_id, keyed.store_id, keyed.sale_date
    ) as duplicate_count,
    count(*) filter (where keyed.canonical_key) over (
      partition by keyed.user_id, keyed.product_id, keyed.store_id, keyed.sale_date
    ) as canonical_count
  from keyed
  where keyed.product_id is not null
    and keyed.sale_date is not null
)
select *
from ranked
where ranked.duplicate_count > 1
  and ranked.canonical_count = 1;

update public.sale_alerts as target
set
  push_sent_at = coalesce(target.push_sent_at, candidate.merged_push_sent_at),
  read_at = coalesce(target.read_at, candidate.merged_read_at)
from sale_alert_cleanup_candidates as candidate
where candidate.duplicate_rank = 1
  and target.id = candidate.id;

delete from public.sale_alerts as target
using sale_alert_cleanup_candidates as candidate
where candidate.duplicate_rank > 1
  and target.id = candidate.id;

commit;
