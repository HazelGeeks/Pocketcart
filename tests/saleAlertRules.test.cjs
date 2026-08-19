const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildSaleAlertCandidates,
} = require("../.tmp-tests/utils/saleAlertRules.js");
const {
  buildCanonicalSaleAlertIdentity,
} = require("../.tmp-tests/utils/saleAlertIdentity.js");
const {
  buildCanonicalSaleAlertIdentity: buildScheduledSaleAlertIdentity,
} = require("../.tmp-tests/supabase/functions/_shared/saleAlertIdentity.js");

test("buildSaleAlertCandidates creates alerts for watched products on sale", () => {
  const alerts = buildSaleAlertCandidates({
    watchlistItems: [
      {
        id: "watch-1",
        product_id: "product-1",
        store_id: null,
        name: "Milk",
        store: "Any store",
      },
      {
        id: "watch-2",
        product_id: "product-2",
        store_id: null,
        name: "Eggs",
        store: "Any store",
      },
    ],
    products: [
      {
        id: "product-1",
        korean_name: "우유",
        english_name: "Milk",
        current_price: 3.99,
        previous_price: 4.99,
        price_delta: -1,
        best_store_id: "store-1",
        best_store_name: "Safeway - Robson",
        price_compare_current_batch: "Jun 28, 2026",
      },
      {
        id: "product-2",
        korean_name: "달걀",
        english_name: "Eggs",
        current_price: null,
        previous_price: null,
        price_delta: null,
        best_store_id: null,
        best_store_name: null,
        price_compare_current_batch: null,
      },
    ],
    preferredStorePrices: [
      {
        id: "price-1",
        product_id: "product-1",
        store_id: "store-1",
        store_name: "Safeway - Robson",
        price: 3.99,
        observed_at: "2026-06-28T07:00:00.000Z",
        valid_from: "2026-06-28T07:00:00.000Z",
        valid_to: "2026-07-05T06:59:59.999Z",
        previous_price: 4.99,
        price_delta: -1,
      },
    ],
  });

  assert.equal(alerts.length, 1);
  assert.equal(
    alerts[0].alertKey,
    "product-1|2026-06-28t07:00:00.000z..2026-07-05t06:59:59.999z|store-1",
  );
  assert.equal(alerts[0].saleStartedAt, "2026-06-28T07:00:00.000Z");
  assert.equal(alerts[0].title, "Sale started");
  assert.match(alerts[0].body, /^Milk is now/);
  assert.match(alerts[0].body, /Safeway - Robson/);
});

test("buildSaleAlertCandidates prefers the cheapest saved My store price", () => {
  const [alert] = buildSaleAlertCandidates({
    favoriteStoreIds: ["favorite-store"],
    watchlistItems: [
      {
        id: "watch-1",
        product_id: "product-1",
        store_id: null,
        name: "Milk",
        store: "Any store",
      },
    ],
    products: [
      {
        id: "product-1",
        korean_name: "우유",
        english_name: "Milk",
        current_price: 2.99,
        previous_price: 3.49,
        price_delta: -0.5,
        best_store_id: "global-cheapest",
        best_store_name: "Global Cheapest",
        price_compare_current_batch: "Jul 24, 2026",
      },
    ],
    preferredStorePrices: [
      {
        id: "price-1",
        product_id: "product-1",
        store_id: "favorite-store",
        store_name: "My H-Mart",
        store_area: null,
        price: 3.19,
        observed_at: "2026-07-24T00:00:00.000Z",
        valid_from: "2026-07-24T00:00:00.000Z",
        valid_to: "2026-07-31T00:00:00.000Z",
        previous_price: 3.99,
        price_delta: -0.8,
        price_delta_percent: -20.05,
        comparison_label: "Current vs last",
        comparison_session_current: "Jul 24, 2026",
        comparison_session_previous: "Jul 17, 2026",
      },
    ],
  });

  assert.equal(alert.storeId, "favorite-store");
  assert.equal(alert.salePrice, 3.19);
  assert.match(alert.body, /My H-Mart/);
});

test("buildSaleAlertCandidates honors an explicitly watched store over My stores", () => {
  const [alert] = buildSaleAlertCandidates({
    favoriteStoreIds: ["favorite-store"],
    watchlistItems: [
      {
        id: "watch-1",
        product_id: "product-1",
        store_id: "explicit-store",
        name: "Milk",
        store: "Explicit Market",
      },
    ],
    products: [
      {
        id: "product-1",
        korean_name: "우유",
        english_name: "Milk",
        current_price: 2.99,
        previous_price: 3.49,
        price_delta: -0.5,
        best_store_id: "global-store",
        best_store_name: "Global Store",
        price_compare_current_batch: "Jul 24, 2026",
      },
    ],
    preferredStorePrices: [
      {
        id: "favorite-price",
        product_id: "product-1",
        store_id: "favorite-store",
        store_name: "Favorite Market",
        price: 3.19,
        observed_at: "2026-07-24T00:00:00.000Z",
        valid_from: "2026-07-24T00:00:00.000Z",
        valid_to: "2026-07-31T00:00:00.000Z",
        previous_price: 3.99,
        price_delta: -0.8,
        comparison_session_current: "Jul 24, 2026",
      },
      {
        id: "explicit-price",
        product_id: "product-1",
        store_id: "explicit-store",
        store_name: "Explicit Market",
        price: 3.49,
        observed_at: "2026-07-24T00:00:00.000Z",
        valid_from: "2026-07-24T00:00:00.000Z",
        valid_to: "2026-07-31T00:00:00.000Z",
        previous_price: 3.79,
        price_delta: -0.3,
        comparison_session_current: "Jul 24, 2026",
      },
    ],
  });

  assert.equal(alert.storeId, "explicit-store");
  assert.equal(alert.salePrice, 3.49);
  assert.match(alert.body, /Explicit Market/);
});

test("buildSaleAlertCandidates removes duplicate keys after product merges", () => {
  const alerts = buildSaleAlertCandidates({
    watchlistItems: [
      {
        id: "watch-target",
        product_id: "product-1",
        store_id: null,
        name: "Milk",
        store: "Any store",
      },
      {
        id: "watch-merged-source",
        product_id: "product-1",
        store_id: null,
        name: "Milk",
        store: "Any store",
      },
    ],
    products: [
      {
        id: "product-1",
        korean_name: "우유",
        english_name: "Milk",
        current_price: 3.49,
        previous_price: 3.99,
        price_delta: -0.5,
        best_store_id: "store-1",
        best_store_name: "H-Mart",
        price_compare_current_batch: "Jul 24, 2026",
      },
    ],
    preferredStorePrices: [
      {
        id: "price-1",
        product_id: "product-1",
        store_id: "store-1",
        store_name: "H-Mart",
        price: 3.49,
        observed_at: "2026-07-24T00:00:00.000Z",
        valid_from: "2026-07-24T00:00:00.000Z",
        valid_to: "2026-07-31T00:00:00.000Z",
        previous_price: 3.99,
        price_delta: -0.5,
      },
    ],
  });

  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].watchlistItemId, "watch-target");
  assert.equal(
    alerts[0].alertKey,
    "product-1|2026-07-24t00:00:00.000z..2026-07-31t00:00:00.000z|store-1",
  );
});

test("client and scheduled paths use one canonical ISO sale identity", () => {
  const session = {
    validFrom: "2026-07-24T00:00:00-07:00",
    validTo: "2026-07-30T23:59:59.999-07:00",
    observedAt: "2026-07-24T08:00:00.000Z",
  };
  const scheduledIdentity = buildCanonicalSaleAlertIdentity({
    productId: "product-1",
    storeId: "store-1",
    session,
  });
  const edgeIdentity = buildScheduledSaleAlertIdentity({
    productId: "product-1",
    storeId: "store-1",
    session,
  });
  const [clientAlert] = buildSaleAlertCandidates({
    watchlistItems: [{
      id: "watch-1",
      product_id: "product-1",
      store_id: "store-1",
      name: "Milk",
      store: "H-Mart",
    }],
    products: [{
      id: "product-1",
      korean_name: "우유",
      english_name: "Milk",
      current_price: 3.49,
    }],
    preferredStorePrices: [{
      id: "price-1",
      product_id: "product-1",
      store_id: "store-1",
      store_name: "H-Mart",
      price: 3.49,
      observed_at: session.observedAt,
      valid_from: session.validFrom,
      valid_to: session.validTo,
      previous_price: 3.99,
      price_delta: -0.5,
    }],
  });

  assert.equal(
    scheduledIdentity.alertKey,
    "product-1|2026-07-24t07:00:00.000z..2026-07-31t06:59:59.999z|store-1",
  );
  assert.equal(scheduledIdentity.saleStartedAt, "2026-07-24T07:00:00.000Z");
  assert.equal(scheduledIdentity.saleEndsAt, "2026-07-31T06:59:59.999Z");
  assert.equal(clientAlert.alertKey, scheduledIdentity.alertKey);
  assert.equal(clientAlert.saleStartedAt, scheduledIdentity.saleStartedAt);
  assert.equal(clientAlert.saleEndsAt, scheduledIdentity.saleEndsAt);
  assert.deepEqual(edgeIdentity, scheduledIdentity);
});
