create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;

drop policy if exists admin_users_select_admin on public.admin_users;
create policy admin_users_select_admin
on public.admin_users
for select
to authenticated
using (public.is_admin());

drop policy if exists admin_users_insert_admin on public.admin_users;
create policy admin_users_insert_admin
on public.admin_users
for insert
to authenticated
with check (public.is_admin());

drop policy if exists admin_users_delete_admin on public.admin_users;
create policy admin_users_delete_admin
on public.admin_users
for delete
to authenticated
using (public.is_admin());

create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null check (char_length(email) <= 320 and position('@' in email) > 1),
  platform text not null default 'unknown' check (platform in ('ios', 'android', 'web', 'unknown')),
  details text,
  status text not null default 'open' check (status in ('open', 'in_review', 'completed', 'rejected')),
  source text not null default 'web',
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists account_deletion_requests_status_created_idx
  on public.account_deletion_requests(status, created_at desc);

create index if not exists account_deletion_requests_email_idx
  on public.account_deletion_requests(lower(email));

alter table public.account_deletion_requests enable row level security;

drop policy if exists account_deletion_requests_select_admin on public.account_deletion_requests;
create policy account_deletion_requests_select_admin
on public.account_deletion_requests
for select
to authenticated
using (public.is_admin());

drop policy if exists account_deletion_requests_update_admin on public.account_deletion_requests;
create policy account_deletion_requests_update_admin
on public.account_deletion_requests
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists account_deletion_requests_delete_admin on public.account_deletion_requests;
create policy account_deletion_requests_delete_admin
on public.account_deletion_requests
for delete
to authenticated
using (public.is_admin());

notify pgrst, 'reload schema';
