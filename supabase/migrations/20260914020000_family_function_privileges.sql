-- Supabase may grant EXECUTE directly to anon through its default privileges.
-- Revoking PUBLIC alone does not remove those direct grants.
revoke all on function public.current_family_id() from public, anon;
revoke all on function public.family_action(text,text) from public, anon;
revoke all on function public.save_family_cart(uuid,bigint,jsonb) from public, anon;
revoke all on function public.list_family_members() from public, anon;
revoke all on function public.guard_freezer_scope() from public, anon, authenticated;
revoke all on function public.family_before_user_delete() from public, anon, authenticated;
grant execute on function public.current_family_id(), public.family_action(text,text),
 public.save_family_cart(uuid,bigint,jsonb), public.list_family_members() to authenticated;
notify pgrst, 'reload schema';
