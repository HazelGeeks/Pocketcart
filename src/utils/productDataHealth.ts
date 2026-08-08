import { saleSessionKey, saleSessionStart } from "./saleSession";
import { productDisplayName } from "./productNames";

export type DataHealthProduct = {
  id: string;
  korean_name: string;
  english_name?: string | null;
  brand?: string | null;
  gtin?: string | null;
  unit: string | null;
};

export type DataHealthPrice = {
  product_id: string;
  store_id: string;
  price: number;
  valid_from: string;
  valid_to: string | null;
  observed_at: string;
  product_name: string | null;
  store_name: string | null;
  store_brand?: string | null;
};

export type HistoryCollectionProduct = {
  id: string;
  name: string;
  sessionCount: number;
  latestSessionAt: string | null;
  activeNow: boolean;
  missingUnit: boolean;
};

export type ProductDataHealth = {
  totalProducts: number;
  noHistory: number;
  oneSession: number;
  twoPlusSessions: number;
  fourPlusSessions: number;
  eightPlusSessions: number;
  missingUnit: number;
  missingSalePeriodRows: number;
  unlinkedPriceRows: number;
  staleProducts: number;
  crossStorePriceDifferenceSessions: number;
  comparableMultiStoreSessions: number;
  comparableMultiBrandSessions: number;
  issueCount: number;
  collectionQueue: HistoryCollectionProduct[];
};

function time(value: string | null): number {
  if (!value) return Number.NEGATIVE_INFINITY;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
}

export function buildProductDataHealth(
  products: DataHealthProduct[],
  prices: DataHealthPrice[],
  nowMs = Date.now(),
): ProductDataHealth {
  const sessionsByProduct = new Map<string, Set<string>>();
  const latestSessionByProduct = new Map<string, string>();
  const activeProductIds = new Set<string>();
  const sessionPriceRows = new Map<string, {
    stores: Set<string>;
    brands: Set<string>;
    prices: Set<string>;
  }>();
  let missingSalePeriodRows = 0;
  let unlinkedPriceRows = 0;

  for (const row of prices) {
    const productId = row.product_id.trim();
    const storeId = row.store_id.trim();
    if (!productId || !storeId || !row.product_name || !row.store_name) {
      unlinkedPriceRows += 1;
    }
    if (!productId) continue;

    if (!row.valid_from || !row.valid_to) missingSalePeriodRows += 1;
    const sessionStart = saleSessionStart({
      validFrom: row.valid_from,
      validTo: row.valid_to,
      observedAt: row.observed_at,
    });
    const session = saleSessionKey({
      validFrom: row.valid_from,
      validTo: row.valid_to,
      observedAt: row.observed_at,
    });
    if (!sessionStart) continue;

    const sessions = sessionsByProduct.get(productId) ?? new Set<string>();
    sessions.add(session);
    sessionsByProduct.set(productId, sessions);

    const previousLatest = latestSessionByProduct.get(productId) ?? null;
    if (!previousLatest || time(sessionStart) > time(previousLatest)) {
      latestSessionByProduct.set(productId, sessionStart);
    }

    const startMs = time(sessionStart);
    const endMs = row.valid_to ? time(row.valid_to) : Number.POSITIVE_INFINITY;
    if (startMs <= nowMs && endMs >= nowMs) activeProductIds.add(productId);

    const sessionKey = `${productId}\u0000${session}`;
    const comparison = sessionPriceRows.get(sessionKey) ?? {
      stores: new Set<string>(),
      brands: new Set<string>(),
      prices: new Set<string>(),
    };
    if (storeId) comparison.stores.add(storeId);
    if (row.store_brand?.trim()) comparison.brands.add(row.store_brand.trim().toLowerCase());
    if (Number.isFinite(row.price)) comparison.prices.add(row.price.toFixed(4));
    sessionPriceRows.set(sessionKey, comparison);
  }

  const sessionCounts = products.map((product) => ({
    product,
    sessionCount: sessionsByProduct.get(product.id)?.size ?? 0,
    latestSessionAt: latestSessionByProduct.get(product.id) ?? null,
  }));
  const staleCutoff = nowMs - 30 * 24 * 60 * 60 * 1000;
  const staleProducts = sessionCounts.filter(
    ({ sessionCount, latestSessionAt }) =>
      sessionCount > 0 && time(latestSessionAt) < staleCutoff,
  ).length;
  const crossStorePriceDifferenceSessions = Array.from(sessionPriceRows.values()).filter(
    (session) => session.stores.size > 1 && session.prices.size > 1,
  ).length;
  const comparableMultiStoreSessions = Array.from(sessionPriceRows.values()).filter(
    (session) => session.stores.size > 1,
  ).length;
  const comparableMultiBrandSessions = Array.from(sessionPriceRows.values()).filter(
    (session) => session.brands.size > 1,
  ).length;
  const missingUnit = products.filter((product) => !product.unit?.trim()).length;

  const collectionQueue = sessionCounts
    .filter(({ sessionCount }) => sessionCount < 4)
    .sort((a, b) => {
      const activeDifference =
        Number(activeProductIds.has(b.product.id)) - Number(activeProductIds.has(a.product.id));
      if (activeDifference !== 0) return activeDifference;
      if (a.sessionCount !== b.sessionCount) return b.sessionCount - a.sessionCount;
      const latestDifference = time(b.latestSessionAt) - time(a.latestSessionAt);
      if (latestDifference !== 0) return latestDifference;
      return productDisplayName(a.product).localeCompare(productDisplayName(b.product));
    })
    .slice(0, 100)
    .map(({ product, sessionCount, latestSessionAt }) => ({
      id: product.id,
      name: productDisplayName(product),
      sessionCount,
      latestSessionAt,
      activeNow: activeProductIds.has(product.id),
      missingUnit: !product.unit?.trim(),
    }));

  return {
    totalProducts: products.length,
    noHistory: sessionCounts.filter(({ sessionCount }) => sessionCount === 0).length,
    oneSession: sessionCounts.filter(({ sessionCount }) => sessionCount === 1).length,
    twoPlusSessions: sessionCounts.filter(({ sessionCount }) => sessionCount >= 2).length,
    fourPlusSessions: sessionCounts.filter(({ sessionCount }) => sessionCount >= 4).length,
    eightPlusSessions: sessionCounts.filter(({ sessionCount }) => sessionCount >= 8).length,
    missingUnit,
    missingSalePeriodRows,
    unlinkedPriceRows,
    staleProducts,
    crossStorePriceDifferenceSessions,
    comparableMultiStoreSessions,
    comparableMultiBrandSessions,
    issueCount:
      missingUnit +
      missingSalePeriodRows +
      unlinkedPriceRows +
      staleProducts,
    collectionQueue,
  };
}
