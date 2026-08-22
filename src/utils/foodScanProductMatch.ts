import { BUSINESS_TIME_ZONE } from "./businessDateTime";
import { isValidGtin, normalizeGtin } from "./productIdentity";

export type FoodScanProductCandidate = {
  id: string;
  korean_name: string;
  english_name: string | null;
  category: string;
  unit: string | null;
  brand: string | null;
  gtin: string | null;
  thumbnail_url: string | null;
};

export type FoodScanPricePoint = {
  price: number;
  observed_at: string;
  sale_end_at: string | null;
  store_id: string | null;
  store_name: string;
  store_area: string | null;
};

export type FoodScanSaleSummary = {
  current: FoodScanPricePoint | null;
  previous: FoodScanPricePoint | null;
};

function normalizedName(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFKC")
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "")
    .toLocaleLowerCase("en-US");
}

export function matchFoodScanProduct(
  products: FoodScanProductCandidate[],
  input: {
    barcode?: string | null;
    confidence: number;
    productName: string;
    requiresConfirmation: boolean;
  },
): { product: FoodScanProductCandidate; method: "gtin" | "name" } | null {
  if (isValidGtin(input.barcode)) {
    const gtin = normalizeGtin(input.barcode);
    const matches = products.filter(
      (product) => isValidGtin(product.gtin) && normalizeGtin(product.gtin) === gtin,
    );
    return matches.length === 1 ? { product: matches[0], method: "gtin" } : null;
  }

  if (input.requiresConfirmation || input.confidence < 85) return null;
  const scanName = normalizedName(input.productName);
  if (!scanName) return null;
  const matches = products.filter((product) =>
    [product.english_name, product.korean_name]
      .map(normalizedName)
      .some((name) => name === scanName),
  );
  return matches.length === 1 ? { product: matches[0], method: "name" } : null;
}

function time(value: string | null): number {
  if (!value) return Number.NaN;
  return new Date(value).getTime();
}

export function summarizeFoodScanSales(
  history: FoodScanPricePoint[],
  nowMs = Date.now(),
): FoodScanSaleSummary {
  const ordered = [...history]
    .filter((point) => Number.isFinite(point.price) && point.price >= 0)
    .sort((left, right) => time(left.observed_at) - time(right.observed_at));
  const current =
    [...ordered].reverse().find((point) => {
      const startsAt = time(point.observed_at);
      const endsAt = point.sale_end_at ? time(point.sale_end_at) : Number.POSITIVE_INFINITY;
      return Number.isFinite(startsAt) && startsAt <= nowMs && endsAt >= nowMs;
    }) ?? null;
  const previous = current
    ? ([...ordered]
        .reverse()
        .find((point) => time(point.observed_at) < time(current.observed_at)) ?? null)
    : (ordered.at(-1) ?? null);
  return { current, previous };
}

function shortDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    timeZone: BUSINESS_TIME_ZONE,
  });
}

export function formatFoodScanSalePeriod(point: FoodScanPricePoint): string {
  const start = shortDate(point.observed_at);
  if (!point.sale_end_at) return start;
  const end = shortDate(point.sale_end_at);
  return start === end ? start : `${start}–${end}`;
}
