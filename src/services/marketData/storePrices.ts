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
import { fetchPriceRows } from "./priceRowQueries";
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
    previous_price: null,
    price_delta: null,
    price_delta_percent: null,
    comparison_label: "First tracked sale price",
    comparison_session_previous: null,
    comparison_session_current: "unknown",
  }));
}

export async function listLatestStorePricesForProduct(
  productId: string,
): Promise<ServiceResult<MarketStorePrice[]>> {
  if (!productId.trim()) return { data: [], error: "Product id is required." };
  if (!hasSupabaseEnv || !supabase) {
    return { data: fallbackStorePrices(productId), error: null };
  }

  const response = await fetchPriceRows({ productId, ascending: false });
  if (response.error) return { data: [], error: response.error.message };
  const rows = response.data
    .map(rowToMeta)
    .filter((row): row is PriceRowWithMeta => row !== null);
  const currentSession = getCurrentSaleSession(rows);
  const previousSession = getPreviousVisibleSession(rows, currentSession);
  if (!currentSession) return { data: [], error: null };

  const byStore = new Map<string, {
    current?: PriceRowWithMeta;
    previous?: PriceRowWithMeta;
    storeName?: string;
    storeArea?: string | null;
  }>();
  for (const row of rows) {
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
  return { data: result.sort((a, b) => a.price - b.price), error: null };
}
