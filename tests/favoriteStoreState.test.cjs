const test = require("node:test");
const assert = require("node:assert/strict");

const {
  mergeFavoriteStoreIds,
  normalizeFavoriteStoreIds,
  toggleFavoriteStoreId,
} = require("../.tmp-tests/utils/favoriteStoreState.js");

test("favorite store ids are trimmed and deduplicated", () => {
  assert.deepEqual(
    normalizeFavoriteStoreIds([" store-a ", "store-b", "store-a", "", null]),
    ["store-a", "store-b"],
  );
});

test("guest and account favorite stores merge without duplicates", () => {
  assert.deepEqual(
    mergeFavoriteStoreIds(
      ["guest-store", "shared-store"],
      ["account-store", "shared-store"],
    ),
    ["guest-store", "shared-store", "account-store"],
  );
});

test("favorite store toggle adds and removes one store", () => {
  assert.deepEqual(toggleFavoriteStoreId(["store-a"], "store-b"), [
    "store-a",
    "store-b",
  ]);
  assert.deepEqual(toggleFavoriteStoreId(["store-a", "store-b"], "store-a"), [
    "store-b",
  ]);
});

test("favorite store toggle ignores blank ids", () => {
  const current = ["store-a"];
  assert.equal(toggleFavoriteStoreId(current, "  "), current);
});
