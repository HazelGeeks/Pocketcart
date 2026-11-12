create table public.feed_posts (
  id uuid primary key,
  author_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check (kind in ('sale', 'gotcha')),
  sale_id uuid references public.feed_posts(id) on delete set null,
  product text check (length(trim(product)) between 1 and 120),
  store text check (length(trim(store)) between 1 and 120),
  price numeric(9,2) check (price between 0 and 9999999.99),
  caption text not null default '' check (length(caption) <= 500),
  photo_path text unique,
  created_at timestamptz not null default now(),
  check (photo_path is null or
    photo_path ~ ('^' || author_id::text || '/[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}[.]jpg$')),
  check ((kind = 'sale' and sale_id is null and product is not null and store is not null and price is not null)
      or (kind = 'gotcha' and photo_path is not null))
);
create index feed_posts_recent on public.feed_posts (created_at desc, id desc);
create index feed_posts_by_sale on public.feed_posts (sale_id, created_at desc, id desc) where sale_id is not null;
create index feed_posts_by_author on public.feed_posts (author_id);

alter table public.feed_posts enable row level security;
revoke all on public.feed_posts from public, anon, authenticated;
grant select on public.feed_posts to anon, authenticated;
grant insert (id, author_id, kind, sale_id, product, store, price, caption, photo_path)
  on public.feed_posts to authenticated;
create policy feed_read on public.feed_posts for select to anon, authenticated using (true);
create policy feed_publish on public.feed_posts for insert to authenticated
  with check (author_id = (select auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('feed-photos', 'feed-photos', false, 4194304, array['image/jpeg']);

create policy feed_photo_upload on storage.objects for insert to authenticated
with check (bucket_id = 'feed-photos' and name ~
  ('^' || (select auth.uid())::text || '/[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}[.]jpg$'));
create policy feed_photo_owner_read on storage.objects for select to authenticated
using (bucket_id = 'feed-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy feed_photo_published on storage.objects for select to anon, authenticated
using (bucket_id = 'feed-photos' and exists (
  select 1 from public.feed_posts p where p.photo_path = storage.objects.name
));
create policy feed_photo_discard on storage.objects for delete to authenticated
using (bucket_id = 'feed-photos' and (storage.foldername(name))[1] = (select auth.uid())::text
  and not exists (select 1 from public.feed_posts p where p.photo_path = storage.objects.name));

-- Keep a purchase's sale details even if the original author later closes their account.
create function public.prepare_feed_post() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.sale_id is not null then
    select product, store, price into strict new.product, new.store, new.price
      from public.feed_posts where id = new.sale_id and kind = 'sale';
  end if;
  if new.photo_path is not null and not exists (
    select 1 from storage.objects where bucket_id = 'feed-photos' and name = new.photo_path
  ) then
    raise exception 'Upload the photo before publishing the post';
  end if;
  return new;
end;
$$;
create trigger feed_post_prepare before insert on public.feed_posts
for each row execute function public.prepare_feed_post();

create view public.community_feed with (security_invoker = true) as
select p.id, p.kind, p.sale_id, p.product, p.store, p.price, p.caption, p.photo_path, p.created_at,
  (select count(*) from public.feed_posts child where child.sale_id = p.id) as gotcha_count
from public.feed_posts p;
revoke all on public.community_feed from public, anon, authenticated;
grant select on public.community_feed to anon, authenticated;
