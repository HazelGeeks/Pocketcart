const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildProductDeleteConfirmation,
  removeDeletedProductIds,
} = require("../.tmp-tests/utils/productDeleteConfirmation.js");

test("single product deletion names the product and uses a specific confirm label", () => {
  const confirmation = buildProductDeleteConfirmation(
    [{ id: "product-1", name: "Organic Milk" }],
    "single",
  );

  assert.deepEqual(confirmation, {
    mode: "single",
    ids: ["product-1"],
    count: 1,
    visibleNames: ["Organic Milk"],
    remainingCount: 0,
    prompt: "Delete “Organic Milk”?",
    confirmLabel: "Delete Product",
  });
});

test("bulk product deletion deduplicates products and summarizes long selections", () => {
  const confirmation = buildProductDeleteConfirmation(
    [
      { id: "p1", name: "Apples" },
      { id: "p2", name: "Bananas" },
      { id: "p3", name: "Carrots" },
      { id: "p4", name: "Dates" },
      { id: "p5", name: "Eggs" },
      { id: "p6", name: "Flour" },
      { id: "p1", name: "Duplicate Apples" },
    ],
    "bulk",
  );

  assert.equal(confirmation.count, 6);
  assert.deepEqual(confirmation.ids, ["p1", "p2", "p3", "p4", "p5", "p6"]);
  assert.deepEqual(confirmation.visibleNames, ["Apples", "Bananas", "Carrots", "Dates", "Eggs"]);
  assert.equal(confirmation.remainingCount, 1);
  assert.equal(confirmation.prompt, "Delete the selected 6 products?");
  assert.equal(confirmation.confirmLabel, "Delete 6 Products");
});

test("bulk deletion keeps singular copy when one product is selected", () => {
  const confirmation = buildProductDeleteConfirmation(
    [{ id: "p1", name: "Apples" }],
    "bulk",
  );

  assert.equal(confirmation.prompt, "Delete the selected 1 product?");
  assert.equal(confirmation.confirmLabel, "Delete 1 Product");
});

test("selection clearing removes only products that were successfully deleted", () => {
  const nextSelection = removeDeletedProductIds(
    new Set(["p1", "p2", "p3"]),
    ["p1", "p3"],
  );

  assert.deepEqual(Array.from(nextSelection), ["p2"]);
});
