const test = require("node:test");
const assert = require("node:assert/strict");

const {
  findMatchingProduct,
  productIdentityKey,
} = require("../.tmp-tests/utils/productIdentity.js");

test("productIdentityKey normalizes name, unit, and category", () => {
  assert.equal(
    productIdentityKey({ name: "  Fresh   Strawberry ", unit: " 1LB ", category: " Produce " }),
    productIdentityKey({ name: "fresh strawberry", unit: "1lb", category: "produce" }),
  );
});

test("findMatchingProduct matches same product identity but keeps different units separate", () => {
  const products = [
    { id: "strawberry-1lb", name: "Strawberry", unit: "1lb", category: "Produce" },
    { id: "strawberry-2lb", name: "Strawberry", unit: "2lb", category: "Produce" },
  ];

  assert.equal(
    findMatchingProduct(products, { name: " strawberry ", unit: "1LB", category: "produce" }).id,
    "strawberry-1lb",
  );
  assert.equal(
    findMatchingProduct(products, { name: "Strawberry", unit: "500g", category: "Produce" }),
    null,
  );
});
