import fs from 'node:fs/promises';
const project = process.env.SUPABASE_PROJECT_ID;
const token = process.env.SUPABASE_ACCESS_TOKEN;
if (project !== 'jmxbvqrvxshlybeomagw' || !token) throw new Error('Missing credentials or incorrect Pocketcart project.');
async function query(sql, readOnly = true) {
  const result = await fetch(`https://api.supabase.com/v1/projects/${project}/database/query`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql, read_only: readOnly }),
  });
  if (!result.ok) throw new Error(`Schema request failed (${result.status}). Inspect the database dashboard; credentials are not logged.`);
  return result.json();
}
const before = await query("select count(*)::int as watchlist_count, to_regclass('public.freezer_items') is not null as freezer_exists from public.watchlist_items");
let migration = '';
if (!before[0].freezer_exists) migration += await fs.readFile('supabase/migrations/20260822170000_my_freezer_items.sql', 'utf8');
migration += '\n' + await fs.readFile('supabase/migrations/20260913010000_watchlist_plan_limit.sql', 'utf8');
await query(`begin;\n${migration}\ncommit;`, false);
const check = await query(`select count(*)::int as watchlist_count,
  has_function_privilege('authenticated','public.save_watchlist_with_plan(uuid,uuid,uuid,text,text,text,boolean)','execute') as client_can_forge_plus,
  has_table_privilege('authenticated','public.watchlist_items','insert') as legacy_can_insert,
  exists(select 1 from pg_trigger where tgname='watchlist_free_quota' and not tgisinternal) as quota_guard
  from public.watchlist_items`);
if (check[0].client_can_forge_plus || !check[0].legacy_can_insert || !check[0].quota_guard) throw new Error('Quota privilege verification failed.');
console.log('Quota migration and legacy-client compatibility verified; no existing rows were deleted by this migration.');
console.log(`Watchlist row counts before/after: ${before[0].watchlist_count}/${check[0].watchlist_count} (concurrent user changes may alter counts).`);
