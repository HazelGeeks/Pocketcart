const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildOnSaleProductIdSet,
  buildOnSaleStoreIdsByProduct,
  isSalePriceActive,
} = require("../.tmp-tests/utils/adminProductSaleFilter.js");

const NOW = Date.parse("2026-07-24T19:00:00.000Z");

function price(overrides = {}) {
  return {
    product_id: "product-a",
    store_id: "store-1",
    valid_from: "2026-07-20T07:00:00.000Z",
    valid_to: "2026-07-27T06:59:59.999Z",
    observed_at: "2026-07-20T07:00:00.000Z",
    ...overrides,
  };
}

test("sale filter includes prices whose sale period contains the current time", () => {
  assert.equal(isSalePriceActive(price(), NOW), true);
  assert.equal(isSalePriceActive(price({ valid_from: new Date(NOW).toISOString() }), NOW), true);
  assert.equal(isSalePriceActive(price({ valid_to: new Date(NOW).toISOString() }), NOW), true);
});

test("sale filter excludes expired, future, and malformed sale periods", () => {
  assert.equal(
    isSalePriceActive(price({ valid_to: "2026-07-23T06:59:59.999Z" }), NOW),
    false,
  );
  assert.equal(
    isSalePriceActive(price({ valid_from: "2026-07-25T07:00:00.000Z" }), NOW),
    false,
  );
  assert.equal(isSalePriceActive(price({ valid_from: "not-a-date" }), NOW), false);
  assert.equal(isSalePriceActive(price({ valid_to: "not-a-date" }), NOW), false);
});

test("sale filter supports open-ended periods and returns unique product IDs", () => {
  const productIds = buildOnSaleProductIdSet([
    price({ product_id: "product-a", valid_to: null }),
    price({ product_id: "product-a" }),
    price({
      product_id: "product-b",
      valid_from: "2026-07-10T07:00:00.000Z",
      valid_to: "2026-07-17T06:59:59.999Z",
    }),
    price({ product_id: "  " }),
  ], NOW);

  assert.deepEqual([...productIds], ["product-a"]);
});

test("sale filter groups current store IDs by product without duplicates", () => {
  const storeIdsByProduct = buildOnSaleStoreIdsByProduct([
    price({ product_id: "product-a", store_id: "store-1" }),
    price({ product_id: "product-a", store_id: "store-1", valid_to: null }),
    price({ product_id: "product-a", store_id: "store-2" }),
    price({ product_id: "product-b", store_id: "store-3" }),
    price({
      product_id: "product-a",
      store_id: "expired-store",
      valid_to: "2026-07-23T06:59:59.999Z",
    }),
  ], NOW);

  assert.deepEqual([...storeIdsByProduct.get("product-a")], ["store-1", "store-2"]);
  assert.deepEqual([...storeIdsByProduct.get("product-b")], ["store-3"]);
  assert.equal(storeIdsByProduct.get("product-a").has("expired-store"), false);
});
