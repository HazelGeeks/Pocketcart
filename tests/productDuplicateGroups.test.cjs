const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildProductDuplicateGroups,
} = require("../.tmp-tests/utils/productDuplicateGroups.js");

function product(overrides) {
  return {
    id: "product-1",
    name: "Lychee",
    english_name: "리치",
    brand: null,
    gtin: null,
    category: "Produce",
    unit: "1 lb",
    thumbnail_url: null,
    created_at: "2026-07-24T00:00:00.000Z",
    ...overrides,
  };
}

test("finds translated products when name and English name are swapped", () => {
  const groups = buildProductDuplicateGroups([
    product({ id: "a", name: "리치", english_name: "Lychee", unit: "LB" }),
    product({ id: "b", name: "Lychee", english_name: "리치", unit: "lb" }),
  ]);

  assert.equal(groups.length, 1);
  assert.equal(groups[0].method, "name_and_unit");
  assert.deepEqual(groups[0].products.map((item) => item.id).sort(), ["a", "b"]);
});

test("gives valid matching GTINs priority over text matches", () => {
  const groups = buildProductDuplicateGroups([
    product({
      id: "a",
      name: "Sparkling Water",
      english_name: "Sparkling Water",
      gtin: "0 12345-67890 5",
    }),
    product({
      id: "b",
      name: "Sparkling Water",
      english_name: "Sparkling Water",
      gtin: "012345678905",
    }),
  ]);

  assert.equal(groups.length, 1);
  assert.equal(groups[0].method, "gtin");
  assert.equal(groups[0].label, "GTIN 012345678905");
});

test("keeps different units and known brands separate", () => {
  const groups = buildProductDuplicateGroups([
    product({ id: "a", name: "Apple Juice", english_name: "Apple Juice", unit: "1 L" }),
    product({ id: "b", name: "Apple Juice", english_name: "Apple Juice", unit: "2 L" }),
    product({ id: "c", name: "Rice", english_name: "Rice", brand: "Brand A" }),
    product({ id: "d", name: "Rice", english_name: "Rice", brand: "Brand B" }),
  ]);

  assert.equal(groups.length, 0);
});

test("does not suggest name-only matches without a unit", () => {
  const groups = buildProductDuplicateGroups([
    product({ id: "a", unit: null }),
    product({ id: "b", unit: "" }),
  ]);

  assert.equal(groups.length, 0);
});

test("removes smaller duplicate groups already covered by a larger match", () => {
  const groups = buildProductDuplicateGroups([
    product({ id: "a", name: "생 LA 갈비", english_name: "Beef Short Rib Sliced LA" }),
    product({ id: "b", name: "생 LA갈비", english_name: "Beef Short Rib Sliced LA" }),
    product({ id: "c", name: "Beef Short Rib Sliced LA", english_name: "생 LA 갈비" }),
  ]);

  assert.equal(groups.length, 1);
  assert.deepEqual(groups[0].products.map((item) => item.id).sort(), ["a", "b", "c"]);
});
