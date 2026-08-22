import { collectPagedRows } from "../../utils/paginatedQuery";
import { canonicalProductCategory, productCategoryQueryValues } from "../../utils/productCategory";
import { hasSupabaseEnv, supabase } from "../supabaseClient";
import { FALLBACK_PRODUCTS } from "./fallbacks";
import { listProductPriceSummaries } from "./prices";
import { matchesProductFilter } from "./shared";
import type { MarketProduct, ProductRow, ServiceResult } from "./types";

const PRODUCT_SELECT = "id, korean_name, english_name, category, unit, thumbnail_url";
const PRODUCT_CACHE_TTL_MS = 60_000;
const CATEGORY_CACHE_TTL_MS = 10 * 60_000;

type ProductQueryError = { message: string };
type ProductListParams = {
  search?: string;
  category?: string;
  productIds?: string[];
  preferredStoreIds?: string[];
  onSaleOnly?: boolean;
  includePriceSummaries?: boolean;
};

const productResultCache = new Map<
  string,
  { expiresAt: number; result: ServiceResult<MarketProduct[]> }
>();
const productRequestCache = new Map<string, Promise<ServiceResult<MarketProduct[]>>>();
let categoryResultCache: { expiresAt: number; result: ServiceResult<string[]> } | null = null;

function normalizeProductSearch(value?: string): string {
  return (value ?? "")
    .trim()
    .replace(/[^\p{L}\p{N}\s.-]/gu, " ")
    .replace(/\s+/g, " ")
    .slice(0, 80);
}

function productCacheKey(params?: ProductListParams): string {
  return JSON.stringify({
    search: normalizeProductSearch(params?.search),
    category: canonicalProductCategory(params?.category ?? ""),
    productIds: [...new Set(params?.productIds ?? [])].sort(),
    preferredStoreIds: [...new Set(params?.preferredStoreIds ?? [])].sort(),
    onSaleOnly: params?.onSaleOnly ?? true,
    includePriceSummaries: params?.includePriceSummaries ?? true,
  });
}

function normalizeProductRow(row: ProductRow): MarketProduct {
  const koreanName = row.korean_name.trim();
  return {
    id: row.id,
    korean_name: koreanName,
    english_name: row.english_name ?? null,
    category: canonicalProductCategory(row.category),
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

async function loadProducts(params?: ProductListParams): Promise<ServiceResult<MarketProduct[]>> {
  if (!hasSupabaseEnv || !supabase) {
    return {
      data: FALLBACK_PRODUCTS.map((product) => ({
        ...product,
        category: canonicalProductCategory(product.category),
      })).filter((product) => matchesProductFilter(product, params?.search, params?.category)),
      error: null,
    };
  }

  const client = supabase;
  const search = normalizeProductSearch(params?.search);
  const productIds = [...new Set((params?.productIds ?? []).map((id) => id.trim()).filter(Boolean))];
  if (params?.productIds && productIds.length === 0) return { data: [], error: null };
  const productsQuery = await collectPagedRows<ProductRow, ProductQueryError>(async (from, to) => {
    let query = client.from("products").select(PRODUCT_SELECT);
    const categoryValues = productCategoryQueryValues(params?.category ?? "");
    if (categoryValues.length === 1) {
      query = query.eq("category", categoryValues[0]);
    } else if (categoryValues.length > 1) {
      query = query.in("category", categoryValues);
    }
    if (productIds.length > 0) query = query.in("id", productIds);
    if (search) {
      query = query.or(
        `korean_name.ilike.%${search}%,english_name.ilike.%${search}%,category.ilike.%${search}%`,
      );
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

  const includePriceSummaries = params?.includePriceSummaries ?? true;
  const [priceSummaries, preferredPriceSummaries] = includePriceSummaries
    ? await Promise.all([
      listProductPriceSummaries(),
      params?.preferredStoreIds?.length
        ? listProductPriceSummaries(params.preferredStoreIds)
        : Promise.resolve({ data: new Map(), error: null }),
    ])
    : [
      { data: new Map(), error: null },
      { data: new Map(), error: null },
    ];

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

export async function listProducts(
  params?: ProductListParams,
): Promise<ServiceResult<MarketProduct[]>> {
  const key = productCacheKey(params);
  const cached = productResultCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.result;
  const pending = productRequestCache.get(key);
  if (pending) return pending;

  const request = loadProducts(params)
    .then((result) => {
      if (!result.error) {
        productResultCache.set(key, {
          expiresAt: Date.now() + PRODUCT_CACHE_TTL_MS,
          result,
        });
      }
      return result;
    })
    .finally(() => productRequestCache.delete(key));
  productRequestCache.set(key, request);
  return request;
}

export async function listProductCategories(): Promise<ServiceResult<string[]>> {
  if (!hasSupabaseEnv || !supabase) {
    return {
      data: [
        ...new Set(FALLBACK_PRODUCTS.map((item) => canonicalProductCategory(item.category))),
      ].sort((a, b) => a.localeCompare(b)),
      error: null,
    };
  }

  if (categoryResultCache && categoryResultCache.expiresAt > Date.now()) {
    return categoryResultCache.result;
  }

  const client = supabase;
  let categoriesQuery = await collectPagedRows<{ category: string }, ProductQueryError>(
    async (from, to) => {
      const response = await client.rpc("list_product_categories").range(from, to);
      return {
        data: ((response.data ?? []) as unknown) as { category: string }[],
        error: response.error,
      };
    },
  );
  const rpcErrorText = categoriesQuery.error?.message.toLowerCase() ?? "";
  const isMissingRpc =
    rpcErrorText.includes("list_product_categories") &&
    (rpcErrorText.includes("does not exist") ||
      rpcErrorText.includes("could not find") ||
      rpcErrorText.includes("schema cache") ||
      rpcErrorText.includes("pgrst202"));
  if (isMissingRpc) {
    categoriesQuery = await collectPagedRows<{ category: string }, ProductQueryError>(
    async (from, to) => {
      const response = await client
        .from("products")
        .select("category")
        .order("category", { ascending: true })
        .range(from, to);
      return {
        data: (response.data ?? []) as { category: string }[],
        error: response.error,
      };
    },
    );
  }

  const categories = [
    ...new Set(
      categoriesQuery.data.map((item) => canonicalProductCategory(item.category)).filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b));

  const result = {
    data: categories,
    error: categoriesQuery.error?.message ?? null,
  };
  if (!result.error) {
    categoryResultCache = {
      expiresAt: Date.now() + CATEGORY_CACHE_TTL_MS,
      result,
    };
  }
  return result;
}
