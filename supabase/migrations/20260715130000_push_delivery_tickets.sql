create table if not exists public.push_delivery_tickets (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid not null references public.sale_alerts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  push_token_id uuid references public.user_push_tokens(id) on delete set null,
  token text not null,
  expo_ticket_id text not null,
  status text not null default 'pending'
    check (status in ('pending', 'delivered', 'failed', 'expired')),
  error_code text,
  error_message text,
  checked_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists push_delivery_tickets_expo_ticket_unique
  on public.push_delivery_tickets(expo_ticket_id);

create index if not exists push_delivery_tickets_pending_created_idx
  on public.push_delivery_tickets(created_at)
  where status = 'pending';

create index if not exists push_delivery_tickets_user_created_idx
  on public.push_delivery_tickets(user_id, created_at desc);

alter table public.push_delivery_tickets enable row level security;

drop policy if exists push_delivery_tickets_select_own on public.push_delivery_tickets;
create policy push_delivery_tickets_select_own
on public.push_delivery_tickets
for select
to authenticated
using (auth.uid() = user_id);
