const test = require("node:test");
const assert = require("node:assert/strict");

const {
  categoryToIconVariant,
} = require("../.tmp-tests/utils/categoryIcon.js");

test("categoryToIconVariant maps common grocery categories", () => {
  assert.equal(categoryToIconVariant("Meat"), "meat");
  assert.equal(categoryToIconVariant("Snack"), "snack");
  assert.equal(categoryToIconVariant("Dairy"), "dairy");
  assert.equal(categoryToIconVariant("Canned Food"), "canned");
  assert.equal(categoryToIconVariant("Sauce"), "cooking");
});

test("categoryToIconVariant falls back to grocery for unknown categories", () => {
  assert.equal(categoryToIconVariant("Seasonal Special"), "grocery");
  assert.equal(categoryToIconVariant(null), "grocery");
});
