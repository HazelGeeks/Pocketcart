import {
  type FoodScanPricePoint,
  type FoodScanProductCandidate,
  formatFoodScanSalePeriod,
  matchFoodScanProduct,
  summarizeFoodScanSales,
} from "../utils/foodScanProductMatch";
import { isValidGtin, normalizeGtin } from "../utils/productIdentity";
import type { FoodScanResult } from "./foodScan";
import { FALLBACK_PRODUCTS } from "./marketData/fallbacks";
import { listProductPriceHistory } from "./marketData/priceHistory";
import type { MarketProduct, ServiceResult } from "./marketData/types";
import { hasSupabaseEnv, supabase } from "./supabaseClient";

const PRODUCT_SELECT = "id, korean_name, english_name, category, unit, brand, gtin, thumbnail_url";

export type FoodScanProductLink = {
  product: MarketProduct;
  matchMethod: "gtin" | "name";
  currentSale: FoodScanPricePoint | null;
  previousSale: FoodScanPricePoint | null;
};

function fallbackCandidates(): FoodScanProductCandidate[] {
  return FALLBACK_PRODUCTS.map((product) => ({
    id: product.id,
    korean_name: product.korean_name,
    english_name: product.english_name,
    category: product.category,
    unit: product.unit,
    brand: null,
    gtin: null,
    thumbnail_url: product.thumbnail_url,
  }));
}

async function findCandidates(
  barcode: string | null,
  productName: string,
): Promise<ServiceResult<FoodScanProductCandidate[]>> {
  if (!hasSupabaseEnv || !supabase) return { data: fallbackCandidates(), error: null };

  if (isValidGtin(barcode)) {
    const response = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("gtin", normalizeGtin(barcode))
      .limit(2);
    return {
      data: (response.data ?? []) as FoodScanProductCandidate[],
      error: response.error?.message ?? null,
    };
  }

  const name = productName.trim();
  if (!name) return { data: [], error: null };
  const [english, korean] = await Promise.all([
    supabase.from("products").select(PRODUCT_SELECT).ilike("english_name", name).limit(2),
    supabase.from("products").select(PRODUCT_SELECT).ilike("korean_name", name).limit(2),
  ]);
  const unique = new Map<string, FoodScanProductCandidate>();
  for (const row of [...(english.data ?? []), ...(korean.data ?? [])]) {
    const candidate = row as FoodScanProductCandidate;
    unique.set(candidate.id, candidate);
  }
  return {
    data: [...unique.values()],
    error: english.error?.message ?? korean.error?.message ?? null,
  };
}

function percentDelta(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null || previous === 0) return null;
  return Math.round(((current - previous) / previous) * 10_000) / 100;
}

function toMarketProduct(
  candidate: FoodScanProductCandidate,
  current: FoodScanPricePoint | null,
  previous: FoodScanPricePoint | null,
): MarketProduct {
  const currentPrice = current?.price ?? null;
  const previousPrice = previous?.price ?? null;
  const currentPeriod = current ? formatFoodScanSalePeriod(current) : null;
  const previousPeriod = previous ? formatFoodScanSalePeriod(previous) : null;
  return {
    id: candidate.id,
    korean_name: candidate.korean_name,
    english_name: candidate.english_name,
    category: candidate.category,
    unit: candidate.unit,
    thumbnail_url: candidate.thumbnail_url,
    current_price: currentPrice,
    previous_price: previousPrice,
    price_delta:
      currentPrice !== null && previousPrice !== null ? currentPrice - previousPrice : null,
    price_delta_percent: percentDelta(currentPrice, previousPrice),
    price_compare_label:
      currentPeriod && previousPeriod
        ? `Current sale ${currentPeriod} vs last sale ${previousPeriod}`
        : currentPeriod
          ? `Current sale ${currentPeriod}`
          : previousPeriod
            ? `Last tracked sale ${previousPeriod}`
            : "No tracked sale price yet",
    price_compare_current_batch: currentPeriod,
    price_compare_previous_batch: previousPeriod,
    best_store_id: current?.store_id ?? null,
    best_store_name: current?.store_name ?? null,
    best_store_area: current?.store_area ?? null,
    best_store_price: currentPrice,
    preferred_store_id: null,
    preferred_store_name: null,
    preferred_store_area: null,
    preferred_store_price: null,
    preferred_previous_price: null,
    preferred_price_delta: null,
    preferred_price_delta_percent: null,
    preferred_price_compare_current_batch: null,
  };
}

export async function findFoodScanProductLink(params: {
  barcode: string | null;
  result: FoodScanResult;
}): Promise<ServiceResult<FoodScanProductLink | null>> {
  const candidates = await findCandidates(params.barcode, params.result.productName);
  if (candidates.error) return { data: null, error: candidates.error };
  const match = matchFoodScanProduct(candidates.data, {
    barcode: params.barcode,
    confidence: params.result.confidence,
    productName: params.result.productName,
    requiresConfirmation: params.result.requiresConfirmation,
  });
  if (!match) return { data: null, error: null };

  const history = await listProductPriceHistory(match.product.id);
  const summary = summarizeFoodScanSales(history.data);
  return {
    data: {
      product: toMarketProduct(match.product, summary.current, summary.previous),
      matchMethod: match.method,
      currentSale: summary.current,
      previousSale: summary.previous,
    },
    error: history.error,
  };
}
