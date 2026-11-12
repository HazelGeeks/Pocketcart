alter table public.feed_posts add column is_anonymous boolean not null default false,
  add column author_label text;
grant insert (is_anonymous) on public.feed_posts to authenticated;

-- Only reveal a profile name after its author can see the byline in the composer.
-- Legacy posts get a stable public handle rather than a retroactively revealed name.
update public.feed_posts set author_label = 'Shopper ' || upper(left(md5(author_id::text), 8));
create function public.my_feed_name() returns text language sql stable security definer set search_path = '' as $$
  select case when auth.uid() is not null then coalesce(
    (select nullif(left(btrim(p.full_name),48),'') from public.profiles p where p.id=auth.uid()
      and p.full_name not like '%@%'), 'Shopper ' || upper(left(md5(auth.uid()::text),8))) end
$$;
revoke all on function public.my_feed_name() from public, anon;
grant execute on function public.my_feed_name() to authenticated;

create table public.feed_comments (
  id uuid primary key, post_id uuid not null references public.feed_posts on delete cascade,
  author_id uuid not null default auth.uid() references auth.users on delete cascade,
  author_label text not null default public.my_feed_name(),
  body text not null check (char_length(body) between 1 and 255 and body ~ '[^[:space:]]'),
  created_at timestamptz not null default now()
);
create index feed_comments_thread on public.feed_comments(post_id,created_at desc,id desc);
create index feed_comments_author on public.feed_comments(author_id);
create table public.feed_likes (
  post_id uuid not null references public.feed_posts on delete cascade,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  primary key(post_id,user_id)
);
create index feed_likes_user on public.feed_likes(user_id);
alter table public.feed_likes enable row level security;
alter table public.feed_comments enable row level security;
revoke all on public.feed_likes, public.feed_comments from public,anon,authenticated;
grant insert (id,post_id,body) on public.feed_comments to authenticated;
create policy comment_write on public.feed_comments for insert to authenticated with check(author_id=(select auth.uid()));
-- The client sets an explicit desired state, so retries never reverse the user's choice.
create function public.set_feed_like(target uuid, liked boolean) returns void
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or liked is null then raise exception 'Sign in to react'; end if;
 if liked then insert into public.feed_likes(post_id,user_id) values(target,auth.uid()) on conflict do nothing;
 else delete from public.feed_likes where post_id=target and user_id=auth.uid(); end if;
end $$;
revoke all on function public.set_feed_like(uuid,boolean) from public,anon;
grant execute on function public.set_feed_like(uuid,boolean) to authenticated;

drop policy feed_read on public.feed_posts;
create policy feed_own_read on public.feed_posts for select to authenticated using(author_id=(select auth.uid()));
revoke select on public.feed_posts from anon;
-- These two views explicitly project only public fields. Owner privileges allow cross-account
-- reads while the underlying tables and private photo object names stay inaccessible.
create or replace view public.community_feed with (security_invoker=false, security_barrier=true) as
select p.id,p.kind,p.sale_id,p.product,p.store,p.price,p.caption,
  case when not p.is_anonymous then p.photo_path end as photo_path,p.created_at,
  (select count(*) from public.feed_posts c where c.sale_id=p.id) as gotcha_count,
  case when p.is_anonymous then 'Anonymous' else p.author_label end as author_label,
  (p.is_anonymous and p.photo_path is not null) as anonymous_photo,
  (select count(*) from public.feed_comments c where c.post_id=p.id) as comment_count,
  (select count(*) from public.feed_likes l where l.post_id=p.id) as like_count,
  exists(select 1 from public.feed_likes l where l.post_id=p.id and l.user_id=(select auth.uid())) as liked_by_me
from public.feed_posts p;
create view public.community_comments with (security_barrier=true) as
select id,post_id,author_label,body,created_at from public.feed_comments;
revoke all on public.community_comments from public,anon,authenticated;
grant select on public.community_comments to anon,authenticated;

drop policy feed_photo_published on storage.objects;
create policy feed_photo_published on storage.objects for select to anon,authenticated
using(bucket_id='feed-photos' and exists(select 1 from public.community_feed p where p.photo_path=name));
create or replace function public.prepare_feed_post() returns trigger
language plpgsql set search_path='' as $$
begin
 new.author_label := case when not new.is_anonymous then public.my_feed_name() end;
 if new.sale_id is not null then
   select p.product,p.store,p.price into strict new.product,new.store,new.price
   from public.community_feed p where p.id=new.sale_id and p.sale_id is null;
 end if;
 if new.photo_path is not null and not exists(
   select 1 from storage.objects where bucket_id='feed-photos' and name=new.photo_path) then
   raise exception 'Upload the photo before publishing the post';
 end if;
 return new;
end $$;
