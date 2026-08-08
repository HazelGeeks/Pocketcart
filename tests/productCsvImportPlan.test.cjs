const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildProductCsvImportPreview,
} = require("../.tmp-tests/utils/productCsvImportPlan.js");

function product(overrides) {
  return {
    id: "existing-1",
    korean_name: "사과",
    english_name: "Apple",
    brand: null,
    gtin: null,
    category: "Produce",
    unit: "1 lb",
    thumbnail_url: null,
    created_at: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

const stores = [
  { id: "store-1", name: "Downtown", brand: "Safeway", is_active: true },
  { id: "store-2", name: "West End", brand: "Safeway", is_active: true },
];

test("product CSV preview plans creates, planned reuse, existing reuse, review, and invalid rows", () => {
  const csv = [
    "product_id,english_name,korean_name,category,unit,store_brand,price,sale_start_date,sale_end_date",
    ",Organic Eggs,유기농 달걀,Dairy,12 ct,Safeway,6.99,2026-08-01,2026-08-07",
    ",Organic Eggs,유기농 달걀,Dairy,12 ct,,,,",
    ",Apple,사과,Produce,1 lb,,,,",
    "missing-id,Unknown,미확인,Produce,1 ea,,,,",
    ",,이름 없음,Produce,1 ea,,,,",
  ].join("\n");
  const result = buildProductCsvImportPreview({
    csvText: csv,
    fileName: "products.csv",
    products: [product()],
    stores,
  });

  assert.equal(result.ok, true);
  const preview = result.preview;
  assert.deepEqual(preview.rows.map((row) => row.productAction), [
    "create", "reuse_planned", "reuse", "review", "invalid",
  ]);
  assert.equal(preview.summary.productsToCreate, 1);
  assert.equal(preview.summary.existingMatches, 1);
  assert.equal(preview.summary.rowsForReview, 1);
  assert.equal(preview.summary.invalidRows, 1);
  assert.equal(preview.summary.priceEntriesToImport, 2);
});

test("product CSV preview holds ambiguous name and unit matches without merging", () => {
  const csv = [
    "english_name,korean_name,category,unit",
    "Apple,사과,Produce,1 lb",
  ].join("\n");
  const result = buildProductCsvImportPreview({
    csvText: csv,
    fileName: "ambiguous.csv",
    products: [product({ id: "a" }), product({ id: "b" })],
    stores,
  });

  assert.equal(result.ok, true);
  assert.equal(result.preview.rows[0].productAction, "review");
  assert.deepEqual(result.preview.rows[0].candidateProductIds.sort(), ["a", "b"]);
});
