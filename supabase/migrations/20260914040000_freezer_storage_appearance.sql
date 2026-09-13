-- Existing locations retain their identity, contents, type and access rules.
alter table public.freezer_storage_units
  add column if not exists emoji text
    check (emoji is null or emoji in ('🏠', '🧊', '❄️', '🥬', '🍎', '🥩', '🐟', '🍱')),
  add column if not exists color text not null default '#176B45'
    check (color in ('#176B45', '#245EA8', '#7050A0', '#A6531A', '#A83F65', '#167475', '#79563D', '#526174'));

notify pgrst, 'reload schema';
