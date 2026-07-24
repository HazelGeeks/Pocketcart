const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildShoppingCoverageSummary,
  buildShoppingRecommendation,
} = require("../.tmp-tests/utils/shoppingOptimizer.js");

const entries = [
  { productId: "milk", name: "Milk", quantity: 2 },
  { productId: "bread", name: "Bread", quantity: 1 },
];

test("shopping optimizer recommends the cheapest complete one-store basket", () => {
  const result = buildShoppingRecommendation(entries, [
    { productId: "milk", storeId: "a", storeName: "Store A", storeArea: null, price: 3 },
    { productId: "bread", storeId: "a", storeName: "Store A", storeArea: null, price: 4 },
    { productId: "milk", storeId: "b", storeName: "Store B", storeArea: null, price: 4 },
    { productId: "bread", storeId: "b", storeName: "Store B", storeArea: null, price: 5 },
  ]);

  assert.equal(result.bestSingle.total, 10);
  assert.equal(result.bestSingle.stops[0].storeId, "a");
  assert.equal(result.recommended.kind, "single");
});

test("shopping optimizer recommends two stores when splitting lowers the total", () => {
  const result = buildShoppingRecommendation(entries, [
    { productId: "milk", storeId: "a", storeName: "Store A", storeArea: "North", price: 2 },
    { productId: "bread", storeId: "a", storeName: "Store A", storeArea: "North", price: 8 },
    { productId: "milk", storeId: "b", storeName: "Store B", storeArea: "South", price: 5 },
    { productId: "bread", storeId: "b", storeName: "Store B", storeArea: "South", price: 3 },
  ]);

  assert.equal(result.bestSingle.total, 12);
  assert.equal(result.bestSplit.total, 7);
  assert.equal(result.recommended.kind, "split");
  assert.deepEqual(result.recommended.stops.map((stop) => stop.storeId).sort(), ["a", "b"]);
});

test("shopping optimizer excludes products without a current tracked price", () => {
  const result = buildShoppingRecommendation(
    [...entries, { productId: "eggs", name: "Eggs", quantity: 1 }],
    [
      { productId: "milk", storeId: "a", storeName: "Store A", storeArea: null, price: 3 },
      { productId: "bread", storeId: "a", storeName: "Store A", storeArea: null, price: 4 },
    ],
  );

  assert.deepEqual(result.unpricedProductIds, ["eggs"]);
  assert.equal(result.recommended.total, 10);
});

test("shopping optimizer keeps the lowest duplicate store price", () => {
  const result = buildShoppingRecommendation(
    [{ productId: "milk", name: "Milk", quantity: 1 }],
    [
      { productId: "milk", storeId: "a", storeName: "Store A", storeArea: null, price: 5 },
      { productId: "milk", storeId: "a", storeName: "Store A", storeArea: null, price: 3.5 },
    ],
  );

  assert.equal(result.recommended.total, 3.5);
});

test("shopping optimizer can build a complete basket only by combining two stores", () => {
  const result = buildShoppingRecommendation(entries, [
    { productId: "milk", storeId: "a", storeName: "Store A", storeArea: null, price: 2 },
    { productId: "bread", storeId: "b", storeName: "Store B", storeArea: null, price: 3 },
  ]);

  assert.equal(result.bestSingle, null);
  assert.equal(result.bestSplit.total, 7);
  assert.equal(result.recommended.kind, "split");
});

test("shopping optimizer returns no plan for empty or invalid entries", () => {
  const prices = [
    { productId: "milk", storeId: "a", storeName: "Store A", storeArea: null, price: 3 },
  ];

  assert.deepEqual(buildShoppingRecommendation([], prices), {
    bestSingle: null,
    bestSplit: null,
    recommended: null,
    unpricedProductIds: [],
  });
  assert.deepEqual(buildShoppingRecommendation([
    { productId: "", name: "Missing", quantity: 1 },
    { productId: "milk", name: "Zero", quantity: 0 },
    { productId: "milk", name: "Invalid", quantity: Number.NaN },
  ], prices), {
    bestSingle: null,
    bestSplit: null,
    recommended: null,
    unpricedProductIds: [],
  });
});

test("shopping optimizer ignores invalid prices while accepting a free item", () => {
  const result = buildShoppingRecommendation(
    [{ productId: "milk", name: "Milk", quantity: 1 }],
    [
      { productId: "", storeId: "a", storeName: "Store A", storeArea: null, price: 1 },
      { productId: "milk", storeId: "", storeName: "Missing", storeArea: null, price: 1 },
      { productId: "milk", storeId: "a", storeName: "Store A", storeArea: null, price: -1 },
      { productId: "milk", storeId: "a", storeName: "Store A", storeArea: null, price: Number.NaN },
      { productId: "milk", storeId: "b", storeName: "Store B", storeArea: null, price: 0 },
    ],
  );

  assert.equal(result.recommended.total, 0);
  assert.equal(result.recommended.stops[0].storeId, "b");
});

test("shopping optimizer rounds line totals and basket totals to cents", () => {
  const result = buildShoppingRecommendation(
    [{ productId: "milk", name: "Milk", quantity: 3 }],
    [{ productId: "milk", storeId: "a", storeName: "Store A", storeArea: null, price: 1.005 }],
  );

  assert.equal(result.recommended.stops[0].items[0].total, 3.01);
  assert.equal(result.recommended.total, 3.01);
});

test("shopping optimizer prefers a single store when a split plan ties", () => {
  const result = buildShoppingRecommendation(
    [
      { productId: "milk", name: "Milk", quantity: 1 },
      { productId: "bread", name: "Bread", quantity: 1 },
    ],
    [
      { productId: "milk", storeId: "a", storeName: "Store A", storeArea: null, price: 1 },
      { productId: "bread", storeId: "a", storeName: "Store A", storeArea: null, price: 2 },
      { productId: "milk", storeId: "b", storeName: "Store B", storeArea: null, price: 1 },
      { productId: "bread", storeId: "b", storeName: "Store B", storeArea: null, price: 1 },
    ],
  );

  assert.equal(result.bestSingle.total, 2);
  assert.equal(result.bestSplit.total, 2);
  assert.equal(result.recommended.kind, "single");
  assert.equal(result.recommended.stops[0].storeId, "b");
});

test("shopping coverage copy labels incomplete totals as priced subtotals", () => {
  assert.deepEqual(buildShoppingCoverageSummary(4, 1), {
    isPartial: true,
    pricedCount: 3,
    eyebrow: "PARTIAL ESTIMATE · 3 OF 4 ITEMS PRICED",
    subtotalSuffix: " priced subtotal",
    warning: "1 item has no current tracked price. The subtotal above excludes it.",
  });
});

test("shopping coverage copy keeps complete recommendations unchanged", () => {
  assert.deepEqual(buildShoppingCoverageSummary(3, 0), {
    isPartial: false,
    pricedCount: 3,
    eyebrow: "RECOMMENDED PLAN",
    subtotalSuffix: "",
    warning: null,
  });
});
