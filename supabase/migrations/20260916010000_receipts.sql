-- Personal receipts. Applying this migration to production requires explicit approval.
begin;
create or replace function public.valid_receipt_items(items jsonb) returns boolean
language plpgsql immutable set search_path = public as $$
declare item jsonb;
begin
  if jsonb_typeof(items) is distinct from 'array' or jsonb_array_length(items) not between 1 and 200 then return false; end if;
  for item in select value from jsonb_array_elements(items) loop
    if jsonb_typeof(item) is distinct from 'object'
      or jsonb_typeof(item->'name') is distinct from 'string'
      or length(trim(item->>'name')) not between 1 and 200
      or jsonb_typeof(item->'quantity') is distinct from 'number'
      or (item->>'quantity')::numeric <= 0 or (item->>'quantity')::numeric > 10000
      or (item->>'quantity')::numeric <> round((item->>'quantity')::numeric,3)
      or jsonb_typeof(item->'lineTotalCents') is distinct from 'number'
      or (item->>'lineTotalCents')::numeric not between 0 and 100000000
      or (item->>'lineTotalCents')::numeric <> trunc((item->>'lineTotalCents')::numeric)
      or not (item ? 'unitPriceCents') then return false; end if;
    if item->'unitPriceCents' <> 'null'::jsonb and (
      jsonb_typeof(item->'unitPriceCents') is distinct from 'number'
      or (item->>'unitPriceCents')::numeric not between 0 and 100000000
      or (item->>'unitPriceCents')::numeric <> trunc((item->>'unitPriceCents')::numeric)) then return false; end if;
  end loop;
  return true;
exception when others then return false;
end $$;

create table if not exists public.receipts (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  store_name text not null check(length(trim(store_name)) between 1 and 160),
  purchased_on date not null check(purchased_on between '2000-01-01' and '2100-12-31'),
  currency text not null check(currency in ('CAD','USD','EUR','GBP','AUD')),
  total_cents integer not null check(total_cents between 0 and 100000000),
  tax_cents integer not null default 0 check(tax_cents between 0 and 100000000),
  discount_cents integer not null default 0 check(discount_cents between 0 and 100000000),
  items jsonb not null check(public.valid_receipt_items(items)),
  photo_path text check(photo_path is null or photo_path in (user_id::text || '/' || id::text || '.jpg', user_id::text || '/' || id::text || '.png')),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  deleted_at timestamptz
);
create index if not exists receipts_user_date_idx on public.receipts(user_id,purchased_on desc,id) where deleted_at is null;
create or replace function public.receipts_update_guard() returns trigger
language plpgsql set search_path=public as $$
begin
  if new.id <> old.id or new.user_id <> old.user_id or new.created_at <> old.created_at
    or new.photo_path is distinct from old.photo_path then raise exception 'Receipt identity cannot change'; end if;
  if old.deleted_at is not null and new.deleted_at is null then raise exception 'Deleted receipts cannot be restored'; end if;
  new.updated_at := clock_timestamp();
  return new;
end $$;
drop trigger if exists receipts_update_guard on public.receipts;
create trigger receipts_update_guard before update on public.receipts for each row execute function public.receipts_update_guard();
alter table public.receipts enable row level security;
revoke all on public.receipts from anon, authenticated;
grant select, insert, update, delete on public.receipts to authenticated;
drop policy if exists receipts_select on public.receipts;
create policy receipts_select on public.receipts for select to authenticated using(user_id=(select auth.uid()));
drop policy if exists receipts_insert on public.receipts;
create policy receipts_insert on public.receipts for insert to authenticated with check(user_id=(select auth.uid()) and deleted_at is null);
drop policy if exists receipts_update on public.receipts;
create policy receipts_update on public.receipts for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
drop policy if exists receipts_delete on public.receipts;
create policy receipts_delete on public.receipts for delete to authenticated using(user_id=(select auth.uid()) and deleted_at is not null);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('receipts','receipts',false,6000000,array['image/jpeg','image/png'])
on conflict(id) do update set public=false,file_size_limit=6000000,allowed_mime_types=array['image/jpeg','image/png'];
drop policy if exists receipt_photos_read on storage.objects;
create policy receipt_photos_read on storage.objects for select to authenticated using(
  bucket_id='receipts' and split_part(name,'/',1)=(select auth.uid())::text
);
drop policy if exists receipt_photos_insert on storage.objects;
create policy receipt_photos_insert on storage.objects for insert to authenticated with check(
  bucket_id='receipts' and split_part(name,'/',1)=(select auth.uid())::text
  and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png)$'
);
-- Photos are immutable: retries reuse the same path; no UPDATE policy.
drop policy if exists receipt_photos_delete on storage.objects;
create policy receipt_photos_delete on storage.objects for delete to authenticated using(
  bucket_id='receipts' and split_part(name,'/',1)=(select auth.uid())::text
  and not exists(select 1 from public.receipts r where r.photo_path=name and r.deleted_at is null)
);

-- Server-enforced daily scan limit, with an atomic claim before invoking the paid API.
create table if not exists public.receipt_scan_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null default current_date,
  scans integer not null default 0,
  primary key(user_id,day)
);
alter table public.receipt_scan_usage enable row level security;
revoke all on public.receipt_scan_usage from anon,authenticated;
create or replace function public.claim_receipt_scan() returns boolean
language plpgsql security definer set search_path=public as $$
declare claimed integer;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  insert into public.receipt_scan_usage(user_id,day,scans) values(auth.uid(),current_date,1)
  on conflict(user_id,day) do update set scans=receipt_scan_usage.scans+1 where receipt_scan_usage.scans < 30
  returning scans into claimed;
  return claimed is not null;
end $$;
revoke all on function public.claim_receipt_scan() from public,anon;
grant execute on function public.claim_receipt_scan() to authenticated;
commit;
