const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

const {
  canonicalProductCategory,
  productCategoryQueryValues,
} = require("../.tmp-tests/utils/productCategory.js");

test("canonicalProductCategory merges obvious grocery category variants", () => {
  const cases = new Map([
    ["Baverage", "Beverages"],
    ["Baverages", "Beverages"],
    ["Beverage", "Beverages"],
    ["Dairy / Beverage", "Beverages"],
    ["Bakery / Snacks", "Bakery"],
    ["Frozen Meal", "Frozen Food"],
    ["Kitchen", "Houseware"],
    ["Rice", "Rice & Grains"],
    ["Rice / Grain", "Rice & Grains"],
    ["Rice/Grain", "Rice & Grains"],
    ["Noodle", "Noodles"],
    ["Prepared Food", "Prepared Foods"],
    ["Rice Cake", "Rice Cakes"],
    ["Snack", "Snacks"],
    ["Sauce & Seasoning", "Sauces & Condiments"],
    ["Sauce / Paste", "Sauces & Condiments"],
    ["Seafood / Snack", "Seafood"],
    ["Ready-to-Eat Meals", "Ready Meals"],
    ["Frozen", "Frozen Food"],
  ]);

  for (const [input, expected] of cases) {
    assert.equal(canonicalProductCategory(input), expected);
  }
});

test("canonicalProductCategory preserves genuinely different and unknown categories", () => {
  assert.equal(canonicalProductCategory("Frozen Dessert"), "Frozen Dessert");
  assert.equal(canonicalProductCategory("  Produce  "), "Produce");
  assert.equal(canonicalProductCategory("Seaweed"), "Seaweed");
});

test("category queries include legacy values until the data migration is applied", () => {
  const beverageValues = productCategoryQueryValues("Beverages");
  assert.ok(beverageValues.includes("Baverage"));
  assert.ok(beverageValues.includes("Beverage"));
  assert.ok(beverageValues.includes("Beverages"));

  const riceValues = productCategoryQueryValues("Rice & Grains");
  assert.ok(riceValues.includes("Rice"));
  assert.ok(riceValues.includes("Rice / Grain"));
  assert.ok(riceValues.includes("Rice/Grain"));
});

test("database migration cleans existing rows and prevents category drift", () => {
  const migration = fs.readFileSync(
    "supabase/migrations/20260822173000_normalize_product_categories.sql",
    "utf8",
  );
  const schema = fs.readFileSync("database/schema.sql", "utf8");

  for (const source of [migration, schema]) {
    assert.match(source, /create or replace function public\.canonical_product_category/);
    assert.match(source, /update public\.products/);
    assert.match(source, /products_set_canonical_category/);
    assert.match(source, /'Beverages'/);
    assert.match(source, /'Rice & Grains'/);
    assert.match(source, /7904a16e-aa03-4b8e-a865-56696175aab1/);
    assert.match(source, /a746db80-efd4-4517-bf9c-cfe3e24a7e9e/);
  }
});

test("home category lookup avoids loading price summaries", () => {
  const productsService = fs.readFileSync("src/services/marketData/products.ts", "utf8");
  const categoryFunction = productsService.slice(
    productsService.indexOf("export async function listProductCategories"),
  );

  assert.match(categoryFunction, /rpc\("list_product_categories"\)/);
  assert.match(categoryFunction, /\.select\("category"\)/);
  assert.doesNotMatch(categoryFunction, /listProductPriceSummaries/);
});
