import { money } from "../../screens/nativeAppData";
import type { MarketProduct, MarketStorePrice } from "../../services/marketData";
import {
  retailerNameFromStoreDisplayName,
  selectLowestPriceByRetailer,
} from "../../utils/retailerPriceDisplay";
import { formatSignedPercent } from "./priceDisplay";

export type StorePriceDisplayGroup = {
  id: string;
  storeLabel: string;
  price: number;
  price_delta_percent: number | null;
  comparison_label: string;
};

export function buildStorePriceGroups(rows: MarketStorePrice[]): StorePriceDisplayGroup[] {
  return selectLowestPriceByRetailer(rows).map(({ retailerName, source }) => ({
    id: source.id,
    storeLabel: retailerName,
    price: source.price,
    price_delta_percent: source.price_delta_percent,
    comparison_label: source.comparison_label,
  }));
}

export function getProductPriceView(product: MarketProduct) {
  const usesPreferredStore = product.preferred_store_price !== null;
  const currentPrice = usesPreferredStore ? product.preferred_store_price : product.current_price;
  const previousPrice = usesPreferredStore
    ? product.preferred_previous_price
    : product.previous_price;
  const priceDelta = usesPreferredStore ? product.preferred_price_delta : product.price_delta;
  const priceDeltaPercent = usesPreferredStore
    ? product.preferred_price_delta_percent
    : product.price_delta_percent;
  const isRising = priceDelta !== null && priceDelta > 0;
  const isDropping = priceDelta !== null && priceDelta < 0;
  const hasPreviousData = previousPrice !== null && currentPrice !== null;
  const distanceToPrevious = hasPreviousData ? currentPrice - previousPrice : null;
  const bestStoreName = usesPreferredStore ? product.preferred_store_name : product.best_store_name;
  const bestRetailerName = bestStoreName ? retailerNameFromStoreDisplayName(bestStoreName) : null;

  return {
    usesPreferredStore,
    currentPrice,
    previousPrice,
    priceDelta,
    priceDeltaPercent,
    isRising,
    isDropping,
    hasTrend: priceDelta !== null && hasPreviousData,
    bestStoreId: usesPreferredStore ? product.preferred_store_id : product.best_store_id,
    bestStoreName,
    bestRetailerName,
    storeLine: bestRetailerName ?? "Retailer not linked yet",
    decisionText: !hasPreviousData
      ? "No earlier sale price to compare yet."
      : isDropping
        ? `${money.format(Math.abs(distanceToPrevious ?? 0))} cheaper than the last sale`
        : isRising
          ? `${money.format(distanceToPrevious ?? 0)} higher than the last sale`
          : "Same as the last sale",
    decisionLabel:
      priceDelta === null || !hasPreviousData
        ? "Price trend data is not enough yet."
        : isRising
          ? `Price trend: ${formatSignedPercent(priceDeltaPercent ?? 0)} from the last sale (up)`
          : isDropping
            ? `Price trend: ${formatSignedPercent(priceDeltaPercent ?? 0)} from the last sale (down)`
            : "Price trend: same as the last sale",
  };
}

export type ProductPriceView = ReturnType<typeof getProductPriceView>;
