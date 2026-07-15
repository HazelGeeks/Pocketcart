create table if not exists public.profile_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  interested_categories text[] not null default '{}',
  shopping_frequency text,
  favorite_stores text[] not null default '{}',
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint profile_preferences_frequency_check check (
    shopping_frequency is null or shopping_frequency in (
      'multiple_weekly',
      'weekly',
      'biweekly',
      'monthly'
    )
  )
);

alter table public.profile_preferences enable row level security;

drop policy if exists profile_preferences_select_own on public.profile_preferences;
create policy profile_preferences_select_own
on public.profile_preferences
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists profile_preferences_insert_own on public.profile_preferences;
create policy profile_preferences_insert_own
on public.profile_preferences
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists profile_preferences_update_own on public.profile_preferences;
create policy profile_preferences_update_own
on public.profile_preferences
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
