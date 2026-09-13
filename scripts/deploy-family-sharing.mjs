import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
const project = process.env.SUPABASE_PROJECT_ID;
const token = process.env.SUPABASE_ACCESS_TOKEN;
if (project !== 'jmxbvqrvxshlybeomagw' || !token) throw new Error('Missing credentials or incorrect Pocketcart project.');
async function query(sql, readOnly = true) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${project}/database/query`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql, read_only: readOnly }),
  });
  if (!response.ok) throw new Error(`Family schema request failed (${response.status}). Credentials and SQL responses are not logged.`);
  return response.json();
}
const sql = await fs.readFile('supabase/migrations/20260914010000_family_sharing.sql', 'utf8');
const marker = `Pocketcart family migration sha256:${createHash('sha256').update(sql).digest('hex')}`;
const [before] = await query(`select to_regclass('public.families') is not null as installed,
 to_regclass('public.freezer_items') is not null as freezer_exists,
 obj_description(to_regclass('public.families'),'pg_class') as marker`);
if (!before.freezer_exists) throw new Error('My Freezer prerequisite missing. No schema changes applied.');
if (before.installed && before.marker !== marker) throw new Error('Existing family schema has a different migration marker. Refusing to overwrite it.');
if (!before.installed) await query(`begin;\n${sql}\ncomment on table public.families is '${marker}';\ncommit;`, false);
await query(await fs.readFile("supabase/migrations/20260914020000_family_function_privileges.sql", "utf8"), false);
const [check] = await query(`select
 has_table_privilege('authenticated','public.family_invites','select') as can_read_invite_hashes,
 has_table_privilege('authenticated','public.family_members','insert') as can_forge_membership,
 has_function_privilege('authenticated','public.family_action(text,text)','execute') as can_join,
 has_function_privilege('anon','public.family_action(text,text)','execute') as anon_can_join,
 exists(select 1 from pg_trigger where tgname='family_user_delete' and not tgisinternal) as deletion_guard`);
if (check.can_read_invite_hashes || check.can_forge_membership || !check.can_join || check.anon_can_join || !check.deletion_guard) throw new Error('Family schema privilege verification failed.');
console.log('Family migration installed and access privileges verified. Existing personal inventories were not moved or deleted.');
