import type {
  MarketProduct,
  MarketStorePrice,
} from "../../services/marketData";
import { money } from "../../screens/nativeAppData";
import { formatSignedPercent } from "./priceDisplay";

export type StorePriceDisplayGroup = {
  id: string;
  storeLabel: string;
  areaLabel: string | null;
  branchCount: number;
  price: number;
  price_delta_percent: number | null;
  comparison_label: string;
};

const priceKey = (value: number | null) =>
  value === null ? "none" : Math.round(value * 100).toString();

const percentKey = (value: number | null) =>
  value === null ? "none" : value.toFixed(4);

function splitStoreDisplayName(row: MarketStorePrice) {
  const [brandPart, ...branchParts] = row.store_name.split(" - ");
  const brand = brandPart.trim() || row.store_name.trim() || "Unknown store";
  const branchFromName = branchParts.join(" - ").trim();
  const branch = branchFromName || row.store_area?.trim() || null;
  return { brand, branch };
}

export function buildStorePriceGroups(
  rows: MarketStorePrice[],
): StorePriceDisplayGroup[] {
  const groups = new Map<
    string,
    { brand: string; rows: MarketStorePrice[]; branches: string[] }
  >();

  rows.forEach((row) => {
    const { brand, branch } = splitStoreDisplayName(row);
    const key = [
      brand.toLowerCase(),
      priceKey(row.price),
      row.comparison_session_current ?? "current",
      row.comparison_session_previous ?? "previous",
      priceKey(row.previous_price),
      priceKey(row.price_delta),
      percentKey(row.price_delta_percent),
    ].join("|");
    const group = groups.get(key) ?? { brand, rows: [], branches: [] };
    group.rows.push(row);
    if (branch && !group.branches.includes(branch)) {
      group.branches.push(branch);
    }
    groups.set(key, group);
  });

  return Array.from(groups.values())
    .map((group) => {
      const [sourceRow] = group.rows;
      const firstBranch = group.branches[0] ?? sourceRow.store_area ?? null;
      const areaLabel =
        group.rows.length > 1
          ? firstBranch
            ? `${firstBranch} + ${group.rows.length - 1} more`
            : `${group.rows.length} branches`
          : firstBranch;
      return {
        id: group.rows.map((row) => row.id).join("|"),
        storeLabel:
          group.rows.length > 1 ? group.brand : sourceRow.store_name,
        areaLabel,
        branchCount: group.rows.length,
        price: sourceRow.price,
        price_delta_percent: sourceRow.price_delta_percent,
        comparison_label: sourceRow.comparison_label,
      };
    })
    .sort(
      (left, right) =>
        left.price - right.price ||
        left.storeLabel.localeCompare(right.storeLabel),
    );
}

export function getProductPriceView(product: MarketProduct) {
  const usesPreferredStore = product.preferred_store_price !== null;
  const currentPrice = usesPreferredStore
    ? product.preferred_store_price
    : product.current_price;
  const previousPrice = usesPreferredStore
    ? product.preferred_previous_price
    : product.previous_price;
  const priceDelta = usesPreferredStore
    ? product.preferred_price_delta
    : product.price_delta;
  const priceDeltaPercent = usesPreferredStore
    ? product.preferred_price_delta_percent
    : product.price_delta_percent;
  const isRising = priceDelta !== null && priceDelta > 0;
  const isDropping = priceDelta !== null && priceDelta < 0;
  const hasPreviousData =
    previousPrice !== null && currentPrice !== null;
  const distanceToPrevious = hasPreviousData
    ? currentPrice - previousPrice
    : null;
  const bestStoreName = usesPreferredStore
    ? product.preferred_store_name
    : product.best_store_name;
  const bestStoreArea = usesPreferredStore
    ? product.preferred_store_area
    : product.best_store_area;

  return {
    usesPreferredStore,
    currentPrice,
    previousPrice,
    priceDelta,
    priceDeltaPercent,
    isRising,
    isDropping,
    hasTrend: priceDelta !== null && hasPreviousData,
    bestStoreId: usesPreferredStore
      ? product.preferred_store_id
      : product.best_store_id,
    bestStoreName,
    storeLine: bestStoreName
      ? `${bestStoreName}${bestStoreArea ? ` · ${bestStoreArea}` : ""}`
      : "Store not linked yet",
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
