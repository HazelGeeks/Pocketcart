import type { MarketProduct, MarketStorePrice } from "../services/marketData";
import type { WatchlistItem } from "../services/watchlist";
import { buildCanonicalSaleAlertIdentity } from "./saleAlertIdentity";
import { productDisplayName } from "./productNames";

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
  saleEndsAt: string | null;
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
  const lowestPriceByProduct = new Map<string, MarketStorePrice>();
  const priceByProductAndStore = new Map<string, MarketStorePrice>();
  for (const price of params.preferredStorePrices ?? []) {
    priceByProductAndStore.set(`${price.product_id}\u0000${price.store_id}`, price);
    const lowest = lowestPriceByProduct.get(price.product_id);
    if (!lowest || price.price < lowest.price) {
      lowestPriceByProduct.set(price.product_id, price);
    }
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
        : preferredPriceByProduct.get(item.product_id) ??
          lowestPriceByProduct.get(item.product_id);
      if (!preferredPrice) return null;
      const currentPrice = preferredPrice.price;
      const previousPrice = preferredPrice.previous_price;
      const priceDelta = preferredPrice.price_delta;
      const storeId = preferredPrice.store_id;
      const storeName = preferredPrice.store_name || item.store || "a store";
      const identity = buildCanonicalSaleAlertIdentity({
        productId: item.product_id,
        storeId,
        session: {
          validFrom: preferredPrice.valid_from,
          validTo: preferredPrice.valid_to,
          observedAt: preferredPrice.observed_at,
        },
      });
      if (!identity) return null;
      const hasDrop =
        priceDelta !== null &&
        priceDelta < 0 &&
        previousPrice !== null;
      const title = hasDrop ? "Sale started" : "Watched item is on sale";
      const productName = productDisplayName(product);
      const body = hasDrop
        ? `${productName} is now $${currentPrice.toFixed(2)} at ${storeName}, down from $${previousPrice!.toFixed(2)}.`
        : `${productName} is currently on sale for $${currentPrice.toFixed(2)} at ${storeName}.`;

      return {
        alertKey: identity.alertKey,
        watchlistItemId: item.id,
        productId: item.product_id,
        storeId,
        title,
        body,
        salePrice: currentPrice,
        previousPrice,
        saleStartedAt: identity.saleStartedAt,
        saleEndsAt: identity.saleEndsAt,
      };
    })
    .filter((item): item is SaleAlertCandidate => item !== null);

  return dedupeSaleAlertCandidates(candidates);
}
