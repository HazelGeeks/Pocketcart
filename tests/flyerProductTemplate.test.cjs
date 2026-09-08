const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeFlyerAiRows } = require("../.tmp-tests/utils/flyerAiRows.js");
const { flyerRowsToProductCsv } = require("../.tmp-tests/utils/flyerCsv.js");
const { flyerProductIssues } = require("../.tmp-tests/utils/flyerProductReview.js");
const { buildProductCsvImportPreview } = require("../.tmp-tests/utils/productCsvImportPlan.js");
const { PRODUCT_TEMPLATE_COLUMNS } = require("../.tmp-tests/utils/productCsvHeaders.js");
const { flyerProductName } = require("../.tmp-tests/utils/flyerProductName.js");

test("cookie package size is parenthesized and an empty category resolves to Snacks", () => {
  const [row] = normalizeFlyerAiRows([{
    english_name: "Taro Coconut Milk Cookies 6X50g", category: "", unit: "6X50g", price: "3.99",
  }]);
  assert.equal(row.englishName, "Taro Coconut Milk Cookies (6 x 50 g)");
  assert.equal(row.mainCategory, "Snacks");
  assert.deepEqual(flyerProductIssues(row), []);
  const csv = flyerRowsToProductCsv([row]);
  assert.match(csv, /Taro Coconut Milk Cookies \(6 x 50 g\)/);
  assert.match(csv, /,Snacks,/);
  assert.equal(flyerProductName(row.englishName, row.unit), row.englishName);
});

test("each store and date field can independently be blank for export", () => {
  const [complete] = normalizeFlyerAiRows([extracted]);
  for (const field of ["martName", "regionBranch", "saleStartDate", "saleEndDate"]) {
    assert.deepEqual(flyerProductIssues({ ...complete, [field]: "" }), [], field);
  }
  const draft = { ...complete, martName: "", regionBranch: "", saleStartDate: "", saleEndDate: "" };
  assert.deepEqual(flyerProductIssues(draft), []);
  assert.ok(flyerRowsToProductCsv([draft]).includes(",,,4.99,,"));
});

test("English category punctuation is accepted and sizes do not accumulate", () => {
  const [row] = normalizeFlyerAiRows([{ ...extracted, category: "Snacks (Cookies)" }]);
  assert.deepEqual(flyerProductIssues(row), []);
  assert.equal(flyerProductName("Cookies (50g)", "50 g"), "Cookies (50 g)");
  assert.equal(flyerProductName("Milk", "1 L"), "Milk (1 l)");
  assert.equal(flyerProductName("Apple", "lb"), "Apple");
});

const extracted = {
  store_brand: "H Mart", store_name: "", english_name: "Nongshim Shin Ramyun",
  korean_name: "농심 신라면", category: "Noodle", unit: "5 x 120 g",
  source_price: "$4.99", sale_start_date: "2026-09-01", sale_end_date: "2026-09-07",
};
const stores = [
  { id: "one", brand: "H Mart", name: "Downtown", is_active: true },
  { id: "two", brand: "H Mart", name: "Richmond", is_active: true },
  { id: "closed", brand: "H Mart", name: "Closed", is_active: false },
];

test("extraction round trips into the Product template with size, names, dates and brand-wide prices", () => {
  const rows = normalizeFlyerAiRows([extracted]);
  assert.deepEqual(flyerProductIssues(rows[0]), []);
  const csv = flyerRowsToProductCsv(rows);
  assert.equal(csv.split("\r\n")[0].replace(/^\uFEFF/, ""), PRODUCT_TEMPLATE_COLUMNS.join(","));
  const result = buildProductCsvImportPreview({ csvText: csv, fileName: "flyer.csv", products: [], stores });
  assert.equal(result.ok, true);
  const row = result.preview.rows[0];
  assert.equal(row.productAction, "create");
  assert.equal(row.input.englishName, `${extracted.english_name} (5 x 120 g)`);
  assert.equal(row.input.koreanName, extracted.korean_name);
  assert.equal(row.input.unit, "5 x 120 g");
  assert.equal(row.input.category, "Noodles");
  assert.equal(row.price.normalizedPrice, "4.99");
  assert.equal(row.price.status, "ready");
  assert.deepEqual(row.price.storeIds, ["one", "two"]);
  assert.equal(row.reviewPayload.store_name, null);
});

test("branch-specific flyer rows do not expand to the whole retailer", () => {
  const csv = flyerRowsToProductCsv(normalizeFlyerAiRows([{ ...extracted, store_name: "Richmond" }]));
  const result = buildProductCsvImportPreview({ csvText: csv, fileName: "flyer.csv", products: [], stores });
  assert.deepEqual(result.preview.rows[0].price.storeIds, ["two"]);
});

test("incomplete names, dates, and conditional offers are visibly held for review", () => {
  const [row] = normalizeFlyerAiRows([{
    ...extracted, english_name: "", price: "2/$5", sale_end_date: "Sep 7", memo: "Must buy 2",
  }]);
  assert.equal(row.price, "2/$5");
  const issues = flyerProductIssues(row).join("; ");
  assert.match(issues, /English name required/);
  assert.match(issues, /Single-item price required/);
  assert.match(issues, /Use valid sale dates/);
});

test("Product CSV never interprets a bundle, size or unreadable text as a price", () => {
  for (const price of ["2/$5", "2 for $5", "500 g", "member $3.99", "unknown", "$2.99-$4.99"]) {
    const csv = [PRODUCT_TEMPLATE_COLUMNS.join(","), `,Apple,사과,Produce,lb,,H Mart,,,${price},2026-09-01,2026-09-07`].join("\n");
    const result = buildProductCsvImportPreview({ csvText: csv, fileName: "prices.csv", products: [], stores });
    assert.equal(result.preview.rows[0].price.status, "skipped", price);
  }
});

test("cents become dollar amounts and reversed sale dates need review", () => {
  const [row] = normalizeFlyerAiRows([{ ...extracted, price: "99¢", sale_start_date: "2026-09-08" }]);
  assert.equal(row.price, "0.99");
  assert.ok(flyerProductIssues(row).includes("Sale end precedes start"));
  const result = buildProductCsvImportPreview({ csvText: flyerRowsToProductCsv([row]), fileName: "dates.csv", products: [], stores });
  assert.equal(result.preview.rows[0].price.status, "skipped");
});

test("English-only products import without a fabricated Korean name or flyer image", () => {
  const [row] = normalizeFlyerAiRows([{ ...extracted, korean_name: "", category: "음료", thumbnail_url: "https://example.com/crop.jpg" }]);
  assert.equal(row.mainCategory, "Beverages");
  assert.equal(row.koreanName, "");
  assert.deepEqual(flyerProductIssues(row), []);
  const result = buildProductCsvImportPreview({ csvText: flyerRowsToProductCsv([row]), fileName: "english.csv", products: [], stores });
  assert.equal(result.preview.rows[0].productAction, "create");
  assert.equal(result.preview.rows[0].input.koreanName, "");
  assert.equal(result.preview.rows[0].input.thumbnailUrl, "");
});

test("unknown Korean categories require review instead of exporting Korean", () => {
  const [row] = normalizeFlyerAiRows([{ ...extracted, category: "알 수 없는 분류" }]);
  assert.equal(row.mainCategory, "");
  assert.ok(flyerProductIssues(row).includes("English category required"));
});
