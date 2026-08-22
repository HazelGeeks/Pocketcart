import { hasSupabaseEnv, supabase } from "../supabaseClient";
import { selectLowestPricePerSaleSession } from "../../utils/productPriceHistory";
import { FALLBACK_PRICE_HISTORY } from "./fallbacks";
import { storeDisplayName } from "./priceDataHelpers";
import { fetchPriceRows } from "./priceRowQueries";
import { parseNumber } from "./shared";
import type { MarketPricePoint, ServiceResult } from "./types";

export function productPriceHistoryFromRows(
  productId: string,
  rows: Awaited<ReturnType<typeof fetchPriceRows>>["data"],
): MarketPricePoint[] {
  const candidates = rows.flatMap((row) => {
    const price = parseNumber(row.price);
    if (price === null) return [];
    return [{
      id: row.id,
      productId: row.product_id,
      price,
      observedAt: row.observed_at,
      validFrom: row.valid_from ?? null,
      validTo: row.valid_to ?? null,
      storeId: row.store_id ?? null,
      storeName: storeDisplayName(row.stores),
      storeArea: row.stores?.area?.trim() || null,
    }];
  });

  return selectLowestPricePerSaleSession(candidates).map((row) => ({
    id: row.id,
    product_id: productId,
    price: row.price,
    observed_at: row.sessionStartedAt,
    sale_end_at: row.validTo,
    store_id: row.storeId,
    store_name: row.storeName,
    store_area: row.storeArea,
    store_prices: row.storePrices.map((storePrice) => ({
      id: storePrice.id,
      price: storePrice.price,
      store_id: storePrice.storeId,
      store_name: storePrice.storeName,
      store_area: storePrice.storeArea,
    })),
  }));
}

export async function listProductPriceHistory(
  productId: string,
): Promise<ServiceResult<MarketPricePoint[]>> {
  if (!productId.trim()) return { data: [], error: "Product id is required." };
  if (!hasSupabaseEnv || !supabase) {
    const values = FALLBACK_PRICE_HISTORY[productId] ?? [];
    const today = new Date();
    return {
      data: values.map((value, index) => {
        const day = new Date(today);
        day.setDate(today.getDate() - (values.length - 1 - index));
        return {
          id: `${productId}-${index}`,
          product_id: productId,
          price: value,
          observed_at: day.toISOString(),
          sale_end_at: null,
          store_id: null,
          store_name: "Store not linked",
          store_area: null,
          store_prices: [{
            id: `${productId}-${index}`,
            price: value,
            store_id: null,
            store_name: "Store not linked",
            store_area: null,
          }],
        };
      }),
      error: null,
    };
  }

  const response = await fetchPriceRows({ productId, ascending: true });
  if (response.error) return { data: [], error: response.error.message };
  return {
    data: productPriceHistoryFromRows(productId, response.data),
    error: null,
  };
}
