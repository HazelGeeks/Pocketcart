import { hasSupabaseEnv, supabase } from "../supabaseClient";
import { FALLBACK_PRODUCTS } from "./fallbacks";
import { listLatestPricesByProduct } from "./prices";
import { matchesProductFilter, missingEnvResult } from "./shared";
import type { MarketProduct, ProductRow, ServiceResult } from "./types";

export async function listProducts(params?: {
  search?: string;
  category?: string;
}): Promise<ServiceResult<MarketProduct[]>> {
  if (!hasSupabaseEnv || !supabase) {
    return {
      data: FALLBACK_PRODUCTS.filter((product) =>
        matchesProductFilter(product, params?.search, params?.category),
      ),
      error: null,
    };
  }

  const productsQuery = await supabase
    .from("products")
    .select("id, name, category, thumbnail_url")
    .order("name", { ascending: true });

  if (productsQuery.error) {
    return {
      data: [],
      error: productsQuery.error.message,
    };
  }

  const rows = (productsQuery.data ?? []) as ProductRow[];
  const latestPrices = await listLatestPricesByProduct();

  const products: MarketProduct[] = rows
    .map((row) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      thumbnail_url: row.thumbnail_url,
      current_price: latestPrices.data.get(row.id) ?? null,
    }))
    .filter((product) =>
      matchesProductFilter(product, params?.search, params?.category),
    );

  return {
    data: products,
    error: latestPrices.error,
  };
}

export async function listProductCategories(): Promise<ServiceResult<string[]>> {
  const { data, error } = await listProducts();
  const categories = [...new Set(data.map((item) => item.category).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));

  return {
    data: categories,
    error,
  };
}

export async function createProduct(params: {
  name: string;
  category: string;
  thumbnailUrl?: string;
}): Promise<ServiceResult<MarketProduct | null>> {
  if (!hasSupabaseEnv || !supabase) return missingEnvResult(null);

  const payload = {
    name: params.name.trim(),
    category: params.category.trim(),
    thumbnail_url: params.thumbnailUrl?.trim() ? params.thumbnailUrl.trim() : null,
  };

  const { data, error } = await supabase
    .from("products")
    .insert(payload)
    .select("id, name, category, thumbnail_url")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  const row = data as ProductRow;
  return {
    data: {
      id: row.id,
      name: row.name,
      category: row.category,
      thumbnail_url: row.thumbnail_url,
      current_price: null,
    },
    error: null,
  };
}
