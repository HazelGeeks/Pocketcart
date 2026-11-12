-- Keep previously published captions readable and allow unrelated updates to legacy rows.
create function public.check_feed_caption_length() returns trigger
language plpgsql set search_path = '' as $$
begin
  if char_length(new.caption) > 255 then
    raise exception 'Keep your post to 255 characters.' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger feed_caption_length before insert or update of caption on public.feed_posts
for each row execute function public.check_feed_caption_length();
