const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildSaleAlertCandidates,
} = require("../.tmp-tests/utils/saleAlertRules.js");

test("buildSaleAlertCandidates creates alerts for watched products on sale", () => {
  const alerts = buildSaleAlertCandidates({
    watchlistItems: [
      {
        id: "watch-1",
        product_id: "product-1",
        store_id: null,
        name: "Milk",
        store: "Any store",
      },
      {
        id: "watch-2",
        product_id: "product-2",
        store_id: null,
        name: "Eggs",
        store: "Any store",
      },
    ],
    products: [
      {
        id: "product-1",
        name: "Milk",
        current_price: 3.99,
        previous_price: 4.99,
        price_delta: -1,
        best_store_id: "store-1",
        best_store_name: "Safeway - Robson",
        price_compare_current_batch: "Jun 28, 2026",
      },
      {
        id: "product-2",
        name: "Eggs",
        current_price: null,
        previous_price: null,
        price_delta: null,
        best_store_id: null,
        best_store_name: null,
        price_compare_current_batch: null,
      },
    ],
  });

  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].alertKey, "product-1|jun 28, 2026|store-1");
  assert.equal(alerts[0].title, "Sale started");
  assert.match(alerts[0].body, /Safeway - Robson/);
});
