import { money } from "../../screens/nativeAppData";
import type { MarketProduct } from "../../services/marketData";
import { productDisplayName } from "../../utils/productNames";
import { formatSignedPercent } from "./priceDisplay";

export type HomeSortMode = "deals" | "lowestPrice" | "biggestDrop";

export const SORT_OPTIONS: Array<{ value: HomeSortMode; label: string }> = [
  { value: "deals", label: "Best deals" },
  { value: "lowestPrice", label: "Lowest price" },
  { value: "biggestDrop", label: "Biggest drop" },
];

export function displayPriceForProduct(product: MarketProduct): number | null {
  return (
    product.preferred_store_price ??
    product.current_price ??
    product.best_store_price ??
    product.previous_price
  );
}

export function formatPriceLabel(value: number | null): string {
  return value === null ? "No price" : money.format(value);
}

export function formatTrendLabel(product: MarketProduct): string | null {
  const preferred = product.preferred_store_price !== null;
  const previous = preferred ? product.preferred_previous_price : product.previous_price;
  const deltaPercent = preferred
    ? product.preferred_price_delta_percent
    : product.price_delta_percent;
  const delta = preferred ? product.preferred_price_delta : product.price_delta;
  if (previous === null || deltaPercent === null) return null;
  const direction = delta === null || delta === 0 ? "Flat" : delta < 0 ? "Down" : "Up";
  return `${direction} ${formatSignedPercent(deltaPercent)}`;
}

export function sortHomeProducts(
  products: MarketProduct[],
  sortMode: HomeSortMode,
): MarketProduct[] {
  return products.slice().sort((a, b) => {
    const favoriteDifference =
      Number(Boolean(b.preferred_store_id)) - Number(Boolean(a.preferred_store_id));
    if (favoriteDifference !== 0) return favoriteDifference;
    if (sortMode === "biggestDrop") {
      const aDrop =
        (a.preferred_store_price !== null
          ? a.preferred_price_delta_percent
          : a.price_delta_percent) ?? Number.MAX_VALUE;
      const bDrop =
        (b.preferred_store_price !== null
          ? b.preferred_price_delta_percent
          : b.price_delta_percent) ?? Number.MAX_VALUE;
      if (aDrop !== bDrop) return aDrop - bDrop;
    }
    if (sortMode === "lowestPrice" || sortMode === "deals") {
      const aPrice = displayPriceForProduct(a) ?? Number.MAX_VALUE;
      const bPrice = displayPriceForProduct(b) ?? Number.MAX_VALUE;
      if (aPrice !== bPrice) return aPrice - bPrice;
    }
    return productDisplayName(a).localeCompare(productDisplayName(b));
  });
}
