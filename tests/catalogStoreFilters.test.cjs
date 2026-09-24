const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
function harness() {
  const data = new Map();
  const storage = { getItem: async key => data.get(key) ?? null, setItem: async (key, value) => { data.set(key, value); } };
  const exports = {};
  vm.runInNewContext(fs.readFileSync(require.resolve("../.tmp-tests/services/catalogStoreFilters.js"), "utf8"), { exports, require: () => storage });
  return { ...exports, data, storage, read: async id => JSON.parse(JSON.stringify(await exports.readCatalogStoreFilter(id))) };
}
test("store filters persist separately for two accounts and guests, including clearing", async () => {
  const h = harness();
  const a = { ids: ["a1", "a2"], name: "A" };
  const b = { ids: ["b1"], name: "B" };
  await h.saveCatalogStoreFilter("alice", a);
  await h.saveCatalogStoreFilter("bob", b);
  await h.saveCatalogStoreFilter(null, { ids: ["g"], name: "Guest" });
  assert.deepEqual(await h.read("alice"), a);
  assert.deepEqual(await h.read("bob"), b);
  assert.equal((await h.read(null)).name, "Guest");
  await h.saveCatalogStoreFilter("alice", null);
  assert.equal(await h.read("alice"), null);
  assert.deepEqual(await h.read("bob"), b);
});
test("latest rapid selection wins and a failed save does not block future updates", async () => {
  const h = harness();
  const save = h.storage.setItem;
  h.storage.setItem = async () => { throw Error("disk unavailable"); };
  await assert.rejects(h.saveCatalogStoreFilter("alice", { ids: ["a"], name: "A" }));
  h.storage.setItem = save;
  const first = h.saveCatalogStoreFilter("alice", { ids: ["a"], name: "A" });
  const second = h.saveCatalogStoreFilter("alice", { ids: ["b"], name: "B" });
  assert.deepEqual(await h.read("alice"), { ids: ["b"], name: "B" });
  await Promise.all([first, second]);
});
test("invalid stored filters fall back to all stores", async () => {
  const h = harness();
  h.data.set("pc-catalog-stores-v1.user.alice", "invalid json");
  assert.equal(await h.read("alice"), null);
  await h.saveCatalogStoreFilter("alice", { ids: ["a", "a", "", 4], name: " A " });
  assert.deepEqual(await h.read("alice"), { ids: ["a"], name: "A" });
});
const { groupCatalogRetailers, toggleCatalogRetailer } = require("../.tmp-tests/utils/catalogRetailers.js");
test("retailer checklist groups branches and adds or removes all branch IDs", () => {
  const retailers = groupCatalogRetailers([
    { id: "1", name: "Market - North", brand: "Market" },
    { id: "2", name: "Market - South", brand: "market" },
    { id: "3", name: "Other - West", brand: null },
  ]);
  assert.equal(retailers.length, 2);
  assert.deepEqual(retailers[0].ids, ["1", "2"]);
  assert.deepEqual(toggleCatalogRetailer(["3"], retailers[0]), ["3", "1", "2"]);
  assert.deepEqual(toggleCatalogRetailer(["1", "2", "3"], retailers[0]), ["3"]);
  assert.deepEqual(toggleCatalogRetailer(["1"], retailers[0]), ["1", "2"]);
});
