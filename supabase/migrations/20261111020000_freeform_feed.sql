-- Older clients may still send kind and structured sale details. New posts omit them.
alter table public.feed_posts
  alter column kind drop not null,
  drop constraint feed_posts_check1,
  add constraint feed_posts_has_content check (
    caption ~ '[^[:space:]]' or photo_path is not null
    or (kind is not null and kind = 'sale' and product is not null and store is not null and price is not null)
  );

create or replace function public.prepare_feed_post() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.sale_id is not null then
    select product, store, price into strict new.product, new.store, new.price
      from public.feed_posts where id = new.sale_id and sale_id is null;
  end if;
  if new.photo_path is not null and not exists (
    select 1 from storage.objects where bucket_id = 'feed-photos' and name = new.photo_path
  ) then
    raise exception 'Upload the photo before publishing the post';
  end if;
  return new;
end;
$$;
