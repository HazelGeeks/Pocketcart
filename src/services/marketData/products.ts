import { hasSupabaseEnv, supabase } from "../supabaseClient";
import { FALLBACK_PRODUCTS } from "./fallbacks";
import { listProductPriceSummaries } from "./prices";
import { matchesProductFilter, missingEnvResult } from "./shared";
import type { MarketProduct, ProductRow, ServiceResult } from "./types";

const PRODUCT_SELECT_WITH_ENGLISH = "id, name, english_name, category, unit, thumbnail_url";
const PRODUCT_SELECT_WITHOUT_ENGLISH = "id, name, category, unit, thumbnail_url";

type ProductRowWithOptionalEnglish = Omit<ProductRow, "english_name"> & {
  english_name?: string | null;
};

function hasEnglishNameColumnError(message: string | undefined): boolean {
  const text = message?.toLowerCase() ?? "";
  return (
    text.includes("english_name") &&
    (text.includes("does not exist") ||
      text.includes("could not find") ||
      text.includes("schema cache"))
  );
}

function normalizeProductRow(row: ProductRowWithOptionalEnglish): MarketProduct {
  return {
    id: row.id,
    name: row.name,
    english_name: row.english_name ?? null,
    category: row.category,
    unit: row.unit?.trim() ? row.unit.trim() : inferUnitFromName(row.name),
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
  };
}

function inferUnitFromName(name: string): string | null {
  const directMatch = name.match(
    /(\d+(?:\.\d+)?\s?(?:kg|g|lb|oz|ml|l|lt|cl|pack|pcs?|ea|개)\b)/i,
  );
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
}): Promise<ServiceResult<MarketProduct[]>> {
  if (!hasSupabaseEnv || !supabase) {
    return {
      data: FALLBACK_PRODUCTS.filter((product) =>
        matchesProductFilter(product, params?.search, params?.category),
      ),
      error: null,
    };
  }

  let productsRows: ProductRowWithOptionalEnglish[] = [];
  const productsQuery = await supabase
    .from("products")
    .select(PRODUCT_SELECT_WITH_ENGLISH)
    .order("name", { ascending: true });

  if (productsQuery.error) {
    if (hasEnglishNameColumnError(productsQuery.error.message)) {
      const fallbackQuery = await supabase
        .from("products")
        .select(PRODUCT_SELECT_WITHOUT_ENGLISH)
        .order("name", { ascending: true });
      if (fallbackQuery.error) {
        return {
          data: [],
          error: fallbackQuery.error.message,
        };
      }
      productsRows = (fallbackQuery.data ?? []) as ProductRowWithOptionalEnglish[];
    } else {
      return {
        data: [],
        error: productsQuery.error.message,
      };
    }
  } else {
    productsRows = (productsQuery.data ?? []) as ProductRowWithOptionalEnglish[];
  }

  const priceSummaries = await listProductPriceSummaries();

  const products: MarketProduct[] = productsRows
    .map((row) => {
      const summary = priceSummaries.data.get(row.id);
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
      };
    })
    .filter((product) =>
      priceSummaries.data.has(product.id) &&
      matchesProductFilter(product, params?.search, params?.category),
    );

  return {
    data: products,
    error: priceSummaries.error,
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
  englishName?: string;
  category: string;
  thumbnailUrl?: string;
}): Promise<ServiceResult<MarketProduct | null>> {
  if (!hasSupabaseEnv || !supabase) return missingEnvResult(null);

  const withEnglishPayload = {
    name: params.name.trim(),
    english_name: params.englishName?.trim() ? params.englishName.trim() : null,
    category: params.category.trim(),
    thumbnail_url: params.thumbnailUrl?.trim() ? params.thumbnailUrl.trim() : null,
  };
  const withoutEnglishPayload = {
    name: withEnglishPayload.name,
    category: withEnglishPayload.category,
    thumbnail_url: withEnglishPayload.thumbnail_url,
  };

  const insertedWithEnglish = await supabase
    .from("products")
    .insert(withEnglishPayload)
    .select(PRODUCT_SELECT_WITH_ENGLISH)
    .single();

  let row: ProductRowWithOptionalEnglish | null = null;
  if (insertedWithEnglish.error) {
    if (hasEnglishNameColumnError(insertedWithEnglish.error.message)) {
      const fallbackInsert = await supabase
        .from("products")
        .insert(withoutEnglishPayload)
        .select(PRODUCT_SELECT_WITHOUT_ENGLISH)
        .single();
      if (fallbackInsert.error) {
        return { data: null, error: fallbackInsert.error.message };
      }
      row = fallbackInsert.data as ProductRowWithOptionalEnglish | null;
    } else {
      return { data: null, error: insertedWithEnglish.error.message };
    }
  } else {
    row = insertedWithEnglish.data as ProductRowWithOptionalEnglish | null;
  }

  if (!row) {
    return { data: null, error: "Product insert returned no data." };
  }

  const base = normalizeProductRow(row);
  return {
    data: {
      ...base,
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
    },
    error: null,
  };
}
