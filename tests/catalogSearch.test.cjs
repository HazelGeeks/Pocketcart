const test = require("node:test");
const assert = require("node:assert/strict");
const { cleanSearch, normalizeRecentSearches, searchSuggestions } = require("../.tmp-tests/utils/catalogSearch.js");

test("recent searches normalize whitespace, deduplicate newest-first and cap history", () => {
  assert.deepEqual(normalizeRecentSearches([" Juice ", "juice", null, "", "Green   onion"]), ["Juice", "Green onion"]);
  assert.deepEqual(normalizeRecentSearches({ invalid: true }), []);
  assert.equal(normalizeRecentSearches(Array.from({ length: 20 }, (_, i) => `search ${i}`)).length, 10);
  assert.equal(cleanSearch("x".repeat(100)).length, 80);
});

test("related words come from actual product names including words within a name", () => {
  const results = searchSuggestions(["Orange Juice", "Apple Juice Boxes", "Juicy Jumbo", "Milk"], "jui");
  assert.ok(results.includes("Juice"));
  assert.ok(results.includes("Juice Boxes"));
  assert.ok(results.includes("Juicy Jumbo"));
  assert.ok(!results.includes("Juicer"));
  assert.ok(!results.includes("Milk"));
  assert.equal(results.filter((value) => value.toLowerCase() === "juice").length, 1);
});

test("suggestions handle multiword input, blank queries and an eight-result limit", () => {
  assert.ok(searchSuggestions(["Fresh Green Onion Bunch"], "green on").includes("Green Onion"));
  assert.deepEqual(searchSuggestions(["Milk"], ""), []);
  assert.deepEqual(searchSuggestions(["Milk"], "xyz"), []);
  assert.ok(searchSuggestions(Array.from({ length: 30 }, (_, i) => `Apple ${i}`), "app").length <= 8);
});
