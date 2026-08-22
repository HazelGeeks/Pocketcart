const test = require("node:test");
const assert = require("node:assert/strict");

const { buildProductCsvImportPreview } = require("../.tmp-tests/utils/productCsvImportPlan.js");

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
  assert.deepEqual(
    preview.rows.map((row) => row.productAction),
    ["create", "reuse_planned", "reuse", "review", "invalid"],
  );
  assert.equal(preview.summary.productsToCreate, 1);
  assert.equal(preview.summary.existingMatches, 1);
  assert.equal(preview.summary.rowsForReview, 1);
  assert.equal(preview.summary.invalidRows, 1);
  assert.equal(preview.summary.priceEntriesToImport, 2);
});

test("product CSV preview holds ambiguous name and unit matches without merging", () => {
  const csv = ["english_name,korean_name,category,unit", "Apple,사과,Produce,1 lb"].join("\n");
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

test("product CSV preview reuses a reviewed alias across selling-unit variants", () => {
  const result = buildProductCsvImportPreview({
    csvText: [
      "english_name,korean_name,category,unit,price,store_id,sale_start_date,sale_end_date",
      "Flat Cabbage,납작 양배추,Produce,per lb,0.68,store-1,2026-08-20,2026-08-26",
    ].join("\n"),
    fileName: "alias.csv",
    products: [
      {
        id: "taiwan-cabbage",
        korean_name: "타이완 양배추",
        english_name: "Taiwan Cabbage",
        brand: null,
        gtin: null,
        category: "Produce",
        unit: "lb",
        thumbnail_url: null,
        created_at: "2026-07-24T00:00:00.000Z",
      },
    ],
    productAliases: [
      {
        id: "alias-1",
        product_id: "taiwan-cabbage",
        alias_name: "Flat Cabbage",
        unit: "lb",
        created_at: "2026-08-22T00:00:00.000Z",
      },
    ],
    stores: [
      {
        id: "store-1",
        brand: "H-Mart",
        name: "H-Mart Downtown",
        area: "Vancouver",
        latitude: 49.28,
        longitude: -123.12,
        price_note: null,
        address: null,
        place_id: null,
        phone: null,
        website: null,
        hours: null,
        store_type: "grocery",
        is_active: true,
        created_at: "2026-07-01T00:00:00.000Z",
      },
    ],
  });

  assert.equal(result.ok, true);
  assert.equal(result.preview.rows[0].productAction, "reuse");
  assert.equal(result.preview.rows[0].productId, "taiwan-cabbage");
  assert.equal(result.preview.rows[0].matchMethod, "alias");
});
