import { hasSupabaseEnv, supabase } from "../supabaseClient";
import { listProductPriceHistory, productPriceHistoryFromRows } from "./priceHistory";
import { fetchPriceRows } from "./priceRowQueries";
import { latestStorePricesFromRows, listLatestStorePricesForProduct } from "./storePrices";
import type { MarketPricePoint, MarketStorePrice, ServiceResult } from "./types";
import { requestCache } from "../../utils/requestCache";

type ProductPriceDetails = {
  history: MarketPricePoint[];
  storePrices: MarketStorePrice[];
};

type CachedDetails = ServiceResult<ProductPriceDetails> & { cacheUntil?: number };
const cachedDetails = requestCache<CachedDetails>(60_000);

export function listProductPriceDetails(
  productId: string,
): Promise<ServiceResult<ProductPriceDetails>> {
  const id = productId.trim();
  return cachedDetails(
    id,
    () => loadProductPriceDetails(id),
    (result) => result.error === null,
    (result) => result.cacheUntil ?? Date.now() + 60_000,
  );
}

async function loadProductPriceDetails(productId: string): Promise<CachedDetails> {
  if (!productId.trim()) {
    return {
      data: { history: [], storePrices: [] },
      error: "Product id is required.",
    };
  }
  if (!hasSupabaseEnv || !supabase) {
    const [history, storePrices] = await Promise.all([
      listProductPriceHistory(productId),
      listLatestStorePricesForProduct(productId),
    ]);
    return {
      data: { history: history.data, storePrices: storePrices.data },
      error: history.error ?? storePrices.error,
    };
  }

  const response = await fetchPriceRows({ productId, ascending: true });
  if (response.error) {
    return {
      data: { history: [], storePrices: [] },
      error: response.error.message,
    };
  }
  const now = Date.now();
  const boundaries = response.data
    .flatMap((row) => [
      Date.parse(row.valid_from ?? row.observed_at),
      row.valid_to ? Date.parse(row.valid_to) + 1 : Number.NaN,
    ])
    .filter((date) => date > now);
  return {
    cacheUntil: boundaries.reduce((expiry, date) => Math.min(expiry, date), now + 60_000),
    data: {
      history: productPriceHistoryFromRows(productId, response.data),
      storePrices: latestStorePricesFromRows(response.data),
    },
    error: null,
  };
}
