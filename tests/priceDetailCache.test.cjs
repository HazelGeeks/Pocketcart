const test = require("node:test");
const assert = require("node:assert/strict");
const { sourceModule } = require("./helpers/sourceModule.cjs");

function setup() {
  let now = 0,
    calls = 0,
    error = null;
  const cache = sourceModule("src/utils/requestCache.ts", {}, { Date: { now: () => now } });
  const data = [
    {
      id: "price",
      observed_at: new Date(0).toISOString(),
      valid_from: new Date(10).toISOString(),
      valid_to: new Date(20).toISOString(),
    },
  ];
  const service = sourceModule(
    "src/services/marketData/priceDetails.ts",
    {
      "../supabaseClient": { hasSupabaseEnv: true, supabase: {} },
      "../../utils/requestCache": cache,
      "./priceRowQueries": {
        fetchPriceRows: async () => {
          calls++;
          return { data, error };
        },
      },
      "./priceHistory": { productPriceHistoryFromRows: () => [{ price: now < 10 ? 5 : 3 }] },
      "./storePrices": { latestStorePricesFromRows: () => [{ price: now > 20 ? null : 3 }] },
    },
    { Date: { now: () => now, parse: Date.parse } },
  );
  return {
    service,
    setNow: (v) => {
      now = v;
    },
    setError: (v) => {
      error = v;
    },
    calls: () => calls,
  };
}

test("reopening/concurrent detail views share reads and sale start/end boundaries force refresh", async () => {
  const h = setup();
  await Promise.all([
    h.service.listProductPriceDetails("milk"),
    h.service.listProductPriceDetails(" milk "),
  ]);
  assert.equal(h.calls(), 1);
  h.setNow(9);
  await h.service.listProductPriceDetails("milk");
  assert.equal(h.calls(), 1);
  h.setNow(10);
  assert.equal((await h.service.listProductPriceDetails("milk")).data.history[0].price, 3);
  assert.equal(h.calls(), 2);
  h.setNow(20);
  await h.service.listProductPriceDetails("milk");
  assert.equal(h.calls(), 2);
  h.setNow(21);
  assert.equal((await h.service.listProductPriceDetails("milk")).data.storePrices[0].price, null);
  assert.equal(h.calls(), 3);
  h.setNow(60021);
  await h.service.listProductPriceDetails("milk");
  assert.equal(h.calls(), 4);
});

test("detail errors are not cached and distinct products have separate entries", async () => {
  const h = setup();
  h.setError({ message: "offline" });
  assert.equal((await h.service.listProductPriceDetails("milk")).error, "offline");
  h.setError(null);
  assert.equal((await h.service.listProductPriceDetails("milk")).error, null);
  await h.service.listProductPriceDetails("bread");
  assert.equal(h.calls(), 3);
});
