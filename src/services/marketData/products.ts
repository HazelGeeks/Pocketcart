import { hasSupabaseEnv, supabase } from "../supabaseClient";
import { FALLBACK_PRODUCTS } from "./fallbacks";
import { listProductPriceSummaries } from "./prices";
import { matchesProductFilter } from "./shared";
import type { MarketProduct, ProductRow, ServiceResult } from "./types";
import { collectPagedRows } from "../../utils/paginatedQuery";

const PRODUCT_SELECT = "id, korean_name, english_name, category, unit, thumbnail_url";

type ProductQueryError = { message: string };

function normalizeProductRow(row: ProductRow): MarketProduct {
  const koreanName = row.korean_name.trim();
  return {
    id: row.id,
    korean_name: koreanName,
    english_name: row.english_name ?? null,
    category: row.category,
    unit: row.unit?.trim() ? row.unit.trim() : inferUnitFromName(row.english_name || koreanName),
    thumbnail_url: row.thumbnail_url,
    current_price: null,
    previous_price: null,
    price_delta: null,
    price_delta_percent: null,
    price_compare_label: "First tracked sale price",
    price_compare_current_batch: null,
    price_compare_previous_batch: null,
    best_store_id: null,
    best_store_name: null,
    best_store_area: null,
    best_store_price: null,
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

function inferUnitFromName(name: string): string | null {
  const directMatch = name.match(/(\d+(?:\.\d+)?\s?(?:kg|g|lb|oz|ml|l|lt|cl|pack|pcs?|ea|개)\b)/i);
  if (directMatch) {
    return directMatch[1].replace(/\s+/g, " ").trim().toLowerCase();
  }

  const unitHintMatch = name.match(/([A-Za-z가-힣]+)\s*[xX]\s*(\d+)/);
  if (unitHintMatch) {
    return `${unitHintMatch[1]} x ${unitHintMatch[2]}`.trim();
  }

  return null;
}

export async function listProducts(params?: {
  search?: string;
  category?: string;
  preferredStoreIds?: string[];
  onSaleOnly?: boolean;
}): Promise<ServiceResult<MarketProduct[]>> {
  if (!hasSupabaseEnv || !supabase) {
    return {
      data: FALLBACK_PRODUCTS.filter((product) =>
        matchesProductFilter(product, params?.search, params?.category),
      ),
      error: null,
    };
  }

  const client = supabase;
  const productsQuery = await collectPagedRows<ProductRow, ProductQueryError>(async (from, to) => {
    let query = client.from("products").select(PRODUCT_SELECT);
    if (params?.category?.trim()) {
      query = query.eq("category", params.category.trim());
    }
    const response = await query
      .order("english_name", { ascending: true, nullsFirst: false })
      .order("id", { ascending: true })
      .range(from, to);
    return {
      data: (response.data ?? []) as unknown as ProductRow[],
      error: response.error,
    };
  });

  if (productsQuery.error) {
    return {
      data: [],
      error: productsQuery.error.message,
    };
  }

  const [priceSummaries, preferredPriceSummaries] = await Promise.all([
    listProductPriceSummaries(),
    params?.preferredStoreIds?.length
      ? listProductPriceSummaries(params.preferredStoreIds)
      : Promise.resolve({ data: new Map(), error: null }),
  ]);

  const onSaleOnly = params?.onSaleOnly ?? true;
  const products: MarketProduct[] = productsQuery.data
    .map((row) => {
      const summary = priceSummaries.data.get(row.id);
      const preferredSummary = preferredPriceSummaries.data.get(row.id);
      const base = normalizeProductRow(row);
      return {
        ...base,
        current_price: summary?.current_price ?? null,
        previous_price: summary?.previous_price ?? null,
        price_delta: summary?.price_delta ?? null,
        price_delta_percent: summary?.price_delta_percent ?? null,
        price_compare_label: summary?.price_compare_label ?? "First tracked sale price",
        price_compare_current_batch: summary?.price_compare_current_batch ?? null,
        price_compare_previous_batch: summary?.price_compare_previous_batch ?? null,
        best_store_id: summary?.best_store_id ?? null,
        best_store_name: summary?.best_store_name ?? null,
        best_store_area: summary?.best_store_area ?? null,
        best_store_price: summary?.best_store_price ?? null,
        preferred_store_id: preferredSummary?.best_store_id ?? null,
        preferred_store_name: preferredSummary?.best_store_name ?? null,
        preferred_store_area: preferredSummary?.best_store_area ?? null,
        preferred_store_price: preferredSummary?.best_store_price ?? null,
        preferred_previous_price: preferredSummary?.previous_price ?? null,
        preferred_price_delta: preferredSummary?.price_delta ?? null,
        preferred_price_delta_percent: preferredSummary?.price_delta_percent ?? null,
        preferred_price_compare_current_batch:
          preferredSummary?.price_compare_current_batch ?? null,
      };
    })
    .filter(
      (product) =>
        (!onSaleOnly || priceSummaries.data.has(product.id)) &&
        matchesProductFilter(product, params?.search, params?.category),
    );

  return {
    data: products,
    error: priceSummaries.error ?? preferredPriceSummaries.error,
  };
}

export async function listProductCategories(): Promise<ServiceResult<string[]>> {
  const { data, error } = await listProducts({ onSaleOnly: false });
  const categories = [...new Set(data.map((item) => item.category).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );

  return {
    data: categories,
    error,
  };
}
