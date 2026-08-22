const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

function read(path) {
  return fs.readFileSync(path, "utf8");
}

test("security migration removes broad catalog writes and optimizes auth RLS", () => {
  const migration = read("supabase/migrations/20260822200000_security_hardening.sql");

  for (const table of ["products", "stores", "product_prices"]) {
    for (const action of ["insert", "update", "delete"]) {
      assert.match(migration, new RegExp(`drop policy if exists ${table}_${action}_auth`));
    }
  }
  assert.match(migration, /\(select auth\.uid\(\)\)/);
  assert.match(migration, /\(select public\.is_admin\(\)\)/);
  assert.match(migration, /drop policy if exists product_images_public_read/);
  assert.match(migration, /revoke all on function public\.handle_new_user_profile/);
});

test("query migration batches recent prices and covers advisor foreign keys", () => {
  const migration = read("supabase/migrations/20260822201000_query_optimization.sql");

  assert.match(migration, /create or replace function public\.list_product_categories/);
  assert.match(migration, /create or replace function public\.list_product_recent_price_rows/);
  assert.match(migration, /cross join lateral/);
  for (const index of [
    "admin_audit_logs_actor_user_idx",
    "product_identity_reviews_resolved_product_idx",
    "push_delivery_tickets_alert_idx",
    "sale_alerts_watchlist_item_idx",
    "shopping_list_items_product_idx",
    "watchlist_items_store_idx",
  ]) {
    assert.match(migration, new RegExp(`create index if not exists ${index}`));
  }
});

test("native catalog debounces search and shares one detail price request", () => {
  const catalog = read("src/hooks/useNativeCatalog.ts");

  assert.match(catalog, /setTimeout\(\(\) => setDebouncedQuery\(query\.trim\(\)\), 400\)/);
  assert.match(catalog, /search: debouncedQuery/);
  assert.equal((catalog.match(/listProductPriceDetails\(productId\)/g) ?? []).length, 1);
  assert.doesNotMatch(catalog, /listProductPriceHistory\(productId\)/);
  assert.doesNotMatch(catalog, /listLatestStorePricesForProduct\(productId\)/);
});

test("catalog, shopping, and alert queries use server filters and batched prices", () => {
  const products = read("src/services/marketData/products.ts");
  const shopping = read("src/hooks/useNativeShoppingPlan.ts");
  const alerts = read("src/services/saleAlerts.ts");
  const scheduledAlerts = read("supabase/functions/sync-sale-alerts/index.ts");

  assert.match(products, /korean_name\.ilike/);
  assert.match(products, /CATEGORY_CACHE_TTL_MS/);
  assert.match(products, /rpc\("list_product_categories"\)/);
  assert.match(shopping, /listLatestStorePricesForProducts\(ids\)/);
  assert.match(alerts, /listLatestStorePricesForProducts\(productIds\)/);
  assert.match(scheduledAlerts, /rpc\("list_product_recent_price_rows"/);
});
