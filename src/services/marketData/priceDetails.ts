import { hasSupabaseEnv, supabase } from "../supabaseClient";
import { listProductPriceHistory, productPriceHistoryFromRows } from "./priceHistory";
import { fetchPriceRows } from "./priceRowQueries";
import {
  latestStorePricesFromRows,
  listLatestStorePricesForProduct,
} from "./storePrices";
import type { MarketPricePoint, MarketStorePrice, ServiceResult } from "./types";

type ProductPriceDetails = {
  history: MarketPricePoint[];
  storePrices: MarketStorePrice[];
};

export async function listProductPriceDetails(
  productId: string,
): Promise<ServiceResult<ProductPriceDetails>> {
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
  return {
    data: {
      history: productPriceHistoryFromRows(productId, response.data),
      storePrices: latestStorePricesFromRows(response.data),
    },
    error: null,
  };
}
