import type { MarketProduct } from "../services/marketData";
import type { WatchlistItem } from "../services/watchlist";

export type SaleAlertCandidate = {
  alertKey: string;
  watchlistItemId: string;
  productId: string;
  storeId: string | null;
  title: string;
  body: string;
  salePrice: number | null;
  previousPrice: number | null;
  saleStartedAt: string | null;
};

export function buildSaleAlertCandidates(params: {
  watchlistItems: WatchlistItem[];
  products: MarketProduct[];
}): SaleAlertCandidate[] {
  const productById = new Map(params.products.map((product) => [product.id, product]));

  return params.watchlistItems
    .map((item): SaleAlertCandidate | null => {
      if (!item.product_id) return null;
      const product = productById.get(item.product_id);
      if (!product || product.current_price === null) return null;

      const currentBatch = product.price_compare_current_batch?.trim() || "current";
      const storeId = product.best_store_id ?? item.store_id ?? null;
      const storeName = product.best_store_name ?? (item.store || "a store");
      const alertKey = [
        item.product_id,
        currentBatch.toLowerCase(),
        storeId ?? "any-store",
      ].join("|");
      const hasDrop =
        product.price_delta !== null &&
        product.price_delta < 0 &&
        product.previous_price !== null;
      const title = hasDrop ? "Sale started" : "Watched item is on sale";
      const body = hasDrop
        ? `${product.name} is now $${product.current_price.toFixed(2)} at ${storeName}, down from $${product.previous_price!.toFixed(2)}.`
        : `${product.name} is currently on sale for $${product.current_price.toFixed(2)} at ${storeName}.`;

      return {
        alertKey,
        watchlistItemId: item.id,
        productId: item.product_id,
        storeId,
        title,
        body,
        salePrice: product.current_price,
        previousPrice: product.previous_price,
        saleStartedAt: product.price_compare_current_batch,
      };
    })
    .filter((item): item is SaleAlertCandidate => item !== null);
}
