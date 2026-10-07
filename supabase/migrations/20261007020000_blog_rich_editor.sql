-- Rich text, private draft images, and publication times evaluated by the database.
alter table public.blog_posts drop constraint blog_posts_status_check;
alter table public.blog_posts add constraint blog_posts_status_check check (status in ('draft','published','scheduled'));
alter table public.blog_posts
  add column content jsonb,
  add column category text not null default 'Shopping tips' check (char_length(category) <= 80),
  add column author_name text not null default 'Pocketcart' check (char_length(author_name) <= 200),
  add column cover_image_path text,
  add column cover_image_alt text not null default '' check (char_length(cover_image_alt) <= 500),
  add column publish_at timestamptz,
  add column is_pinned boolean not null default false,
  add column image_paths text[] not null default '{}';

create function public.blog_sections_document(p_sections jsonb) returns jsonb
language sql immutable set search_path = public as $$
  select jsonb_build_object('type','doc','content',coalesce(jsonb_agg(node order by section_order,node_order),'[{"type":"paragraph"}]'::jsonb))
  from (
    select s.ordinality section_order,0::bigint node_order,
      jsonb_build_object('type','heading','attrs',jsonb_build_object('level',2),'content',jsonb_build_array(jsonb_build_object('type','text','text',s.value->>'heading'))) node
    from jsonb_array_elements(p_sections) with ordinality s where coalesce(s.value->>'heading','') <> ''
    union all
    select s.ordinality,p.ordinality,
      jsonb_build_object('type','paragraph','content',jsonb_build_array(jsonb_build_object('type','text','text',p.value)))
    from jsonb_array_elements(p_sections) with ordinality s cross join lateral jsonb_array_elements_text(s.value->'paragraphs') with ordinality p
  ) nodes;
$$;
revoke all on function public.blog_sections_document(jsonb) from public,anon;
grant execute on function public.blog_sections_document(jsonb) to authenticated,service_role;
update public.blog_posts set content = public.blog_sections_document(sections) where content is null;

create function public.validate_blog_document_node(p_node jsonb,p_depth integer default 0) returns integer
language plpgsql set search_path = public as $$
declare child jsonb; mark jsonb; count_nodes integer := 1; node_type text; image_path text; image_url text; link_url text;
begin
  node_type := p_node->>'type';
  if p_depth > 30 or jsonb_typeof(p_node) is distinct from 'object' or node_type is null or node_type not in
    ('doc','paragraph','heading','text','hardBreak','blockquote','bulletList','orderedList','listItem','codeBlock','horizontalRule','image','table','tableRow','tableCell','tableHeader')
  then raise exception 'Unsupported article content'; end if;
  if p_node ? 'attrs' and jsonb_typeof(p_node->'attrs') is distinct from 'object' then raise exception 'Invalid article attributes'; end if;
  if p_node ? 'text' and (node_type <> 'text' or jsonb_typeof(p_node->'text') is distinct from 'string') then raise exception 'Invalid article text'; end if;
  if node_type = 'image' then
    image_path := p_node->'attrs'->>'assetPath'; image_url := p_node->'attrs'->>'src';
    if coalesce(image_path,'') <> '' then
      if image_path !~ '^[a-f0-9-]{36}/[a-f0-9-]{36}\.(jpg|png|webp)$' then raise exception 'Invalid article image path'; end if;
    elsif image_url is null or image_url !~* '^https?://' or image_url ~ '[[:cntrl:][:space:]\\]' then raise exception 'Invalid article image URL'; end if;
  end if;
  if p_node ? 'marks' then
    if jsonb_typeof(p_node->'marks') is distinct from 'array' then raise exception 'Invalid article marks'; end if;
    for mark in select value from jsonb_array_elements(p_node->'marks') loop
      if coalesce(mark->>'type','') not in ('bold','italic','underline','strike','code','link','textStyle') then raise exception 'Unsupported article format'; end if;
      if mark->>'type' = 'link' then
        link_url := mark->'attrs'->>'href';
        if link_url is null or link_url !~* '^(https?://|mailto:|tel:|/($|[^/]))' or link_url ~ '[[:cntrl:][:space:]\\]' then raise exception 'Invalid article link'; end if;
      end if;
    end loop;
  end if;
  if p_node ? 'content' then
    if jsonb_typeof(p_node->'content') is distinct from 'array' then raise exception 'Invalid article blocks'; end if;
    for child in select value from jsonb_array_elements(p_node->'content') loop
      count_nodes := count_nodes + public.validate_blog_document_node(child,p_depth+1);
      if count_nodes > 5000 then raise exception 'Article has too many blocks'; end if;
    end loop;
  end if;
  return count_nodes;
end $$;
revoke all on function public.validate_blog_document_node(jsonb,integer) from public,anon;
grant execute on function public.validate_blog_document_node(jsonb,integer) to authenticated,service_role;

create or replace function public.validate_blog_post() returns trigger
language plpgsql set search_path = public as $$
declare asset_path text;
begin
  if tg_op = 'UPDATE' then
    if new.slug is distinct from old.slug or new.locale is distinct from old.locale then raise exception 'An existing article URL and language cannot be changed'; end if;
    new.created_at := old.created_at;
    -- Preserve edits made by an older client during the deployment transition.
    if new.sections is distinct from old.sections and new.content is not distinct from old.content then
      new.content := public.blog_sections_document(new.sections);
    end if;
  end if;
  if new.content is null then new.content := public.blog_sections_document(new.sections); end if;
  new.updated_at := clock_timestamp();
  if new.content->>'type' <> 'doc' or jsonb_typeof(new.content->'content') is distinct from 'array' or char_length(new.content::text) > 200000
  then raise exception 'Invalid or oversized article document'; end if;
  perform public.validate_blog_document_node(new.content);
  if new.status = 'scheduled' and new.publish_at is null then raise exception 'Scheduled articles need a publication time'; end if;
  if new.status <> 'draft' and (btrim(new.description) = '' or btrim(new.excerpt) = '' or btrim(new.category) = '' or btrim(new.author_name) = '' or not (
    exists(select 1 from jsonb_path_query(new.content,'$.** ? (@.type == "text").text') j where (j #>> '{}') ~ '[^[:space:]]')
    or exists(select 1 from jsonb_path_query(new.content,'$.** ? (@.type == "image")'))
  )) then raise exception 'Published articles need metadata and body content'; end if;
  select coalesce(array_agg(distinct value #>> '{}'),'{}') into new.image_paths
    from jsonb_path_query(new.content,'$.** ? (@.type == "image").attrs.assetPath') as images(value)
    where value #>> '{}' <> '';
  if new.cover_image_path is not null then new.image_paths := array_append(new.image_paths,new.cover_image_path); end if;
  foreach asset_path in array new.image_paths loop
    if asset_path !~ '^[a-f0-9-]{36}/[a-f0-9-]{36}\.(jpg|png|webp)$' then raise exception 'Invalid article image path'; end if;
  end loop;
  return new;
end $$;

-- A view applies the publication clock even when an admin reads the public website.
drop policy blog_posts_public_read on public.blog_posts;
create policy blog_posts_public_read on public.blog_posts for select to anon,authenticated
  using (status in ('published','scheduled') and (publish_at is null or publish_at <= now()));
create view public.published_blog_posts with (security_invoker = true) as
  select * from public.blog_posts where status in ('published','scheduled') and (publish_at is null or publish_at <= now());
revoke all on public.published_blog_posts from public,anon,authenticated;
grant select on public.published_blog_posts to anon,authenticated,service_role;
create index blog_posts_public_pinned_idx on public.blog_posts(is_pinned desc,published_on desc,slug,locale) where status in ('published','scheduled');

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('blog-images','blog-images',false,5242880,array['image/jpeg','image/png','image/webp']);
create policy blog_images_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'blog-images' and (select public.is_admin()) and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy blog_images_admin_read on storage.objects for select to authenticated
  using (bucket_id = 'blog-images' and (select public.is_admin()));
create policy blog_images_published_read on storage.objects for select to anon,authenticated
  using (bucket_id = 'blog-images' and exists (
    select 1 from public.published_blog_posts p where storage.objects.name = any(p.image_paths)
  ));
notify pgrst, 'reload schema';
