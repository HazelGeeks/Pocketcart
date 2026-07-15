const test = require("node:test");
const assert = require("node:assert/strict");

const {
  isCustomerVisibleStore,
  looksLikeProductStoreRecord,
} = require("../.tmp-tests/utils/storeVisibility.js");

test("product-like store rows are hidden consistently", () => {
  assert.equal(
    looksLikeProductStoreRecord({
      name: "Downtown Fresh Mart",
      area: "Downtown",
      price_note: "Eggs 12pk $4.99",
    }),
    true,
  );
});

test("real grocery stores remain customer-visible", () => {
  assert.equal(
    isCustomerVisibleStore({
      name: "Downtown",
      area: "Vancouver",
      price_note: null,
      is_active: true,
    }),
    true,
  );
});

test("inactive admin stores are hidden from the customer app", () => {
  assert.equal(
    isCustomerVisibleStore({
      name: "Richmond",
      area: "Richmond",
      price_note: null,
      is_active: false,
    }),
    false,
  );
});
