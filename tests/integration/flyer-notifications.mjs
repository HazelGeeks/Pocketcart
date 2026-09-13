// Run with PGLITE_MODULE=/absolute/path/to/@electric-sql/pglite/dist/index.js node tests/integration/flyer-notifications.mjs
// Uses an isolated PostgreSQL runtime, never a live Supabase project.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
const { PGlite } = await import(pathToFileURL(process.env.PGLITE_MODULE).href);
const db = new PGlite();
await db.exec(`
create role anon; create role authenticated; create role service_role;
create schema auth;
create table auth.users(id uuid primary key, is_anonymous boolean default false, deleted_at timestamptz);
create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('app.uid',true),'')::uuid $$;
create function auth.jwt() returns jsonb language sql as $$ select '{"email":"admin@example.com"}'::jsonb $$;
create function public.is_admin() returns boolean language sql as $$ select current_setting('app.admin',true) = 'true' $$;
create table public.stores(id uuid primary key, brand text, name text, is_active boolean);
create table public.user_push_tokens(user_id uuid references auth.users(id), enabled boolean);
create table public.sale_alerts(id uuid primary key default gen_random_uuid(),user_id uuid references auth.users(id),store_id uuid,title text,body text,alert_key text,unique(user_id,alert_key));
create table public.admin_audit_logs(actor_user_id uuid,actor_email text,action text,entity_type text,entity_id text,summary text);
insert into auth.users(id) select ('00000000-0000-0000-0000-'||lpad(i::text,12,'0'))::uuid from generate_series(1,32) i;
update auth.users set is_anonymous=true where id='00000000-0000-0000-0000-000000000032';
update auth.users set deleted_at=now() where id='00000000-0000-0000-0000-000000000031';
insert into public.stores values('11111111-1111-1111-1111-111111111111','Hannam Supermarket','Burnaby',true);
insert into public.stores values('22222222-2222-2222-2222-222222222222','Hannam Supermarket','Surrey',true);
insert into public.user_push_tokens values('00000000-0000-0000-0000-000000000002',true);
set app.uid='00000000-0000-0000-0000-000000000001';
`);
await db.exec(
  await readFile(
    new URL(
      "../../supabase/migrations/20260913230000_admin_flyer_notifications.sql",
      import.meta.url,
    ),
    "utf8",
  ),
);
const query = async (sql) => (await db.query(sql)).rows;
const create = (
  test = false,
  retailer = "Hannam Supermarket",
  date = "current_date",
) => `select public.create_flyer_notification('${retailer}',${date},${test}) id`;
await assert.rejects(query(create()), /Admin access required/); // null must fail closed
await db.exec("set app.admin='false'");
await assert.rejects(query(create()), /Admin access required/);
await assert.rejects(query("select public.flyer_notification_audience()"), /Admin access required/);
await assert.rejects(query("select public.flyer_notification_history()"), /Admin access required/);
await db.exec("set app.admin='true'");
assert.deepEqual((await query("select public.flyer_notification_audience() result"))[0].result, {
  users: 30,
  pushUsers: 1,
});
await assert.rejects(query(create(true)), /Enable notifications/);
await assert.rejects(query(create(false, undefined, "current_date + 1")), /valid Flyer start date/);
await assert.rejects(query(create(false, "Unknown retailer")), /active retailer/);
const id = (await query(create()))[0].id;
assert.equal((await query("select count(*)::int n from public.sale_alerts"))[0].n, 30);
assert.equal(
  (await query("select title from public.sale_alerts limit 1"))[0].title,
  "Hannam Supermarket flyer updated!",
);
await assert.rejects(query(create()), /duplicate key/);
await assert.rejects(query(create(false, "  hannam supermarket  ")), /duplicate key/);
assert.equal((await query("select count(*)::int n from public.sale_alerts"))[0].n, 30);
const ownAlertId = (await query(`select id from public.sale_alerts where user_id=auth.uid() and alert_key='flyer|${id}'`))[0].id;
const destination = (await query(`select public.flyer_notification_destination('${ownAlertId}') result`))[0].result;
assert.equal(destination.retailer, 'Hannam Supermarket');
assert.deepEqual(destination.storeIds, ['11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222']);
assert.equal((await query('select count(*)::int n from public.sale_alerts where store_id is not null'))[0].n, 0);
await db.exec("set app.uid='00000000-0000-0000-0000-000000000002'");
assert.equal((await query(`select public.flyer_notification_destination('${ownAlertId}') result`))[0].result, null);
await db.exec("set app.uid='00000000-0000-0000-0000-000000000001'");
await db.exec("update public.stores set is_active=false where id='22222222-2222-2222-2222-222222222222'");
assert.equal((await query(`select public.flyer_notification_destination('${ownAlertId}') result`))[0].result.storeIds.length, 1);
const first = await query(`select * from public.claim_flyer_notification('${id}')`);
const second = await query(`select * from public.claim_flyer_notification('${id}')`);
assert.equal(first.length, 10);
assert.equal(second.length, 10);
assert.equal(new Set([...first, ...second].map((r) => r.user_id)).size, 20);
const history = (await query("select public.flyer_notification_history() result"))[0].result[0];
assert.equal(history.pending, 10);
assert.equal(history.processing, 20);
assert.equal(history.users, 30);
await db.exec("set app.uid='00000000-0000-0000-0000-000000000002'");
const testId = (await query(create(true)))[0].id;
assert.equal(
  (
    await query(
      `select count(*)::int n from public.flyer_notification_recipients where campaign_id='${testId}'`,
    )
  )[0].n,
  1,
);
assert.equal(
  (await query(`select title from public.sale_alerts where alert_key='flyer|${testId}'`))[0].title,
  "[Test] Hannam Supermarket flyer updated!",
);
await db.exec("set role authenticated");
await assert.rejects(query(`select public.claim_flyer_notification('${id}')`), /permission denied/);
await assert.rejects(
  query(
    `insert into public.flyer_notifications(retailer,flyer_date,title,body) values('Forged',current_date,'Forged','Forged')`,
  ),
  /permission denied/,
);
await db.exec("reset role; set role anon");
await assert.rejects(query(create()), /permission denied/);
await assert.rejects(query("select public.flyer_notification_history()"), /permission denied/);
await db.close();
console.log(
  "PASS: admin authorization, audience, English copy, atomic inbox fan-out, retailer duplicate prevention and recipient-scoped retailer navigation, test isolation, bounded non-overlapping claims, history and RPC grants.",
);
