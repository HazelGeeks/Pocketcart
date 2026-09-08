const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildFlyerCsv,
  flyerRowsToProductCsv,
} = require("../.tmp-tests/utils/flyerCsv.js");

test("flyerRowsToProductCsv exports current product import columns", () => {
  const csv = flyerRowsToProductCsv([
    {
      id: "row-1",
      selected: true,
      imageSelected: true,
      imageStatus: "saved",
      imagePreviewUrl: "data:image/webp;base64,preview",
      thumbnailUrl: "https://example.com/product-images/snack-mix.webp",
      cropCandidate: null,
      martName: "Safeway",
      regionBranch: "Robson",
      saleStartDate: "2026-06-28",
      saleEndDate: "2026-07-04",
      englishName: "Snack Mix",
      koreanName: "스낵믹스",
      mainCategory: "Snacks",
      subCategory: "Chips",
      price: "7.98",
      unit: "BOX",
      memo: "member price",
    },
  ]);

  const [header, row] = csv.trim().replace(/^\uFEFF/, "").split(/\r?\n/);
  assert.equal(
    header,
    "product_id,english_name,korean_name,category,unit,thumbnail_url,store_brand,store_name,store_id,price,sale_start_date,sale_end_date",
  );
  assert.equal(
    row,
    ",Snack Mix,스낵믹스,Snacks,BOX,,Safeway,Robson,,7.98,2026-06-28,2026-07-04",
  );
});

test("buildFlyerCsv preserves review table columns", () => {
  const csv = buildFlyerCsv([
    {
      id: "row-1",
      selected: true,
      martName: "H Mart",
      regionBranch: "Downtown",
      saleStartDate: "2026-06-28",
      saleEndDate: "2026-07-04",
      englishName: "Strawberry",
      koreanName: "딸기",
      mainCategory: "Produce",
      subCategory: "Fruit",
      price: "2.98",
      unit: "LB",
      memo: "",
    },
  ]);

  const [header] = csv.trim().replace(/^\uFEFF/, "").split(/\r?\n/);
  assert.equal(
    header,
    "store_brand,store_name,sale_start_date,sale_end_date,english_name,korean_name,category,price,unit,memo",
  );
});
