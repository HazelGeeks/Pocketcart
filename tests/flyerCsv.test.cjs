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
      name: "스낵믹스",
      englishName: "Snack Mix",
      mainCategory: "Snacks",
      subCategory: "Chips",
      brand: "No Name",
      price: "7.98",
      unit: "BOX",
      memo: "member price",
    },
  ]);

  const [header, row] = csv.trim().replace(/^\uFEFF/, "").split(/\r?\n/);
  assert.equal(
    header,
    "store_brand,store_name,sale_start_date,sale_end_date,name,english_name,category,thumbnail_url,product_brand,source_price,unit,memo",
  );
  assert.equal(
    row,
    "Safeway,Robson,2026-06-28,2026-07-04,스낵믹스,Snack Mix,Snacks,https://example.com/product-images/snack-mix.webp,No Name,7.98,BOX,member price",
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
      name: "Strawberry",
      englishName: "",
      mainCategory: "Produce",
      subCategory: "Fruit",
      brand: "",
      price: "2.98",
      unit: "LB",
      memo: "",
    },
  ]);

  const [header] = csv.trim().replace(/^\uFEFF/, "").split(/\r?\n/);
  assert.equal(
    header,
    "store_brand,store_name,sale_start_date,sale_end_date,name,english_name,category,product_brand,price,unit,memo",
  );
});
