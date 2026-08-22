import { hasSupabaseEnv, supabase } from "../supabaseClient";
import { FALLBACK_PRODUCTS } from "./fallbacks";
import {
  buildSessionLabel,
  getCurrentSaleSession,
  getPreviousVisibleSession,
  rowToMeta,
  storeDisplayName,
  toPriceDelta,
  type PriceRowWithMeta,
} from "./priceDataHelpers";
import { fetchRecentPriceRows } from "./priceRowQueries";
import type { PriceRow } from "./types";
import type { MarketStorePrice, ServiceResult } from "./types";

function fallbackStorePrices(productId: string): MarketStorePrice[] {
  const product = FALLBACK_PRODUCTS.find((item) => item.id === productId);
  if (
    !product ||
    product.current_price === null ||
    !product.best_store_id ||
    !product.best_store_name
  ) {
    return [];
  }
  const basePrice = product.best_store_price ?? product.current_price;
  const observedAt = new Date().toISOString();
  const stores = [
    [product.best_store_id, product.best_store_name, product.best_store_area, basePrice],
    ["mock-store-b", "Market B", "Nearby", Number((basePrice * 1.06).toFixed(2))],
    ["mock-store-c", "Fresh Club", "Weekly flyer", Number((basePrice * 1.12).toFixed(2))],
  ] as const;
  return stores.map(([storeId, storeName, storeArea, price]) => ({
    id: `${product.id}-${storeId}`,
    product_id: product.id,
    store_id: storeId,
    store_name: storeName,
    store_area: storeArea,
    price,
    observed_at: observedAt,
    valid_from: observedAt,
    valid_to: null,
    previous_price: null,
    price_delta: null,
    price_delta_percent: null,
    comparison_label: "First tracked sale price",
    comparison_session_previous: null,
    comparison_session_current: "unknown",
  }));
}

export function latestStorePricesFromRows(rows: PriceRow[]): MarketStorePrice[] {
  const metaRows = rows
    .map(rowToMeta)
    .filter((row): row is PriceRowWithMeta => row !== null);
  const currentSession = getCurrentSaleSession(metaRows);
  const previousSession = getPreviousVisibleSession(metaRows, currentSession);
  if (!currentSession) return [];

  const byStore = new Map<string, {
    current?: PriceRowWithMeta;
    previous?: PriceRowWithMeta;
    storeName?: string;
    storeArea?: string | null;
  }>();
  for (const row of metaRows) {
    if (!row.store_id) continue;
    const state = byStore.get(row.store_id) ?? {};
    if (row.priceSession === currentSession) {
      state.current = row;
      state.storeName = storeDisplayName(row.stores);
      state.storeArea = row.stores?.area ?? null;
    } else if (row.priceSession === previousSession) {
      state.previous = row;
    }
    byStore.set(row.store_id, state);
  }

  const result: MarketStorePrice[] = [];
  for (const [storeId, state] of byStore) {
    if (!state.current) continue;
    const delta = toPriceDelta(state.current.price, state.previous?.price ?? null);
    const currentLabel = buildSessionLabel(state.current.priceSession);
    const previousLabel = state.previous
      ? buildSessionLabel(state.previous.priceSession)
      : null;
    result.push({
      id: state.current.id,
      product_id: state.current.product_id,
      store_id: storeId,
      store_name: state.storeName ?? storeDisplayName(state.current.stores),
      store_area: state.storeArea ?? state.current.stores?.area ?? null,
      price: state.current.price,
      observed_at: state.current.observed_at,
      valid_from: state.current.valid_from ?? null,
      valid_to: state.current.valid_to ?? null,
      previous_price: state.previous?.price ?? null,
      price_delta: delta.priceDelta,
      price_delta_percent: delta.percentDelta,
      comparison_label: state.previous
        ? `Current sale ${currentLabel} vs last sale ${previousLabel}`
        : `First tracked sale price${currentLabel ? ` (${currentLabel})` : ""}`,
      comparison_session_current: currentLabel,
      comparison_session_previous: previousLabel,
    });
  }
  return result.sort((a, b) => a.price - b.price);
}

export async function listLatestStorePricesForProducts(
  productIds: string[],
): Promise<ServiceResult<MarketStorePrice[]>> {
  const normalizedProductIds = [...new Set(productIds.map((id) => id.trim()).filter(Boolean))];
  if (normalizedProductIds.length === 0) return { data: [], error: null };
  if (!hasSupabaseEnv || !supabase) {
    return {
      data: normalizedProductIds.flatMap((productId) => fallbackStorePrices(productId)),
      error: null,
    };
  }

  const response = await fetchRecentPriceRows(normalizedProductIds);
  if (response.error) return { data: [], error: response.error.message };
  const rowsByProduct = new Map<string, PriceRow[]>();
  for (const row of response.data) {
    const rows = rowsByProduct.get(row.product_id) ?? [];
    rows.push(row);
    rowsByProduct.set(row.product_id, rows);
  }
  return {
    data: normalizedProductIds.flatMap((productId) =>
      latestStorePricesFromRows(rowsByProduct.get(productId) ?? []),
    ),
    error: null,
  };
}

export async function listLatestStorePricesForProduct(
  productId: string,
): Promise<ServiceResult<MarketStorePrice[]>> {
  if (!productId.trim()) return { data: [], error: "Product id is required." };
  return listLatestStorePricesForProducts([productId]);
}
