const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const {
  emptyFreezerItemDraft,
  getFreezerExpiryState,
  validateFreezerItemDraft,
} = require("../.tmp-tests/utils/freezerItem.js");

const projectRoot = path.resolve(__dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(projectRoot, relativePath), "utf8");

test("My Freezer validates and normalizes an item draft", () => {
  const result = validateFreezerItemDraft({
    ...emptyFreezerItemDraft(),
    name: "  Dumplings  ",
    storageArea: "freezer",
    quantity: "2.5",
    unit: " bags ",
    expiresOn: "2026-09-30",
    note: " Top drawer ",
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.value, {
    name: "Dumplings",
    storageArea: "freezer",
    quantity: 2.5,
    unit: "bags",
    expiresOn: "2026-09-30",
    note: "Top drawer",
  });
});

test("My Freezer rejects invalid quantities and impossible dates", () => {
  assert.equal(validateFreezerItemDraft({
    ...emptyFreezerItemDraft(),
    name: "Milk",
    quantity: "0",
  }).ok, false);
  assert.equal(validateFreezerItemDraft({
    ...emptyFreezerItemDraft(),
    name: "Milk",
    expiresOn: "2026-02-30",
  }).ok, false);
});

test("My Freezer expiry state distinguishes expired, soon, and later items", () => {
  const today = new Date(2026, 7, 22);
  assert.equal(getFreezerExpiryState("2026-08-21", today), "expired");
  assert.equal(getFreezerExpiryState("2026-08-25", today), "soon");
  assert.equal(getFreezerExpiryState("2026-08-26", today), "later");
  assert.equal(getFreezerExpiryState(null, today), null);
});

test("My Freezer schema isolates every row to its authenticated owner", () => {
  const migration = read("supabase/migrations/20260822170000_my_freezer_items.sql");
  const schema = read("database/schema.sql");

  for (const source of [migration, schema]) {
    assert.match(source, /create table if not exists public\.freezer_items/);
    assert.match(source, /alter table public\.freezer_items enable row level security/);
    assert.match(source, /for select to authenticated using \(auth\.uid\(\) = user_id\)/);
    assert.match(source, /for insert to authenticated with check \(auth\.uid\(\) = user_id\)/);
    assert.match(source, /for delete to authenticated using \(auth\.uid\(\) = user_id\)/);
  }
});

test("My Freezer is an account subpage and not a bottom tab", () => {
  const routes = read("src/hooks/nativeAccountTypes.ts");
  const nativeData = read("src/screens/nativeAppData.ts");
  const settings = read("src/components/nativeApp/MorePanel.tsx");

  assert.match(routes, /\| "freezer"/);
  assert.doesNotMatch(nativeData.match(/export type NativeTabId = ([^;]+)/)?.[0] ?? "", /freezer/);
  assert.match(settings, /My Freezer/);
});

test("My Freezer service scopes reads and writes to the signed-in user", () => {
  const service = read("src/services/myFreezer.ts");

  assert.match(service, /data\.user\.id !== userId/);
  assert.ok((service.match(/\.eq\("user_id", userId\)/g) ?? []).length >= 2);
  assert.match(service, /user_id: params\.userId/);
});
