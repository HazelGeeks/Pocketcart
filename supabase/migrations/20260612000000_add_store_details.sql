alter table public.stores
  add column if not exists address text,
  add column if not exists phone text,
  add column if not exists website text,
  add column if not exists hours text,
  add column if not exists store_type text not null default 'grocery',
  add column if not exists is_active boolean not null default true;

alter table public.stores drop constraint if exists stores_latitude_range;
alter table public.stores
  add constraint stores_latitude_range
  check (latitude >= -90 and latitude <= 90) not valid;

alter table public.stores drop constraint if exists stores_longitude_range;
alter table public.stores
  add constraint stores_longitude_range
  check (longitude >= -180 and longitude <= 180) not valid;
