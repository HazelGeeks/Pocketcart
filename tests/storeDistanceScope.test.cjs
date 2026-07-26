const test = require("node:test");
const assert = require("node:assert/strict");

const {
  formatStoreDistance,
  getStoreDistanceScope,
  getStoreScopeMessage,
  getStoreScopeTitle,
} = require("../.tmp-tests/utils/storeDistanceScope.js");

test("nearby copy is used only when a tracked store is within range", () => {
  assert.equal(
    getStoreDistanceScope(
      [{ distance_km: 18.2 }, { distance_km: 140 }],
      true,
    ),
    "nearby",
  );
  assert.equal(getStoreScopeTitle("nearby", false), "Nearby stores");
});

test("an out-of-area location never labels distant stores as nearby", () => {
  assert.equal(
    getStoreDistanceScope(
      [{ distance_km: 1260 }, { distance_km: 1280 }],
      true,
    ),
    "outside",
  );
  assert.match(getStoreScopeMessage("outside", 28), /No tracked stores within/);
  assert.equal(
    formatStoreDistance(1260),
    "1260 km from your location",
  );
});

test("missing location and missing distances use honest fallback copy", () => {
  assert.equal(getStoreDistanceScope([], false), "unlocated");
  assert.equal(getStoreDistanceScope([{ distance_km: null }], true), "unknown");
  assert.equal(
    getStoreScopeTitle("unlocated", false),
    "Stores with price data",
  );
});

test("favorite stores keep their own label regardless of distance scope", () => {
  assert.equal(getStoreScopeTitle("outside", true), "My stores");
});
