import { hasSupabaseEnv, supabase } from "../supabaseClient";
import { FALLBACK_PRICE_HISTORY } from "./fallbacks";
import { missingEnvResult, parseNumber } from "./shared";
import type { MarketPricePoint, PriceRow, ServiceResult } from "./types";

export async function listProductPriceHistory(
  productId: string,
): Promise<ServiceResult<MarketPricePoint[]>> {
  if (!productId.trim()) {
    return { data: [], error: "Product id is required." };
  }

  if (!hasSupabaseEnv || !supabase) {
    const values = FALLBACK_PRICE_HISTORY[productId] ?? [];
    const today = new Date();
    const points: MarketPricePoint[] = values.map((value, index) => {
      const day = new Date(today);
      day.setDate(today.getDate() - (values.length - 1 - index));
      return {
        id: `${productId}-${index}`,
        product_id: productId,
        price: value,
        observed_at: day.toISOString(),
      };
    });

    return { data: points, error: null };
  }

  const { data, error } = await supabase
    .from("product_prices")
    .select("id, product_id, price, observed_at")
    .eq("product_id", productId)
    .order("observed_at", { ascending: true })
    .limit(60);

  if (error) {
    return { data: [], error: error.message };
  }

  const points = ((data ?? []) as PriceRow[])
    .map((row) => {
      const parsedPrice = parseNumber(row.price);
      if (parsedPrice === null) return null;
      return {
        id: row.id,
        product_id: row.product_id,
        price: parsedPrice,
        observed_at: row.observed_at,
      };
    })
    .filter((row): row is MarketPricePoint => row !== null);

  return {
    data: points,
    error: null,
  };
}

export async function listLatestPricesByProduct(): Promise<ServiceResult<Map<string, number>>> {
  if (!hasSupabaseEnv || !supabase) {
    return { data: new Map(), error: null };
  }

  const latestPriceQuery = await supabase
    .from("product_prices")
    .select("id, product_id, price, observed_at")
    .order("observed_at", { ascending: false })
    .limit(3000);

  const latestByProduct = new Map<string, number>();
  if (!latestPriceQuery.error) {
    const priceRows = (latestPriceQuery.data ?? []) as PriceRow[];
    for (const row of priceRows) {
      if (latestByProduct.has(row.product_id)) continue;
      const parsedPrice = parseNumber(row.price);
      if (parsedPrice === null) continue;
      latestByProduct.set(row.product_id, parsedPrice);
    }
  }

  return {
    data: latestByProduct,
    error: latestPriceQuery.error ? latestPriceQuery.error.message : null,
  };
}

export async function createProductPrice(params: {
  productId: string;
  storeId: string;
  price: string;
  observedAt: string;
}): Promise<ServiceResult<MarketPricePoint | null>> {
  if (!hasSupabaseEnv || !supabase) return missingEnvResult(null);

  if (!params.productId.trim() || !params.storeId.trim()) {
    return { data: null, error: "Product ID and Store ID are required." };
  }

  const price = parseNumber(params.price);
  if (price === null) {
    return { data: null, error: "Price must be a valid number." };
  }

  let observedAt = new Date().toISOString();
  const observedAtInput = params.observedAt?.trim();
  if (observedAtInput) {
    const parsed = new Date(observedAtInput);
    if (Number.isNaN(parsed.getTime())) {
      return { data: null, error: "Observed date must be a valid date string." };
    }
    observedAt = parsed.toISOString();
  }

  const payload = {
    product_id: params.productId.trim(),
    store_id: params.storeId.trim(),
    price,
    observed_at: observedAt,
  };

  const { data, error } = await supabase
    .from("product_prices")
    .insert(payload)
    .select("id, product_id, price, observed_at")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  const row = data as PriceRow;
  return {
    data: {
      id: row.id,
      product_id: row.product_id,
      price: parseNumber(row.price) ?? price,
      observed_at: row.observed_at,
    },
    error: null,
  };
}
