const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildProductDataHealth,
} = require("../.tmp-tests/utils/productDataHealth.js");

const products = [
  { id: "a", name: "Apples", brand: "Orchard", gtin: "012345678905", unit: "1 lb" },
  { id: "b", name: "Bread", brand: null, gtin: null, unit: "1 loaf" },
  { id: "c", name: "Coffee", brand: "Roaster", gtin: "4006381333931", unit: null },
];

function price(overrides) {
  return {
    product_id: "a",
    store_id: "store-1",
    price: 3.99,
    valid_from: "2026-07-01T00:00:00.000Z",
    valid_to: "2026-07-07T23:59:59.999Z",
    observed_at: "2026-07-01T00:00:00.000Z",
    product_name: "Apples",
    store_name: "Store 1",
    store_brand: "T&T",
    ...overrides,
  };
}

test("data health counts sale sessions instead of branch rows", () => {
  const result = buildProductDataHealth(products, [
    price({ store_id: "store-1" }),
    price({ store_id: "store-2", store_name: "Store 2" }),
    price({
      store_id: "store-1",
      valid_from: "2026-07-08T00:00:00.000Z",
      valid_to: "2026-07-14T23:59:59.999Z",
      observed_at: "2026-07-08T00:00:00.000Z",
    }),
  ], Date.parse("2026-07-10T00:00:00.000Z"));

  assert.equal(result.noHistory, 2);
  assert.equal(result.oneSession, 0);
  assert.equal(result.twoPlusSessions, 1);
  assert.equal(result.collectionQueue.find((item) => item.id === "a").sessionCount, 2);
});

test("data health detects cross-store price differences and identity gaps", () => {
  const result = buildProductDataHealth(products, [
    price({ store_id: "store-1", price: 2.99 }),
    price({ store_id: "store-2", store_name: "Store 2", store_brand: "H-Mart", price: 3.98 }),
  ], Date.parse("2026-07-03T00:00:00.000Z"));

  assert.equal(result.crossStorePriceDifferenceSessions, 1);
  assert.equal(result.comparableMultiStoreSessions, 1);
  assert.equal(result.comparableMultiBrandSessions, 1);
  assert.equal(result.missingGtin, 1);
  assert.equal(result.missingBrand, 1);
  assert.equal(result.missingUnit, 1);
});

test("data health counts malformed GTIN values separately", () => {
  const result = buildProductDataHealth([
    { id: "bad", name: "Bad code", brand: "Brand", gtin: "123", unit: "1 ea" },
  ], [], Date.parse("2026-07-03T00:00:00.000Z"));

  assert.equal(result.missingGtin, 0);
  assert.equal(result.invalidGtin, 1);
  assert.equal(result.issueCount, 1);
});

test("data health treats different end dates as separate sale sessions", () => {
  const result = buildProductDataHealth(products, [
    price({ valid_to: "2026-07-05T23:59:59.999Z" }),
    price({ valid_to: "2026-07-07T23:59:59.999Z" }),
  ], Date.parse("2026-07-03T00:00:00.000Z"));

  assert.equal(result.collectionQueue.find((item) => item.id === "a").sessionCount, 2);
});

test("data health reports missing periods and broken price links", () => {
  const result = buildProductDataHealth(products, [
    price({
      product_id: "b",
      valid_to: null,
      product_name: null,
      store_name: null,
    }),
  ], Date.parse("2026-07-03T00:00:00.000Z"));

  assert.equal(result.missingSalePeriodRows, 1);
  assert.equal(result.unlinkedPriceRows, 1);
});
