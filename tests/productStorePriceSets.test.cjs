const test = require("node:test");
const assert = require("node:assert/strict");

const {
  excludeReusedPersistedPriceIds,
  getRemovedPersistedPriceIds,
  prepareProductPriceSets,
} = require("../.tmp-tests/utils/productStorePriceSets.js");

test("reused persisted price rows are not deleted", () => {
  assert.deepEqual(
    excludeReusedPersistedPriceIds(["price-old", "price-delete"], ["price-old"]),
    ["price-delete"],
  );
});

test("getRemovedPersistedPriceIds returns only persisted rows removed from the form", () => {
  const removed = getRemovedPersistedPriceIds(
    ["price-1", "price-2", "price-3"],
    [
      { id: "set-1", persistedPriceId: "price-1" },
      { id: "set-new" },
      { id: "set-3", persistedPriceId: "price-3" },
    ],
  );

  assert.deepEqual(removed, ["price-2"]);
});

test("getRemovedPersistedPriceIds treats a cleared persisted row as removed", () => {
  const removed = getRemovedPersistedPriceIds(
    ["price-1"],
    [{ id: "set-1", persistedPriceId: undefined }],
  );

  assert.deepEqual(removed, ["price-1"]);
});

test("prepareProductPriceSets carries a persisted row ID into the save plan", () => {
  const result = prepareProductPriceSets({
    sets: [{ id: "set-1", persistedPriceId: "price-1", brand: "Safeway", storeId: "robson", price: "3.99", periodStartDate: "2026-06-01", periodEndDate: "2026-06-07" }],
    stores: [{ id: "robson", brand: "Safeway", name: "Robson", area: "Downtown" }],
  });

  assert.equal(result.ok, true);
  assert.equal(result.activeSets[0].persistedPriceId, "price-1");
});

test("prepareProductPriceSets expands a brand-only set to every branch", () => {
  const result = prepareProductPriceSets({
    sets: [{ id: "set-1", brand: "Safeway", storeId: "", price: "3.99", periodStartDate: "2026-06-01", periodEndDate: "2026-06-07" }],
    stores: [
      { id: "robson", brand: "Safeway", name: "Robson", area: "Downtown" },
      { id: "davie", brand: "Safeway", name: "Davie Street", area: "West End" },
      { id: "main", brand: "No Frills", name: "Main", area: "Mount Pleasant" },
    ],
  });

  assert.equal(result.ok, true);
  assert.deepEqual(
    result.activeSets.map((set) => set.storeId).sort(),
    ["davie", "robson"],
  );
});

test("prepareProductPriceSets rejects duplicate branch coverage", () => {
  const result = prepareProductPriceSets({
    sets: [
      { id: "set-1", brand: "Safeway", storeId: "", price: "3.99", periodStartDate: "2026-06-01", periodEndDate: "2026-06-07" },
      { id: "set-2", brand: "Safeway", storeId: "robson", price: "2.99", periodStartDate: "2026-06-01", periodEndDate: "2026-06-07" },
    ],
    stores: [
      { id: "robson", brand: "Safeway", name: "Robson", area: "Downtown" },
      { id: "davie", brand: "Safeway", name: "Davie Street", area: "West End" },
    ],
  });

  assert.equal(result.ok, false);
  assert.match(result.error, /duplicate store and sale period/);
});

test("prepareProductPriceSets rejects an end date before the start date", () => {
  const result = prepareProductPriceSets({
    sets: [{ id: "set-1", brand: "Safeway", storeId: "robson", price: "3.99", periodStartDate: "2026-06-07", periodEndDate: "2026-06-01" }],
    stores: [{ id: "robson", brand: "Safeway", name: "Robson", area: "Downtown" }],
  });

  assert.equal(result.ok, false);
  assert.match(result.error, /end date/);
});

test("prepareProductPriceSets allows the same store in different sale periods", () => {
  const result = prepareProductPriceSets({
    sets: [
      { id: "set-1", brand: "Safeway", storeId: "robson", price: "3.99", periodStartDate: "2026-06-01", periodEndDate: "2026-06-07" },
      { id: "set-2", brand: "Safeway", storeId: "robson", price: "4.49", periodStartDate: "2026-06-08", periodEndDate: "2026-06-14" },
    ],
    stores: [{ id: "robson", brand: "Safeway", name: "Robson", area: "Downtown" }],
  });

  assert.equal(result.ok, true);
  assert.equal(result.activeSets.length, 2);
});
