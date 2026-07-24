const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildPriceChart,
} = require("../.tmp-tests/screens/nativeAppData.js");

function point(overrides) {
  return {
    id: "price-1",
    product_id: "product-1",
    price: 4.99,
    observed_at: "2026-07-01T07:00:00.000Z",
    sale_end_at: "2026-07-08T06:59:59.999Z",
    store_id: "hmart",
    store_name: "H-Mart",
    store_area: "Downtown",
    ...overrides,
  };
}

test("price chart keeps lowest-store metadata and sale-period labels", () => {
  const chart = buildPriceChart([
    point({ id: "first" }),
    point({
      id: "second",
      price: 5.29,
      observed_at: "2026-07-08T07:00:00.000Z",
      sale_end_at: "2026-07-15T06:59:59.999Z",
      store_id: "tnt",
      store_name: "T&T Market",
      store_area: "Richmond",
    }),
  ], 400, 20);

  assert.ok(chart);
  assert.equal(chart.points[1].label, "Jul 8–Jul 14");
  assert.equal(chart.points[1].store_name, "T&T Market");
  assert.equal(chart.points[1].store_area, "Richmond");
});

test("price chart uses elapsed sale dates for horizontal spacing", () => {
  const chart = buildPriceChart([
    point({ id: "first" }),
    point({
      id: "middle",
      observed_at: "2026-07-08T07:00:00.000Z",
      sale_end_at: "2026-07-15T06:59:59.999Z",
    }),
    point({
      id: "last",
      observed_at: "2026-07-22T07:00:00.000Z",
      sale_end_at: "2026-07-29T06:59:59.999Z",
    }),
  ], 400, 20);

  assert.ok(chart);
  assert.ok(chart.points[1].x < chart.width / 2);
});

test("price chart separates sessions that share a start but have different end dates", () => {
  const chart = buildPriceChart([
    point({ id: "short", sale_end_at: "2026-07-04T06:59:59.999Z" }),
    point({ id: "long", sale_end_at: "2026-07-08T06:59:59.999Z" }),
  ], 400, 20);

  assert.ok(chart);
  assert.notEqual(chart.points[0].x, chart.points[1].x);
});
