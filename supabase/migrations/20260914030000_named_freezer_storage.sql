-- Named appliances are owned either by one user or by a family, never both.
create table if not exists public.freezer_storage_units (
 id uuid primary key default gen_random_uuid(),
 user_id uuid references auth.users(id) on delete cascade,
 family_id uuid references public.families(id) on delete cascade,
 name text not null check (char_length(trim(name)) between 1 and 60),
 storage_area text not null check (storage_area in ('fridge', 'freezer')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check ((user_id is not null and family_id is null) or (user_id is null and family_id is not null))
);
create index if not exists freezer_storage_user_idx on public.freezer_storage_units(user_id) where user_id is not null;
create index if not exists freezer_storage_family_idx on public.freezer_storage_units(family_id) where family_id is not null;
alter table public.freezer_storage_units enable row level security;
revoke all on public.freezer_storage_units from anon, authenticated;
grant select, insert, update on public.freezer_storage_units to authenticated;
drop policy if exists storage_read on public.freezer_storage_units;
create policy storage_read on public.freezer_storage_units for select to authenticated
 using (user_id = auth.uid() or family_id = public.current_family_id());
drop policy if exists storage_insert on public.freezer_storage_units;
create policy storage_insert on public.freezer_storage_units for insert to authenticated
 with check (user_id = auth.uid() or family_id = public.current_family_id());
drop policy if exists storage_update on public.freezer_storage_units;
create policy storage_update on public.freezer_storage_units for update to authenticated
 using (user_id = auth.uid() or family_id = public.current_family_id())
 with check (user_id = auth.uid() or family_id = public.current_family_id());

create or replace function public.guard_freezer_storage_scope() returns trigger language plpgsql set search_path = public as $$
begin
 if new.storage_area is distinct from old.storage_area then
  raise exception 'Storage type cannot be changed after creation';
 end if;
 if current_user = 'authenticated' and (new.user_id is distinct from old.user_id or new.family_id is distinct from old.family_id) then
  raise exception 'Storage ownership cannot be changed directly';
 end if;
 new.updated_at := clock_timestamp();
 return new;
end $$;
revoke all on function public.guard_freezer_storage_scope() from public, anon, authenticated;
drop trigger if exists freezer_storage_scope_guard on public.freezer_storage_units;
create trigger freezer_storage_scope_guard before update on public.freezer_storage_units
 for each row execute function public.guard_freezer_storage_scope();

-- Existing food keeps its original fridge/freezer classification without losing data.
alter table public.freezer_items add column if not exists storage_unit_id uuid references public.freezer_storage_units(id) on delete set null;
create index if not exists freezer_items_storage_unit_idx on public.freezer_items(storage_unit_id) where storage_unit_id is not null;
create or replace function public.check_freezer_storage_assignment() returns trigger language plpgsql set search_path = public as $$
declare unit public.freezer_storage_units;
begin
 if new.storage_unit_id is null then return new; end if;
 select * into unit from public.freezer_storage_units where id = new.storage_unit_id for share;
 if not found or unit.storage_area <> new.storage_area
    or unit.family_id is distinct from new.family_id
    or (new.family_id is null and unit.user_id is distinct from new.user_id) then
  raise exception 'Choose a storage location from this inventory with the matching type';
 end if;
 return new;
end $$;
revoke all on function public.check_freezer_storage_assignment() from public, anon, authenticated;
drop trigger if exists freezer_storage_assignment_guard on public.freezer_items;
create trigger freezer_storage_assignment_guard before insert or update on public.freezer_items
 for each row execute function public.check_freezer_storage_assignment();

-- Import named locations, including empty ones, together with personal food.
create or replace function public.family_action(p_action text, p_value text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); f uuid; owner uuid; token text; invite public.family_invites; target uuid;
begin
 if u is null then raise exception 'Please sign in first'; end if;
 perform pg_advisory_xact_lock(hashtextextended(u::text, 42));
 select family_id into f from public.family_members where user_id = u;
 if p_action = 'create' then
  if f is not null then raise exception 'You already belong to a family'; end if;
  insert into public.families(name, owner_id) values (trim(p_value), u) returning id into f;
  insert into public.family_members(user_id,family_id) values (u,f);
  insert into public.family_carts(family_id) values (f);
 elsif p_action = 'join' then
  -- Lock the family before the invite, matching invite/revoke/leave lock order.
  select family_id into target from public.family_invites where token_hash = md5(p_value);
  perform 1 from public.families where id = target for update;
  select * into invite from public.family_invites where token_hash = md5(p_value) for update;
  if invite.family_id is null or invite.expires_at <= now() then raise exception 'This invite has expired or was already used. Ask for a new link.'; end if;
  if f = invite.family_id then return jsonb_build_object('family_id',f); end if;
  if f is not null then raise exception 'Leave your current family before joining another'; end if;
  insert into public.family_members(user_id,family_id) values(u,invite.family_id);
  delete from public.family_invites where token_hash = md5(p_value);
  f := invite.family_id;
 else
  if f is null then raise exception 'You do not belong to a family'; end if;
  select owner_id into owner from public.families where id = f for update;
  if f is distinct from public.current_family_id() then raise exception 'Family membership changed. Try again.'; end if;
  if p_action in ('invite','revoke','remove') and owner is distinct from u then raise exception 'Only the family owner can do this'; end if;
  if p_action = 'invite' then
   token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
   delete from public.family_invites where family_id = f;
   insert into public.family_invites(token_hash,family_id) values(md5(token), f);
   return jsonb_build_object('token', token);
  elsif p_action = 'revoke' then
   delete from public.family_invites where family_id = f;
  elsif p_action in ('leave','remove') then
   target := case when p_action = 'leave' then u else p_value::uuid end;
   if p_action = 'remove' and target = u then raise exception 'Use Leave family instead'; end if;
   delete from public.family_members where user_id = target and family_id = f;
   if not exists(select 1 from public.family_members where family_id = f) then
    delete from public.families where id = f;
   else
    update public.freezer_items set user_id = (select user_id from public.family_members where family_id = f order by joined_at,user_id limit 1) where family_id = f and user_id = target;
    update public.families set owner_id = (select user_id from public.family_members where family_id = f order by joined_at,user_id limit 1) where id = f and owner_id = target;
   end if;
   delete from public.family_invites where family_id = f;
  elsif p_action = 'import_freezer' then
   update public.freezer_storage_units set user_id = null, family_id = f where user_id = u and family_id is null;
   update public.freezer_items set family_id = f where user_id = u and family_id is null;
  else raise exception 'Unknown family action'; end if;
 end if;
 return jsonb_build_object('family_id',f);
end $$;
revoke all on function public.family_action(text,text) from public;
grant execute on function public.family_action(text,text) to authenticated;

notify pgrst, 'reload schema';
