// Isolated DB only. PGLITE_MODULE points to a locally installed @electric-sql/pglite.
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const { PGlite } = await import(process.env.PGLITE_MODULE ?? "@electric-sql/pglite");
const db = new PGlite();
await db.exec(`create role anon; create role authenticated; create schema auth; create schema storage;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('app.uid',true),'')::uuid$$;
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
alter table storage.objects enable row level security;
grant usage on schema auth,storage to authenticated,anon;
grant execute on function auth.uid() to authenticated,anon;
grant select,insert,update,delete on storage.objects to authenticated;
`);
const migration = await fs.readFile("supabase/migrations/20260916010000_receipts.sql", "utf8");
await db.exec(migration);
await db.exec(migration);
const uid = (n) => `10000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
await db.query("insert into auth.users values($1),($2)", [uid(1), uid(2)]);
const as = async (n) => {
  await db.exec("reset role");
  await db.query("select set_config('app.uid',$1,false)", [n ? uid(n) : ""]);
  await db.exec(n ? "set role authenticated" : "set role anon");
};
const item = [{ name: "Milk", quantity: 2, unitPriceCents: 500, lineTotalCents: 1000 }];
const insert = (id = uid(10), owner = uid(1), items = item) =>
  db.query(
    `insert into public.receipts(id,user_id,store_name,purchased_on,currency,total_cents,tax_cents,items,photo_path) values($1,$2,'Market','2026-09-15','CAD',1130,130,$3,$4) returning *`,
    [id, owner, JSON.stringify(items), `${owner}/${id}.jpg`],
  );
await as(0);
await assert.rejects(db.query("select * from public.receipts"), /permission denied/);
await assert.rejects(db.query("select public.claim_receipt_scan()"), /permission denied/);
await as(1);
await assert.rejects(insert(uid(11), uid(2)), /row-level security/);
for (const items of [
  [],
  [{ ...item[0], quantity: 0 }],
  [{ ...item[0], lineTotalCents: 1.2 }],
  [{ ...item[0], name: null }],
  [{ ...item[0], unitPriceCents: -1 }],
])
  await assert.rejects(insert(uid(12), uid(1), items), /check constraint/);
const row = (await insert()).rows[0];
await db.query("insert into storage.objects(bucket_id,name) values($1,$2)", [
  "receipts",
  `${uid(1)}/${uid(10)}.jpg`,
]);
await assert.rejects(
  db.query("insert into storage.objects(bucket_id,name) values($1,$2)", [
    "receipts",
    `${uid(2)}/${uid(10)}.jpg`,
  ]),
  /row-level security/,
);
await assert.rejects(
  db.query("update public.receipts set user_id=$1 where id=$2", [uid(2), uid(10)]),
  /identity cannot change/,
);
await db.query("update public.receipts set total_cents=1200 where id=$1", [uid(10)]);
assert.equal(
  (
    await db.query(
      "update public.receipts set total_cents=1400 where id=$1 and updated_at=$2 returning id",
      [uid(10), row.updated_at],
    )
  ).rows.length,
  0,
);
assert.equal((await db.query("delete from public.receipts returning id")).rows.length, 0);
assert.equal((await db.query("delete from storage.objects returning id")).rows.length, 0);
await as(2);
assert.equal((await db.query("select * from public.receipts")).rows.length, 0);
assert.equal((await db.query("select * from storage.objects")).rows.length, 0);
assert.equal(
  (await db.query("update public.receipts set total_cents=1 returning id")).rows.length,
  0,
);
assert.equal((await db.query("delete from storage.objects returning id")).rows.length, 0);
await as(1);
for (let i = 0; i < 30; i++)
  assert.equal(
    (await db.query("select public.claim_receipt_scan() claimed")).rows[0].claimed,
    true,
  );
assert.equal((await db.query("select public.claim_receipt_scan() claimed")).rows[0].claimed, false);
await assert.rejects(db.query("update public.receipt_scan_usage set scans=0"), /permission denied/);
await as(2);
assert.equal((await db.query("select public.claim_receipt_scan() claimed")).rows[0].claimed, true);
await as(1);
await db.query("update public.receipts set deleted_at=now() where id=$1", [uid(10)]);
assert.equal(
  (await db.query("select * from public.receipts where deleted_at is null")).rows.length,
  0,
);
await assert.rejects(db.query("update public.receipts set deleted_at=null"), /cannot be restored/);
assert.equal((await db.query("delete from storage.objects returning id")).rows.length, 1);
assert.equal((await db.query("delete from public.receipts returning id")).rows.length, 1);
await insert(uid(20));
await db.exec("reset role");
await db.query("delete from auth.users where id=$1", [uid(1)]);
assert.equal((await db.query("select * from public.receipts")).rows.length, 0);
assert.equal(
  (await db.query("select * from public.receipt_scan_usage where user_id=$1", [uid(1)])).rows
    .length,
  0,
);
console.log(
  "Receipts DB passed: migration retry, validation, owner isolation, photo policies, optimistic edits, deletion, scan quota and account cascade.",
);
await db.close();
