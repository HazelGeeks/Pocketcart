import fs from 'node:fs/promises';
const project = process.env.SUPABASE_PROJECT_ID;
const token = process.env.SUPABASE_ACCESS_TOKEN;
if (project !== 'jmxbvqrvxshlybeomagw' || !token) throw new Error('Missing credentials or incorrect Pocketcart project.');
async function query(sql, readOnly = true) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${project}/database/query`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql, read_only: readOnly }),
  });
  if (!response.ok) throw new Error(`Storage migration request failed (${response.status}). Credentials and SQL responses are not logged.`);
  return response.json();
}
const [before] = await query(`select to_regclass('public.families') is not null as family_exists,
  to_regclass('public.freezer_items') is not null as freezer_exists`);
if (!before.family_exists || !before.freezer_exists) throw new Error('Family sharing and My Freezer migrations are required first.');
const sql = await fs.readFile('supabase/migrations/20260914030000_named_freezer_storage.sql', 'utf8');
const appearanceSql = await fs.readFile("supabase/migrations/20260914040000_freezer_storage_appearance.sql", "utf8");
const deleteSql = await fs.readFile("supabase/migrations/20260914050000_freezer_storage_delete.sql", "utf8");
const productSql = await fs.readFile("supabase/migrations/20260914060000_freezer_product_images.sql", "utf8");
await query(`begin;\n${sql}\n${appearanceSql}\n${deleteSql}\n${productSql}\ncommit;`, false);
const [check] = await query(`select
  has_table_privilege('anon','public.freezer_storage_units','select') as anon_can_read,
  has_table_privilege('authenticated','public.freezer_storage_units','insert') as can_add,
  has_table_privilege('authenticated','public.freezer_storage_units','delete') as can_delete,
  exists(select 1 from pg_trigger where tgname='freezer_storage_assignment_guard' and not tgisinternal) as assignment_guard,
  exists(select 1 from pg_class where oid='public.freezer_storage_units'::regclass and relrowsecurity) as rls_enabled`);
if (check.anon_can_read || !check.can_add || !check.can_delete || !check.assignment_guard || !check.rls_enabled) throw new Error('Storage schema verification failed.');
console.log('Named refrigerator/freezer storage migration applied and access controls verified.');
