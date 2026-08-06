const test = require("node:test");
const assert = require("node:assert/strict");

const {
  selectLowestPricePerSaleSession,
} = require("../.tmp-tests/utils/productPriceHistory.js");

function candidate(overrides) {
  return {
    id: "price-1",
    productId: "product-1",
    price: 5.49,
    observedAt: "2026-07-10T12:00:00.000Z",
    validFrom: "2026-07-10",
    validTo: "2026-07-16",
    storeId: "tnt",
    storeName: "T&T Market",
    storeArea: "Richmond",
    ...overrides,
  };
}

test("one sale session becomes one point using its lowest-priced store", () => {
  const result = selectLowestPricePerSaleSession([
    candidate({ id: "tnt-price", price: 5.49 }),
    candidate({
      id: "hmart-price",
      storeId: "hmart",
      storeName: "H-Mart",
      storeArea: "Downtown",
      price: 4.99,
    }),
  ], Date.parse("2026-07-20T00:00:00.000Z"));

  assert.equal(result.length, 1);
  assert.equal(result[0].price, 4.99);
  assert.equal(result[0].storeId, "hmart");
  assert.equal(result[0].storeName, "H-Mart");
  assert.equal(result[0].sessionStartedAt, "2026-07-10T00:00:00.000Z");
  assert.deepEqual(
    result[0].storePrices.map((row) => [row.storeName, row.price]),
    [["H-Mart", 4.99], ["T&T Market", 5.49]],
  );
});

test("different sale sessions remain separate and chronological", () => {
  const result = selectLowestPricePerSaleSession([
    candidate({
      id: "later",
      price: 5.29,
      validFrom: "2026-07-17",
      validTo: "2026-07-23",
    }),
    candidate({ id: "earlier", price: 4.99 }),
  ], Date.parse("2026-07-24T00:00:00.000Z"));

  assert.deepEqual(
    result.map((row) => [row.sessionStartedAt, row.price]),
    [
      ["2026-07-10T00:00:00.000Z", 4.99],
      ["2026-07-17T00:00:00.000Z", 5.29],
    ],
  );
});

test("one store appears once per session using its lowest duplicate price", () => {
  const result = selectLowestPricePerSaleSession([
    candidate({ id: "tnt-high", price: 5.79 }),
    candidate({ id: "tnt-low", price: 5.49 }),
    candidate({
      id: "hmart",
      storeId: "hmart",
      storeName: "H-Mart",
      price: 4.99,
    }),
  ], Date.parse("2026-07-20T00:00:00.000Z"));

  assert.deepEqual(
    result[0].storePrices.map((row) => [row.storeName, row.price]),
    [["H-Mart", 4.99], ["T&T Market", 5.49]],
  );
});

test("same start date with different end dates remains separate", () => {
  const result = selectLowestPricePerSaleSession([
    candidate({ id: "short-sale", price: 4.99, validTo: "2026-07-13" }),
    candidate({ id: "long-sale", price: 5.19, validTo: "2026-07-16" }),
  ], Date.parse("2026-07-20T00:00:00.000Z"));

  assert.deepEqual(result.map((row) => row.id), ["short-sale", "long-sale"]);
});

test("equal prices use a deterministic store-name tie break", () => {
  const result = selectLowestPricePerSaleSession([
    candidate({ id: "tnt-price", storeId: "tnt", storeName: "T&T Market", price: 4.99 }),
    candidate({ id: "hmart-price", storeId: "hmart", storeName: "H-Mart", price: 4.99 }),
  ], Date.parse("2026-07-20T00:00:00.000Z"));

  assert.equal(result[0].storeName, "H-Mart");
});

test("future sale sessions are not included in price history", () => {
  const result = selectLowestPricePerSaleSession([
    candidate({ id: "current", validFrom: "2026-07-10" }),
    candidate({ id: "future", validFrom: "2026-08-01" }),
  ], Date.parse("2026-07-20T00:00:00.000Z"));

  assert.deepEqual(result.map((row) => row.id), ["current"]);
});
