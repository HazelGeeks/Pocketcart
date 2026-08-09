const test = require("node:test");
const assert = require("node:assert/strict");

const {
  categoryImageKey,
  mergeCategoryImageUrls,
} = require("../.tmp-tests/utils/categoryImages.js");

test("category image keys ignore surrounding whitespace and case", () => {
  assert.equal(categoryImageKey("  Dairy "), "dairy");
  assert.equal(categoryImageKey("Frozen Food"), "frozen food");
});

test("category images use the first valid catalog photo and preserve the cache", () => {
  const current = { dairy: "https://example.com/milk.jpg" };
  const result = mergeCategoryImageUrls(current, [
    { category: "Dairy", thumbnail_url: "https://example.com/yogurt.jpg" },
    { category: "Bakery", thumbnail_url: null },
    { category: " Bakery ", thumbnail_url: "https://example.com/bread.jpg" },
  ]);

  assert.deepEqual(result, {
    dairy: "https://example.com/milk.jpg",
    bakery: "https://example.com/bread.jpg",
  });
});

test("category image cache keeps its identity when no new photo is available", () => {
  const current = { produce: "https://example.com/carrots.jpg" };
  const result = mergeCategoryImageUrls(current, [
    { category: "Produce", thumbnail_url: "" },
    { category: "Produce", thumbnail_url: null },
  ]);

  assert.equal(result, current);
});
