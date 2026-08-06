const test = require("node:test");
const assert = require("node:assert/strict");

const {
  productDisplayName,
  productNameSearchText,
  productSecondaryName,
} = require("../.tmp-tests/utils/productNames.js");

test("product names prioritize English and keep Korean as supporting copy", () => {
  const product = { english_name: "Sparkling Water", korean_name: "탄산수" };

  assert.equal(productDisplayName(product), "Sparkling Water");
  assert.equal(productSecondaryName(product), "탄산수");
  assert.equal(productNameSearchText(product), "Sparkling Water 탄산수");
});

test("product names fall back to Korean when English is missing", () => {
  const product = { english_name: " ", korean_name: "탄산수" };

  assert.equal(productDisplayName(product), "탄산수");
  assert.equal(productSecondaryName(product), null);
});
