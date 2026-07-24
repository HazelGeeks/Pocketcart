create table if not exists public.product_identity_reviews (
  id uuid primary key default gen_random_uuid(),
  review_key text not null,
  source text not null default 'csv_import',
  row_number integer,
  product_id uuid references public.products(id) on delete set null,
  reason text not null,
  match_method text,
  candidate_count integer not null default 0 check (candidate_count >= 0),
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'resolved')),
  created_by uuid references auth.users(id) on delete set null,
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.product_identity_reviews
  add column if not exists review_key text;

update public.product_identity_reviews
set review_key = id::text
where review_key is null;

alter table public.product_identity_reviews
  alter column review_key set not null;

create index if not exists product_identity_reviews_pending_created_idx
  on public.product_identity_reviews(status, created_at desc);

create unique index if not exists product_identity_reviews_pending_key
  on public.product_identity_reviews(review_key)
  where status = 'pending';

alter table public.product_identity_reviews enable row level security;

drop policy if exists product_identity_reviews_select_admin on public.product_identity_reviews;
create policy product_identity_reviews_select_admin
on public.product_identity_reviews
for select
to authenticated
using (public.is_admin());

drop policy if exists product_identity_reviews_insert_admin on public.product_identity_reviews;
create policy product_identity_reviews_insert_admin
on public.product_identity_reviews
for insert
to authenticated
with check (public.is_admin() and created_by = auth.uid());

drop policy if exists product_identity_reviews_update_admin on public.product_identity_reviews;
create policy product_identity_reviews_update_admin
on public.product_identity_reviews
for update
to authenticated
using (public.is_admin())
with check (
  public.is_admin()
  and (resolved_by is null or resolved_by = auth.uid())
);

revoke all on table public.product_identity_reviews from anon;
grant select, insert, update on table public.product_identity_reviews to authenticated;
