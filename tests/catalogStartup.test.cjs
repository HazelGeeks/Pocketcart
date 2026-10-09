const test = require("node:test");
const assert = require("node:assert/strict");
const { sourceModule } = require("./helpers/sourceModule.cjs");

function harness({ active = [], rows = [], summaryError = null, productError = null, preferred = [] } = {}) {
  const calls = [];
  const summaryCalls = [];
  let inFlight = 0;
  let peakConcurrency = 0;
  const summary = (id, price = 5) => ({ product_id: id, current_price: price, best_store_price: price, best_store_id: "store", best_store_name: "Store" });
  const summaries = new Map(active.map((id) => [id, summary(id)]));
  const preferredSummaries = new Map(preferred.map((id) => [id, summary(id, 7)]));
  const client = {
    from(table) {
      assert.equal(table, "products");
      const call = { ids: null, category: null, search: null };
      const query = {
        select() { return query; },
        eq(_field, category) { call.category = category; return query; },
        in(field, values) { if (field === "id") call.ids = values; else call.categories = values; return query; },
        or(search) { call.search = search; return query; },
        order() { return query; },
        async range(from, to) {
          calls.push(call);
          inFlight++;
          peakConcurrency = Math.max(peakConcurrency, inFlight);
          await new Promise((resolve) => setImmediate(resolve));
          inFlight--;
          let selected = rows.filter((row) => !call.ids || call.ids.includes(row.id));
          if (call.category) selected = selected.filter((row) => row.category === call.category);
          return { data: selected.slice(from, to + 1), error: productError };
        },
      };
      return query;
    },
  };
  const { collectPagedRows } = sourceModule("src/utils/paginatedQuery.ts", {});
  const service = sourceModule("src/services/marketData/products.ts", {
    "../../utils/paginatedQuery": { collectPagedRows },
    "../../utils/productCategory": { canonicalProductCategory: (value) => value, productCategoryQueryValues: (value) => value ? [value] : [] },
    "../supabaseClient": { hasSupabaseEnv: true, supabase: client },
    "./fallbacks": { FALLBACK_PRODUCTS: [] },
    "./prices": { listProductPriceSummaries: async (storeIds) => {
      summaryCalls.push(storeIds);
      return { data: storeIds?.length ? preferredSummaries : summaries, error: summaryError };
    } },
    "./shared": { matchesProductFilter: () => true },
  });
  return { service, calls, summaryCalls, peakConcurrency: () => peakConcurrency };
}

const row = (id, name = id) => ({ id, korean_name: "", english_name: name, category: "Dairy", unit: "1 L", thumbnail_url: "https://example.com/image.webp" });

test("home loads only active sale IDs with bounded requests and globally ordered results", async () => {
  const ids = Array.from({ length: 550 }, (_, index) => `product-${String(index).padStart(3, "0")}`).reverse();
  const h = harness({ active: ids, rows: [...ids.map((id) => row(id)), row("expired")] });
  const result = await h.service.listProducts();
  assert.equal(result.error, null);
  assert.equal(result.data.length, 550);
  assert.equal(result.data[0].id, "product-000");
  assert.equal(result.data.at(-1).id, "product-549");
  assert.ok(h.calls.every((call) => call.ids && call.ids.length <= 100 && !call.ids.includes("expired")));
  assert.equal(h.calls.length, 6);
  assert.equal(h.peakConcurrency(), 3);
});

test("sale ID restrictions retain search/category filters and preferred-store prices", async () => {
  const h = harness({ active: ["milk", "bread"], preferred: ["milk"], rows: [row("milk"), { ...row("bread"), category: "Bakery" }, row("expired")] });
  const result = await h.service.listProducts({ productIds: ["milk", "expired"], search: "milk,()", category: "Dairy", preferredStoreIds: ["store"] });
  assert.deepEqual(Array.from(h.calls[0].ids), ["milk"]);
  assert.equal(h.calls[0].category, "Dairy");
  assert.match(h.calls[0].search, /ilike\.%milk\s*%/);
  assert.equal(result.data[0].current_price, 5);
  assert.equal(result.data[0].preferred_store_price, 7);
  assert.equal(h.summaryCalls.length, 2);
});

test("empty sale catalogs and summary errors do not download expired products", async () => {
  for (const summaryError of [null, "Prices unavailable"]) {
    const h = harness({ rows: [row("expired")], summaryError });
    const result = await h.service.listProducts();
    assert.equal(result.data.length, 0);
    assert.equal(result.error, summaryError);
    assert.equal(h.calls.length, 0);
  }
});

test("failed product batches return an error instead of a partial sale catalog", async () => {
  const h = harness({ active: ["milk"], rows: [row("milk")], productError: { message: "Products unavailable" } });
  const result = await h.service.listProducts();
  assert.equal(result.data.length, 0);
  assert.equal(result.error, "Products unavailable");
});

test("non-sale product lookups still return expired products without fetching prices", async () => {
  const h = harness({ rows: [row("expired")] });
  const result = await h.service.listProducts({ productIds: ["expired"], onSaleOnly: false, includePriceSummaries: false });
  assert.equal(result.data[0].id, "expired");
  assert.equal(result.data[0].current_price, null);
  assert.equal(h.summaryCalls.length, 0);
});
