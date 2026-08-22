const assert = require("node:assert/strict");
const test = require("node:test");

const {
  retailerNameFromStoreDisplayName,
  selectLowestPriceByRetailer,
} = require("../.tmp-tests/utils/retailerPriceDisplay.js");

test("retailer display name removes branch details", () => {
  assert.equal(retailerNameFromStoreDisplayName("H-Mart - Richmond"), "H-Mart");
  assert.equal(retailerNameFromStoreDisplayName("T&T Supermarket"), "T&T Supermarket");
  assert.equal(retailerNameFromStoreDisplayName("  "), "Unknown retailer");
});

test("retailer prices merge branches and keep the lowest price", () => {
  const rows = selectLowestPriceByRetailer([
    { id: "h-richmond", store_name: "H-Mart - Richmond", price: 0.89 },
    { id: "h-coquitlam", store_name: "H-Mart - Coquitlam", price: 0.68 },
    { id: "t-richmond", store_name: "T&T - Richmond", price: 0.79 },
  ]);

  assert.deepEqual(
    rows.map((row) => [row.retailerName, row.source.price]),
    [
      ["H-Mart", 0.68],
      ["T&T", 0.79],
    ],
  );
});
