const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function harness() {
  const data = new Map();
  const storage = {
    getItem: async (key) => data.get(key) ?? null,
    setItem: async (key, value) => { data.set(key, value); },
  };
  const exports = {};
  vm.runInNewContext(fs.readFileSync(require.resolve("../.tmp-tests/services/recentCatalogSearches.js"), "utf8"), {
    exports,
    require: (name) => name.includes("async-storage") ? storage : require("../.tmp-tests/utils/catalogSearch.js"),
  });
  return {
    ...exports, data, storage,
    readRecentCatalogSearches: async (id) => Array.from(await exports.readRecentCatalogSearches(id)),
  };
}

test("rapid history updates serialize and reopening waits for the last saved search", async () => {
  const h = harness();
  const first = h.updateRecentCatalogSearches("a", (current) => ["Apple", ...current]);
  const second = h.updateRecentCatalogSearches("a", (current) => ["Juice", ...current]);
  assert.deepEqual(await h.readRecentCatalogSearches("a"), ["Juice", "Apple"]);
  await Promise.all([first, second]);
});

test("history is isolated between accounts and guests and supports removal", async () => {
  const h = harness();
  await h.updateRecentCatalogSearches(null, () => ["Guest"]);
  await h.updateRecentCatalogSearches("a", () => ["Apple", "Juice"]);
  assert.deepEqual(await h.readRecentCatalogSearches("b"), []);
  assert.deepEqual(await h.readRecentCatalogSearches(null), ["Guest"]);
  await h.updateRecentCatalogSearches("a", (current) => current.filter((value) => value !== "Apple"));
  assert.deepEqual(await h.readRecentCatalogSearches("a"), ["Juice"]);
});

test("a failed history write does not block later searches", async () => {
  const h = harness();
  const save = h.storage.setItem;
  h.storage.setItem = async () => { throw new Error("disk unavailable"); };
  await assert.rejects(h.updateRecentCatalogSearches("a", () => ["Apple"]));
  h.storage.setItem = save;
  await h.updateRecentCatalogSearches("a", () => ["Juice"]);
  assert.deepEqual(await h.readRecentCatalogSearches("a"), ["Juice"]);
});
