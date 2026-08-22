const test = require("node:test");
const assert = require("node:assert/strict");

const { buildProductDuplicateGroups } = require("../.tmp-tests/utils/productDuplicateGroups.js");

function product(overrides) {
  return {
    id: "product-1",
    korean_name: "리치",
    english_name: "Lychee",
    brand: null,
    gtin: null,
    category: "Produce",
    unit: "1 lb",
    thumbnail_url: null,
    created_at: "2026-07-24T00:00:00.000Z",
    ...overrides,
  };
}

test("finds translated products using English and Korean names", () => {
  const groups = buildProductDuplicateGroups([
    product({ id: "a", korean_name: "리치", english_name: "Lychee", unit: "LB" }),
    product({ id: "b", korean_name: "리치", english_name: "Lychee", unit: "lb" }),
  ]);

  assert.equal(groups.length, 1);
  assert.equal(groups[0].method, "name_and_unit");
  assert.deepEqual(groups[0].products.map((item) => item.id).sort(), ["a", "b"]);
});

test("groups selling-unit variants and origin-qualified names for review", () => {
  const groups = buildProductDuplicateGroups([
    product({
      id: "old",
      korean_name: "타이완 양배추",
      english_name: "Taiwan Cabbage",
      unit: "lb",
    }),
    product({
      id: "current",
      korean_name: "타이완 양배추",
      english_name: "Taiwan Cabbage",
      unit: "per lb",
    }),
    product({
      id: "origin",
      korean_name: "대만 양배추",
      english_name: "Taiwan Cabbage (From BC)",
      unit: "LB",
    }),
  ]);

  assert.equal(groups.length, 1);
  assert.equal(groups[0].method, "name_family_and_unit");
  assert.deepEqual(groups[0].products.map((item) => item.id).sort(), ["current", "old", "origin"]);
});

test("uses name and unit even when legacy GTIN values match", () => {
  const groups = buildProductDuplicateGroups([
    product({
      id: "a",
      korean_name: "탄산수",
      english_name: "Sparkling Water",
      gtin: "0 12345-67890 5",
    }),
    product({
      id: "b",
      korean_name: "탄산수",
      english_name: "Sparkling Water",
      gtin: "012345678905",
    }),
  ]);

  assert.equal(groups.length, 1);
  assert.equal(groups[0].method, "name_and_unit");
  assert.equal(groups[0].label, "Sparkling Water");
});

test("keeps different units and known brands separate", () => {
  const groups = buildProductDuplicateGroups([
    product({ id: "a", korean_name: "사과 주스", english_name: "Apple Juice", unit: "1 L" }),
    product({ id: "b", korean_name: "사과 주스", english_name: "Apple Juice", unit: "2 L" }),
    product({ id: "c", korean_name: "쌀", english_name: "Rice", brand: "Brand A" }),
    product({ id: "d", korean_name: "쌀", english_name: "Rice", brand: "Brand B" }),
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
    product({ id: "a", korean_name: "생 LA 갈비", english_name: "Beef Short Rib Sliced LA" }),
    product({ id: "b", korean_name: "생 LA갈비", english_name: "Beef Short Rib Sliced LA" }),
    product({ id: "c", korean_name: "LA 갈비", english_name: "Beef Short Rib Sliced LA" }),
  ]);

  assert.equal(groups.length, 1);
  assert.deepEqual(groups[0].products.map((item) => item.id).sort(), ["a", "b", "c"]);
});
