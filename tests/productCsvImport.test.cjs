const test = require("node:test");
const assert = require("node:assert/strict");

const {
  createProductCsvStoreResolver,
  productCsvDateToIso,
  productCsvRecordFromRow,
} = require("../.tmp-tests/utils/productCsvImport.js");

test("product CSV store resolver expands pipe-separated branch names", () => {
  const resolver = createProductCsvStoreResolver([
    { id: "metrotown", brand: "T&T", name: "Metrotown" },
    { id: "broadway", brand: "T&T", name: "Broadway" },
    { id: "edmonds", brand: "T&T", name: "Edmonds" },
    { id: "richmond", brand: "T&T", name: "Richmond" },
    { id: "lougheed", brand: "T&T", name: "Lougheed" },
    { id: "other-metrotown", brand: "Other", name: "Metrotown" },
  ]);

  assert.deepEqual(
    resolver.resolveStoreIds(
      "",
      "Metrotown | Broadway | Edmonds | Richmond | Lougheed",
      "T&T",
    ),
    ["metrotown", "broadway", "edmonds", "richmond", "lougheed"],
  );
});

test("product CSV store resolver keeps direct store_id as a single explicit target", () => {
  const resolver = createProductCsvStoreResolver([
    { id: "metrotown", brand: "T&T", name: "Metrotown" },
    { id: "broadway", brand: "T&T", name: "Broadway" },
  ]);

  assert.deepEqual(
    resolver.resolveStoreIds("broadway", "Metrotown | Broadway", "T&T"),
    ["broadway"],
  );
});

test("product CSV store resolver expands a brand-only row to all active branches", () => {
  const resolver = createProductCsvStoreResolver([
    { id: "metrotown", brand: "PriceSmart Foods", name: "Metrotown", is_active: true },
    { id: "richmond", brand: "PriceSmart Foods", name: "Richmond", is_active: true },
    { id: "closed", brand: "PriceSmart Foods", name: "Closed Branch", is_active: false },
    { id: "other", brand: "Other", name: "Other Branch", is_active: true },
  ]);

  assert.deepEqual(
    resolver.resolveStoreIds("", "", "pricesmart-foods"),
    ["metrotown", "richmond"],
  );
});

test("product CSV store resolver ignores brand spacing and punctuation differences", () => {
  const resolver = createProductCsvStoreResolver([
    { id: "hmart-richmond", brand: "H Mart", name: "Richmond" },
    { id: "pricesmart-metrotown", brand: "PriceSmart Foods", name: "Metrotown" },
    { id: "pricesmart-lougheed", brand: "PriceSmart Foods", name: "Lougheed" },
  ]);

  assert.deepEqual(
    resolver.resolveStoreIds("", "Richmond", "Hmart"),
    ["hmart-richmond"],
  );
  assert.deepEqual(
    resolver.resolveStoreIds("", "Lougheed | Metrotown", "PriceSmart Foods"),
    ["pricesmart-lougheed", "pricesmart-metrotown"],
  );
});

test("product CSV record parser treats a duplicated store_brand header as store_name", () => {
  const record = productCsvRecordFromRow(
    [
      "english_name",
      "korean_name",
      "category",
      "unit",
      "thumbnail_url",
      "store_brand",
      "store_brand",
      "store_id",
      "price",
      "sale_start_date",
      "sale_end_date",
    ],
    [
      "CJW Rich Mayonnaise",
      "청정원 고소한 마요네즈",
      "Sauce",
      "500 g",
      "",
      "Market Ribbon",
      "Burnaby | Coquitlam",
      "",
      "4.99",
      "2026-06-26",
      "2026-07-02",
    ],
  );

  assert.equal(record.english_name, "CJW Rich Mayonnaise");
  assert.equal(record.korean_name, "청정원 고소한 마요네즈");
  assert.equal(record.store_brand, "Market Ribbon");
  assert.equal(record.store_name, "Burnaby | Coquitlam");
  assert.equal(record.price, "4.99");
  assert.equal(record.sale_start_date, "2026-06-26");
  assert.equal(record.sale_end_date, "2026-07-02");
});

test("product CSV date parser accepts ISO and slash dates", () => {
  assert.equal(productCsvDateToIso("2026-06-25", false), "2026-06-25T07:00:00.000Z");
  assert.equal(productCsvDateToIso("6/25/2026", false), "2026-06-25T07:00:00.000Z");
  assert.equal(productCsvDateToIso("7/1/2026", true), "2026-07-02T06:59:59.999Z");
  assert.equal(productCsvDateToIso("25/6/2026", false), null);
});
