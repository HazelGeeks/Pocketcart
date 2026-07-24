const test = require("node:test");
const assert = require("node:assert/strict");

const {
  matchesStoreFilter,
} = require("../.tmp-tests/services/marketData/shared.js");

const richmondStore = {
  id: "pricesmart-richmond",
  brand: "PriceSmart Foods",
  name: "Richmond",
  area: "Richmond",
  latitude: 49.1666,
  longitude: -123.1336,
  price_note: null,
  address: "8200 Ackroyd Road",
  place_id: null,
};

test("store search ignores display punctuation from recommendation links", () => {
  assert.equal(matchesStoreFilter(richmondStore, "PriceSmart Foods - Richmond"), true);
});
