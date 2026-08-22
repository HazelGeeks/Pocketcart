const test = require("node:test");
const assert = require("node:assert/strict");

const {
  formatFoodScanSalePeriod,
  matchFoodScanProduct,
  summarizeFoodScanSales,
} = require("../.tmp-tests/utils/foodScanProductMatch.js");

const banana = {
  id: "banana-1lb",
  korean_name: "바나나",
  english_name: "Banana",
  category: "Produce",
  unit: "1 lb",
  brand: null,
  gtin: "012345678905",
  thumbnail_url: null,
};

test("Food Scan product matching prioritizes one exact GTIN", () => {
  const match = matchFoodScanProduct([banana], {
    barcode: "0 12345-67890 5",
    confidence: 20,
    productName: "Something else",
    requiresConfirmation: true,
  });
  assert.equal(match?.product.id, banana.id);
  assert.equal(match?.method, "gtin");
  assert.equal(
    matchFoodScanProduct([{ ...banana, gtin: "036000291452" }], {
      barcode: "012345678905",
      confidence: 99,
      productName: "Banana",
      requiresConfirmation: false,
    }),
    null,
  );
});

test("Food Scan name matching requires high confidence and one exact candidate", () => {
  assert.equal(
    matchFoodScanProduct([banana], {
      confidence: 92,
      productName: " banana ",
      requiresConfirmation: false,
    })?.product.id,
    banana.id,
  );
  assert.equal(
    matchFoodScanProduct([banana], {
      confidence: 84,
      productName: "Banana",
      requiresConfirmation: false,
    }),
    null,
  );
  assert.equal(
    matchFoodScanProduct([banana, { ...banana, id: "banana-2lb", unit: "2 lb" }], {
      confidence: 95,
      productName: "Banana",
      requiresConfirmation: false,
    }),
    null,
  );
});

test("Food Scan sale summary separates a current sale from the previous sale", () => {
  const history = [
    {
      price: 3.49,
      observed_at: "2026-08-01T07:00:00.000Z",
      sale_end_at: "2026-08-07T06:59:59.000Z",
      store_id: "store-a",
      store_name: "Market A",
      store_area: null,
    },
    {
      price: 2.99,
      observed_at: "2026-08-20T07:00:00.000Z",
      sale_end_at: "2026-08-27T06:59:59.000Z",
      store_id: "store-b",
      store_name: "Market B",
      store_area: "Burnaby",
    },
  ];
  const summary = summarizeFoodScanSales(history, Date.parse("2026-08-21T12:00:00.000Z"));
  assert.equal(summary.current?.price, 2.99);
  assert.equal(summary.previous?.price, 3.49);
  assert.equal(formatFoodScanSalePeriod(history[1]), "Aug 20–Aug 26");
});

test("Food Scan sale summary uses the latest expired sale when none is current", () => {
  const point = {
    price: 4.25,
    observed_at: "2026-08-01T07:00:00.000Z",
    sale_end_at: "2026-08-07T06:59:59.000Z",
    store_id: null,
    store_name: "Market A",
    store_area: null,
  };
  const summary = summarizeFoodScanSales([point], Date.parse("2026-08-21T12:00:00.000Z"));
  assert.equal(summary.current, null);
  assert.equal(summary.previous?.price, 4.25);
});
