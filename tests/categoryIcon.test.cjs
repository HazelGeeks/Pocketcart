const test = require("node:test");
const assert = require("node:assert/strict");

const {
  categoryToIconVariant,
} = require("../.tmp-tests/utils/categoryIcon.js");

test("categoryToIconVariant maps common grocery categories", () => {
  assert.equal(categoryToIconVariant("All"), "all");
  assert.equal(categoryToIconVariant("Grocery"), "grocery");
  assert.equal(categoryToIconVariant("Meat"), "meat");
  assert.equal(categoryToIconVariant("Snack"), "snack");
  assert.equal(categoryToIconVariant("Dairy"), "dairy");
  assert.equal(categoryToIconVariant("Canned Food"), "canned");
  assert.equal(categoryToIconVariant("Sauce"), "cooking");
});

test("categoryToIconVariant gives distinct canonical categories suitable icons", () => {
  const expectations = new Map([
    ["Dessert", "dessert"],
    ["Frozen Dessert", "dessert"],
    ["Frozen Food", "frozen"],
    ["Health", "health"],
    ["Houseware", "houseware"],
    ["Kimchi", "kimchi"],
    ["Noodles", "noodles"],
    ["Pantry", "pantry"],
    ["Rice & Grains", "rice"],
    ["Seaweed", "seaweed"],
    ["Side Dish", "deli"],
    ["Soup Base", "soup"],
    ["Spice", "spice"],
  ]);

  for (const [category, expected] of expectations) {
    assert.equal(categoryToIconVariant(category), expected);
  }
});

test("categoryToIconVariant normalizes legacy category labels before choosing an icon", () => {
  assert.equal(categoryToIconVariant("Baverage"), "beverage");
  assert.equal(categoryToIconVariant("Bakery / Snacks"), "bakery");
  assert.equal(categoryToIconVariant("Dairy / Beverage"), "beverage");
  assert.equal(categoryToIconVariant("Seafood / Snack"), "seafood");
});

test("categoryToIconVariant falls back to grocery for unknown categories", () => {
  assert.equal(categoryToIconVariant("Seasonal Special"), "grocery");
  assert.equal(categoryToIconVariant(null), "grocery");
});
