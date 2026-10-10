// Disposable PostgreSQL engine; no network or production writes.
import assert from "node:assert/strict";
import fs from "node:fs";
import { migrationTransaction, sha256 } from "../../scripts/supabase-release-lib.mjs";
import { featureChecks } from "../../scripts/supabase-release-checks.mjs";
const { PGlite } = await import(process.env.PGLITE_MODULE ?? "@electric-sql/pglite");
const db = new PGlite();
await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
create schema auth; create table auth.users(id uuid primary key);
create table public.admin_users(user_id uuid primary key references auth.users(id));
insert into auth.users values('00000000-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-000000000002');
insert into public.admin_users values('00000000-0000-0000-0000-000000000001');
grant usage on schema public to anon,authenticated,service_role;`);
const source = fs.readFileSync(
  new URL("../../supabase/migrations/20261010010000_flyer_extraction_cache.sql", import.meta.url),
  "utf8",
);
const migration = {
  version: "20261010010000",
  name: "20261010010000_flyer_extraction_cache.sql",
  source,
  hash: sha256(source),
};
await db.exec(migrationTransaction([migration], { checks: featureChecks([migration]) }));
await db.exec(migrationTransaction([migration], { checks: featureChecks([migration]) }));
const admin = "00000000-0000-0000-0000-000000000001";
const key = "a".repeat(64);
for (const role of ["anon", "authenticated"]) {
  await db.exec(`set role ${role}`);
  await assert.rejects(db.query("select * from flyer_extraction_jobs"), /permission denied/);
  await assert.rejects(
    db.query("select claim_flyer_extraction($1,$2)", [admin, key]),
    /permission denied/,
  );
  await assert.rejects(
    db.query("select finish_flyer_extraction($1,$2,null)", [key, admin]),
    /permission denied/,
  );
  await db.exec("reset role");
}
await db.exec("set role service_role");
const claim = async (k, limit = 2) =>
  (await db.query("select claim_flyer_extraction($1,$2,$3,2) result", [admin, k, limit])).rows[0]
    .result;
await assert.rejects(
  db.query("select claim_flyer_extraction($1,$2)", ["00000000-0000-0000-0000-000000000002", key]),
  /Admin access required/,
);
const [first, duplicate] = await Promise.all([claim(key), claim(key)]);
assert.equal(first.state, "claimed");
assert.equal(duplicate.state, "busy");
assert.equal(
  (
    await db.query("select finish_flyer_extraction($1,$2,$3) ok", [
      key,
      admin,
      JSON.stringify({ rows: [] }),
    ])
  ).rows[0].ok,
  false,
);
const result = { rows: [{ englishName: "Milk" }], usage: { totalTokens: 100 } };
assert.equal(
  (
    await db.query("select finish_flyer_extraction($1,$2,$3) ok", [
      key,
      first.claimId,
      JSON.stringify(result),
    ])
  ).rows[0].ok,
  true,
);
assert.deepEqual(await claim(key), { state: "cached", result });
const second = await claim("b".repeat(64));
assert.equal(second.state, "claimed");
assert.equal((await claim("c".repeat(64))).state, "limited");
await db.query("select finish_flyer_extraction($1,$2,null)", ["b".repeat(64), second.claimId]);
assert.equal((await claim("b".repeat(64))).state, "limited");
assert.equal((await claim(key, 1)).state, "cached"); // cache hits work even after quota is exhausted
assert.equal((await db.query("select attempts from flyer_extraction_daily")).rows[0].attempts, 2);
await db.exec(
  "reset role; update flyer_extraction_jobs set expires_at=now()-interval '1 second'; delete from flyer_extraction_daily; delete from flyer_extraction_usage; set role service_role;",
);
assert.equal((await claim(key)).state, "claimed"); // expired cache never survives cleanup
await db.close();
console.log(
  "Flyer cost-control DB checks passed: privileges, duplicate reservations, quota, failed attempts, cache expiry.",
);
