// Checks run inside the transaction; a failure rolls back SQL and history together.
export function featureChecks(migrations) {
  const versions = new Set(migrations.map((item) => item.version));
  const checks = [];
  if (versions.has("20261007020000")) checks.push(`
DO $pc_verify$ BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_class WHERE oid='public.published_blog_posts'::regclass AND reloptions @> ARRAY['security_invoker=true'])
    OR NOT EXISTS(SELECT 1 FROM storage.buckets WHERE id='blog-images' AND NOT public AND file_size_limit=5242880)
    OR NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='blog_images_published_read')
  THEN RAISE EXCEPTION 'Rich blog access verification failed'; END IF;
END $pc_verify$;`);
  if (versions.has("20261007010000")) checks.push(`
DO $pc_verify$ BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_class WHERE oid='public.blog_posts'::regclass AND relrowsecurity)
    OR has_table_privilege('anon','public.blog_posts','insert,update,delete')
    OR has_table_privilege('authenticated','public.blog_posts','delete')
    OR NOT has_table_privilege('anon','public.blog_posts','select')
    OR NOT has_table_privilege('authenticated','public.blog_posts','insert,update')
    OR NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='blog_posts_validate' AND NOT tgisinternal)
    OR NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='blog_posts' AND policyname='blog_posts_public_read' AND cmd='SELECT')
  THEN RAISE EXCEPTION 'Blog access verification failed'; END IF;
END $pc_verify$;`);
  if (versions.has("20260914010000") || versions.has("20260914020000")) checks.push(`
DO $pc_verify$ BEGIN
  IF has_table_privilege('authenticated','public.family_invites','select')
    OR has_table_privilege('authenticated','public.family_members','insert')
    OR NOT has_function_privilege('authenticated','public.family_action(text,text)','execute')
    OR has_function_privilege('anon','public.family_action(text,text)','execute')
    OR NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='family_user_delete' AND NOT tgisinternal)
  THEN RAISE EXCEPTION 'Family access verification failed'; END IF;
END $pc_verify$;`);
  if (migrations.some((item) => item.version >= "20260914030000" && item.version <= "20260914060000")) checks.push(`
DO $pc_verify$ BEGIN
  IF has_table_privilege('anon','public.freezer_storage_units','select')
    OR NOT has_table_privilege('authenticated','public.freezer_storage_units','insert')
    OR NOT has_table_privilege('authenticated','public.freezer_storage_units','delete')
    OR NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='freezer_storage_assignment_guard' AND NOT tgisinternal)
    OR NOT EXISTS(SELECT 1 FROM pg_class WHERE oid='public.freezer_storage_units'::regclass AND relrowsecurity)
  THEN RAISE EXCEPTION 'Storage access verification failed'; END IF;
END $pc_verify$;`);
  if (versions.has("20260924010000")) checks.push(`
DO $pc_verify$ BEGIN
  IF has_function_privilege('authenticated','public.save_watchlist_with_plan(uuid,uuid,uuid,text,text,text,boolean)','execute')
    OR NOT has_table_privilege('authenticated','public.watchlist_items','insert')
    OR EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='watchlist_free_quota' AND NOT tgisinternal)
  THEN RAISE EXCEPTION 'Free alert access verification failed'; END IF;
END $pc_verify$;`);
  if (versions.has("20260916010000")) checks.push(`
DO $pc_verify$ BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_class WHERE oid='public.receipts'::regclass AND relrowsecurity)
    OR has_table_privilege('anon','public.receipts','select')
    OR NOT has_function_privilege('authenticated','public.claim_receipt_scan()','execute')
    OR has_function_privilege('anon','public.claim_receipt_scan()','execute')
    OR NOT EXISTS(SELECT 1 FROM storage.buckets WHERE id='receipts' AND NOT public)
  THEN RAISE EXCEPTION 'Receipt access verification failed'; END IF;
END $pc_verify$;`);
  return checks;
}
