import type { MarketProduct, MarketStorePrice } from "../services/marketData";
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

export function dedupeSaleAlertCandidates(
  candidates: SaleAlertCandidate[],
): SaleAlertCandidate[] {
  const seenKeys = new Set<string>();
  return candidates.filter((candidate) => {
    if (seenKeys.has(candidate.alertKey)) return false;
    seenKeys.add(candidate.alertKey);
    return true;
  });
}

export function buildSaleAlertCandidates(params: {
  favoriteStoreIds?: string[];
  preferredStorePrices?: MarketStorePrice[];
  watchlistItems: WatchlistItem[];
  products: MarketProduct[];
}): SaleAlertCandidate[] {
  const productById = new Map(params.products.map((product) => [product.id, product]));
  const favoriteStoreIdSet = new Set(params.favoriteStoreIds ?? []);
  const preferredPriceByProduct = new Map<string, MarketStorePrice>();
  const priceByProductAndStore = new Map<string, MarketStorePrice>();
  for (const price of params.preferredStorePrices ?? []) {
    priceByProductAndStore.set(`${price.product_id}\u0000${price.store_id}`, price);
    if (!favoriteStoreIdSet.has(price.store_id)) continue;
    const existing = preferredPriceByProduct.get(price.product_id);
    if (!existing || price.price < existing.price) {
      preferredPriceByProduct.set(price.product_id, price);
    }
  }

  const candidates = params.watchlistItems
    .map((item): SaleAlertCandidate | null => {
      if (!item.product_id) return null;
      const product = productById.get(item.product_id);
      if (!product || product.current_price === null) return null;

      const explicitPrice = item.store_id
        ? priceByProductAndStore.get(`${item.product_id}\u0000${item.store_id}`)
        : undefined;
      if (item.store_id && !explicitPrice) return null;
      const preferredPrice = item.store_id
        ? explicitPrice
        : preferredPriceByProduct.get(item.product_id);
      const productPreferredPrice =
        !item.store_id && product.preferred_store_id && product.preferred_store_price !== null
          ? {
              price: product.preferred_store_price,
              previousPrice: product.preferred_previous_price,
              priceDelta: product.preferred_price_delta,
              currentBatch: product.preferred_price_compare_current_batch,
              storeId: product.preferred_store_id,
              storeName: product.preferred_store_name,
            }
          : null;
      const currentPrice =
        preferredPrice?.price ??
        productPreferredPrice?.price ??
        product.current_price;
      const previousPrice =
        preferredPrice?.previous_price ??
        productPreferredPrice?.previousPrice ??
        product.previous_price;
      const priceDelta =
        preferredPrice?.price_delta ??
        productPreferredPrice?.priceDelta ??
        product.price_delta;
      const currentBatch =
        preferredPrice?.comparison_session_current?.trim() ||
        productPreferredPrice?.currentBatch?.trim() ||
        product.price_compare_current_batch?.trim() ||
        "current";
      const storeId =
        preferredPrice?.store_id ??
        productPreferredPrice?.storeId ??
        item.store_id ??
        product.best_store_id ??
        null;
      const storeName =
        preferredPrice?.store_name ??
        productPreferredPrice?.storeName ??
        (item.store_id ? item.store : null) ??
        product.best_store_name ??
        (item.store || "a store");
      const alertKey = [
        item.product_id,
        currentBatch.toLowerCase(),
        storeId ?? "any-store",
      ].join("|");
      const hasDrop =
        priceDelta !== null &&
        priceDelta < 0 &&
        previousPrice !== null;
      const title = hasDrop ? "Sale started" : "Watched item is on sale";
      const body = hasDrop
        ? `${product.name} is now $${currentPrice.toFixed(2)} at ${storeName}, down from $${previousPrice!.toFixed(2)}.`
        : `${product.name} is currently on sale for $${currentPrice.toFixed(2)} at ${storeName}.`;

      return {
        alertKey,
        watchlistItemId: item.id,
        productId: item.product_id,
        storeId,
        title,
        body,
        salePrice: currentPrice,
        previousPrice,
        saleStartedAt: currentBatch,
      };
    })
    .filter((item): item is SaleAlertCandidate => item !== null);

  return dedupeSaleAlertCandidates(candidates);
}
