const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildPriceChart,
  fitPriceChart,
  nearestPriceChartPoint,
} = require("../.tmp-tests/screens/nativeAppData.js");

function point(overrides) {
  const value = {
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
  return {
    ...value,
    store_prices: overrides.store_prices ?? [
      {
        id: value.id,
        price: value.price,
        store_id: value.store_id,
        store_name: value.store_name,
        store_area: value.store_area,
      },
    ],
  };
}

test("price chart keeps lowest-store metadata and sale-period labels", () => {
  const chart = buildPriceChart(
    [
      point({ id: "first" }),
      point({
        id: "second",
        price: 5.29,
        observed_at: "2026-07-08T07:00:00.000Z",
        sale_end_at: "2026-07-15T06:59:59.999Z",
        store_id: "tnt",
        store_name: "T&T Market",
        store_area: "Richmond",
        store_prices: [
          {
            id: "second-hmart",
            price: 4.99,
            store_id: "hmart",
            store_name: "H-Mart",
            store_area: "Downtown",
          },
          {
            id: "second-tnt",
            price: 5.29,
            store_id: "tnt",
            store_name: "T&T Market",
            store_area: "Richmond",
          },
        ],
      }),
    ],
    400,
    20,
  );

  assert.ok(chart);
  assert.equal(chart.points[1].label, "Jul 8–Jul 14");
  assert.equal(chart.points[1].store_name, "T&T Market");
  assert.equal(chart.points[1].store_area, "Richmond");
  assert.deepEqual(
    chart.points[1].store_prices.map((row) => row.store_name),
    ["H-Mart", "T&T Market"],
  );
});

test("price chart uses elapsed sale dates for horizontal spacing", () => {
  const chart = buildPriceChart(
    [
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
    ],
    400,
    20,
  );

  assert.ok(chart);
  assert.ok(chart.points[1].x < chart.width / 2);
});

test("price chart separates sessions that share a start but have different end dates", () => {
  const chart = buildPriceChart(
    [
      point({ id: "short", sale_end_at: "2026-07-04T06:59:59.999Z" }),
      point({ id: "long", sale_end_at: "2026-07-08T06:59:59.999Z" }),
    ],
    400,
    20,
  );

  assert.ok(chart);
  assert.notEqual(chart.points[0].x, chart.points[1].x);
});

test("single and unchanged prices stay centered with finite chart coordinates", () => {
  assert.equal(buildPriceChart([], 320, 20), null);
  for (const history of [
    [point({})],
    [point({}), point({ id: "same", observed_at: "2026-07-08T07:00:00.000Z" })],
  ]) {
    const chart = buildPriceChart(history, 320, 20);
    assert.ok(chart);
    assert.equal(chart.ticks.length, 1);
    for (const entry of chart.points) {
      assert.ok(Number.isFinite(entry.x) && Number.isFinite(entry.y));
      assert.equal(entry.y, (chart.plot.top + chart.plot.bottom) / 2);
    }
    if (history.length === 1)
      assert.equal(chart.points[0].x, (chart.plot.left + chart.plot.right) / 2);
  }
});

test("fitting a narrow chart preserves dates, prices and relative elapsed time", () => {
  const chart = buildPriceChart(
    [
      point({ id: "first" }),
      point({
        id: "middle",
        price: 3.49,
        observed_at: "2026-07-08T07:00:00.000Z",
        sale_end_at: "2026-07-15T06:59:59.999Z",
      }),
      point({
        id: "last",
        price: 6.49,
        observed_at: "2026-07-22T07:00:00.000Z",
        sale_end_at: "2026-07-29T06:59:59.999Z",
      }),
    ],
    400,
    20,
  );
  const fitted = fitPriceChart(chart, 208);
  assert.equal(fitted.width, 208);
  assert.deepEqual(
    fitted.points.map(({ x, ...data }) => data),
    chart.points.map(({ x, ...data }) => data),
  );
  assert.equal(fitted.points[0].x, fitted.plot.left);
  assert.equal(fitted.points[2].x, fitted.plot.right);
  assert.ok(
    Math.abs(
      (fitted.points[1].x - fitted.plot.left) / (fitted.plot.right - fitted.plot.left) - 1 / 3,
    ) < 1e-9,
  );
  assert.ok(fitted.points.every((p) => p.y > fitted.plot.top && p.y < fitted.plot.bottom));
  assert.equal(nearestPriceChartPoint(fitted, -100), 0);
  assert.equal(nearestPriceChartPoint(fitted, fitted.points[1].x + 2), 1);
  assert.equal(nearestPriceChartPoint(fitted, 1000), 2);
});

test("price history retains only the seven latest periods without inventing intermediate prices", () => {
  const history = Array.from({ length: 10 }, (_, i) =>
    point({
      id: `period-${i}`,
      price: i + 0.99,
      observed_at: new Date(Date.UTC(2026, 6, 1 + i * 7)).toISOString(),
      sale_end_at: null,
    }),
  );
  const chart = buildPriceChart(history.reverse(), 320, 16);
  assert.deepEqual(
    chart.points.map((p) => p.value),
    [3.99, 4.99, 5.99, 6.99, 7.99, 8.99, 9.99],
  );
  assert.equal(chart.polyline.split(" ").length, 7);
  assert.ok(chart.ticks[0].value >= chart.max);
  assert.ok(chart.ticks.at(-1).value <= chart.min);
});

test("small price changes do not overlap axis labels or exaggerate the line height", () => {
  const chart = buildPriceChart(
    [
      point({ id: "first", price: 4.99 }),
      point({ id: "second", price: 5, observed_at: "2026-07-08T07:00:00.000Z" }),
    ],
    320,
    16,
  );
  assert.ok(Math.abs(chart.points[0].y - chart.points[1].y) < 4);
  assert.ok(chart.ticks[1].y - chart.ticks[0].y > 40);
  assert.ok(chart.ticks[2].y - chart.ticks[1].y > 40);
});
