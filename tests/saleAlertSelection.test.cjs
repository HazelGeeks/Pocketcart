const test = require("node:test");
const assert = require("node:assert/strict");

const {
  selectSaleAlertPrices,
} = require("../.tmp-tests/supabase/functions/_shared/saleAlertSelection.js");

function price(overrides) {
  return {
    store_id: "global",
    priceValue: 2.99,
    observed_at: "2026-07-20T07:00:00.000Z",
    valid_from: "2026-07-20T07:00:00.000Z",
    valid_to: "2026-07-27T06:59:59.999Z",
    ...overrides,
  };
}

test("scheduled sale alert selection prefers a user's saved stores", () => {
  const result = selectSaleAlertPrices({
    rows: [
      price({ store_id: "global", priceValue: 2.99 }),
      price({ store_id: "favorite", priceValue: 3.19 }),
      price({
        store_id: "favorite",
        priceValue: 3.99,
        valid_from: "2026-07-13T07:00:00.000Z",
        valid_to: "2026-07-20T06:59:59.999Z",
      }),
    ],
    favoriteStoreIds: ["favorite"],
    nowMs: Date.parse("2026-07-24T12:00:00.000Z"),
  });

  assert.equal(result.current.store_id, "favorite");
  assert.equal(result.current.priceValue, 3.19);
  assert.equal(result.previous.priceValue, 3.99);
});

test("explicit watchlist store overrides saved stores", () => {
  const result = selectSaleAlertPrices({
    rows: [
      price({ store_id: "favorite", priceValue: 3.19 }),
      price({ store_id: "explicit", priceValue: 3.49 }),
    ],
    explicitStoreId: "explicit",
    favoriteStoreIds: ["favorite"],
    nowMs: Date.parse("2026-07-24T12:00:00.000Z"),
  });

  assert.equal(result.current.store_id, "explicit");
});

test("different end dates are distinct alert sessions", () => {
  const longSale = price({ store_id: "favorite", priceValue: 3.19 });
  const shortSale = price({
    store_id: "favorite",
    priceValue: 3.09,
    valid_to: "2026-07-25T06:59:59.999Z",
  });
  const result = selectSaleAlertPrices({
    rows: [longSale, shortSale],
    favoriteStoreIds: ["favorite"],
    nowMs: Date.parse("2026-07-24T12:00:00.000Z"),
  });
  const shortOnlyResult = selectSaleAlertPrices({
    rows: [shortSale],
    favoriteStoreIds: ["favorite"],
    nowMs: Date.parse("2026-07-24T12:00:00.000Z"),
  });

  assert.notEqual(result.sessionKey, shortOnlyResult.sessionKey);
});
