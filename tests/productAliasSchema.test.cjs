const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("product aliases are seeded, synced, and preserved during reviewed merges", () => {
  const migration = read("supabase/migrations/20260822070000_product_aliases.sql");
  const schema = read("database/schema.sql");
  const service = read("src/services/adminBackoffice/productIdentityReviews.ts");

  for (const source of [migration, schema]) {
    assert.match(source, /create table if not exists public\.product_aliases/);
    assert.match(source, /create trigger products_sync_primary_aliases/);
    assert.match(source, /insert into public\.product_aliases/);
    assert.match(source, /merge_products_with_aliases/);
  }
  assert.match(service, /rpc\("merge_products_with_aliases"/);
});

test("the schema deployment workflow applies canonical product aliases", () => {
  const workflow = read(".github/workflows/supabase-schema.yml");
  const releaseCheck = read("scripts/check-mobile-release-readiness.mjs");
  assert.match(workflow, /20260822070000_product_aliases\.sql/);
  assert.match(releaseCheck, /20260822070000_product_aliases\.sql/);
});

test("the reviewed Taiwan Cabbage correction is guarded and deployment-managed", () => {
  const migration = read("supabase/migrations/20260822071000_merge_taiwan_cabbage_duplicates.sql");
  const workflow = read(".github/workflows/supabase-schema.yml");
  const releaseCheck = read("scripts/check-mobile-release-readiness.mjs");

  assert.match(migration, /canonical_product_id constant uuid/);
  assert.match(migration, /valid_duplicate_count <> cardinality\(duplicate_product_ids\)/);
  assert.match(migration, /merge_products_with_aliases/);
  assert.doesNotMatch(migration, /Flat Cabbage/);
  assert.match(workflow, /20260822071000_merge_taiwan_cabbage_duplicates\.sql/);
  assert.match(releaseCheck, /20260822071000_merge_taiwan_cabbage_duplicates\.sql/);
});
