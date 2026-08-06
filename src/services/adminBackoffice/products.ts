import { collectPagedRows } from "../../utils/paginatedQuery";
import {
  gtinValidationMessage,
  normalizeGtin,
} from "../../utils/productIdentity";
import { hasSupabaseEnv, supabase } from "../supabaseClient";
import { extensionFromMeta, missingEnvResult, PRODUCT_IMAGE_BUCKET } from "./shared";
import type { AdminProduct, AdminUploadedImage, ProductRow, ServiceResult } from "./types";

const PRODUCT_SELECT =
  "id, korean_name, english_name, brand, gtin, category, unit, thumbnail_url, created_at";
const LEGACY_PRODUCT_SELECT =
  "id, name, english_name, brand, gtin, category, unit, thumbnail_url, created_at";

type ProductRowWithLegacyName = Omit<ProductRow, "korean_name"> & {
  korean_name?: string | null;
  name?: string | null;
};

type ProductQueryError = { message: string };

function hasKoreanNameColumnError(message: string | undefined): boolean {
  const text = message?.toLowerCase() ?? "";
  return (
    text.includes("korean_name") &&
    (text.includes("does not exist") ||
      text.includes("could not find") ||
      text.includes("schema cache"))
  );
}

function normalizeAdminProductRow(row: ProductRowWithLegacyName | null): AdminProduct {
  const safeRow = row ?? null;
  if (!safeRow) {
    return {
      id: "",
      korean_name: "",
      english_name: null,
      brand: null,
      gtin: null,
      category: "",
      unit: null,
      thumbnail_url: null,
      created_at: new Date().toISOString(),
    };
  }

  return {
    id: safeRow.id,
    korean_name: safeRow.korean_name?.trim() || safeRow.name?.trim() || "",
    english_name: safeRow.english_name ?? null,
    brand: safeRow.brand?.trim() ? safeRow.brand.trim() : null,
    gtin: safeRow.gtin?.trim() ? safeRow.gtin.trim() : null,
    category: safeRow.category,
    unit: safeRow.unit?.trim() ? safeRow.unit.trim() : null,
    thumbnail_url: safeRow.thumbnail_url,
    created_at: safeRow.created_at,
  };
}

export async function listAdminProducts(): Promise<ServiceResult<AdminProduct[]>> {
  if (!hasSupabaseEnv || !supabase) return missingEnvResult([]);
  const client = supabase;

  const fetchProducts = (selectClause: string) =>
    collectPagedRows<ProductRowWithLegacyName, ProductQueryError>(
      async (from, to) => {
        const response = await client
          .from("products")
          .select(selectClause)
          .order("created_at", { ascending: false })
          .order("id", { ascending: false })
          .range(from, to);
        return {
          data: (response.data ?? []) as unknown as ProductRowWithLegacyName[],
          error: response.error,
        };
      },
    );

  let productsRows: ProductRowWithLegacyName[] = [];
  const productsQuery = await fetchProducts(PRODUCT_SELECT);

  if (productsQuery.error) {
    if (hasKoreanNameColumnError(productsQuery.error.message)) {
      const fallbackQuery = await fetchProducts(LEGACY_PRODUCT_SELECT);
      if (fallbackQuery.error) {
        return { data: [], error: fallbackQuery.error.message };
      }
      productsRows = fallbackQuery.data;
    } else {
      return { data: [], error: productsQuery.error.message };
    }
  } else {
    productsRows = productsQuery.data;
  }

  return {
    data: productsRows.map(normalizeAdminProductRow),
    error: null,
  };
}

export async function createAdminProduct(params: {
  koreanName: string;
  englishName?: string;
  brand?: string;
  gtin?: string;
  category: string;
  unit?: string;
  thumbnailUrl?: string;
}): Promise<ServiceResult<AdminProduct | null>> {
  if (!hasSupabaseEnv || !supabase) return missingEnvResult(null);
  const gtinError = gtinValidationMessage(params.gtin);
  if (gtinError) return { data: null, error: gtinError };

  const withIdentityPayload = {
    korean_name: params.koreanName.trim(),
    english_name: params.englishName?.trim() ? params.englishName.trim() : null,
    brand: params.brand?.trim() ? params.brand.trim() : null,
    gtin: normalizeGtin(params.gtin) || null,
    category: params.category.trim(),
    unit: params.unit?.trim() ? params.unit.trim() : null,
    thumbnail_url: params.thumbnailUrl?.trim() ? params.thumbnailUrl.trim() : null,
  };
  const legacyPayload = {
    ...withIdentityPayload,
    name: withIdentityPayload.korean_name,
  };
  delete (legacyPayload as { korean_name?: string }).korean_name;

  const insertedWithIdentity = await supabase
    .from("products")
    .insert(withIdentityPayload)
    .select(PRODUCT_SELECT)
    .single();

  if (insertedWithIdentity.error) {
    if (hasKoreanNameColumnError(insertedWithIdentity.error.message)) {
      const fallbackInsert = await supabase
        .from("products")
        .insert(legacyPayload)
        .select(LEGACY_PRODUCT_SELECT)
        .single();
      if (fallbackInsert.error) {
        return { data: null, error: fallbackInsert.error.message };
      }
      if (!fallbackInsert.data) {
        return { data: null, error: "Product insert returned no data." };
      }
      return {
        data: normalizeAdminProductRow(fallbackInsert.data as ProductRowWithLegacyName),
        error: null,
      };
    }
    return { data: null, error: insertedWithIdentity.error.message };
  }

  return {
    data: insertedWithIdentity.data
      ? normalizeAdminProductRow(insertedWithIdentity.data as ProductRowWithLegacyName)
      : null,
    error: null,
  };
}

export async function updateAdminProduct(params: {
  id: string;
  koreanName: string;
  englishName?: string;
  brand?: string;
  gtin?: string;
  category: string;
  unit?: string;
  thumbnailUrl?: string;
}): Promise<ServiceResult<AdminProduct | null>> {
  if (!hasSupabaseEnv || !supabase) return missingEnvResult(null);

  const id = params.id.trim();
  if (!id) return { data: null, error: "Product ID is required." };
  const gtinError = gtinValidationMessage(params.gtin);
  if (gtinError) return { data: null, error: gtinError };

  const withIdentityPayload = {
    korean_name: params.koreanName.trim(),
    english_name: params.englishName?.trim() ? params.englishName.trim() : null,
    category: params.category.trim(),
    unit: params.unit?.trim() ? params.unit.trim() : null,
    thumbnail_url: params.thumbnailUrl?.trim() ? params.thumbnailUrl.trim() : null,
    ...(params.brand === undefined
      ? {}
      : { brand: params.brand.trim() || null }),
    ...(params.gtin === undefined
      ? {}
      : { gtin: normalizeGtin(params.gtin) || null }),
  };
  const legacyPayload = {
    ...withIdentityPayload,
    name: withIdentityPayload.korean_name,
  };
  delete (legacyPayload as { korean_name?: string }).korean_name;

  const updatedWithIdentity = await supabase
    .from("products")
    .update(withIdentityPayload)
    .eq("id", id)
    .select(PRODUCT_SELECT)
    .single();

  if (updatedWithIdentity.error) {
    if (hasKoreanNameColumnError(updatedWithIdentity.error.message)) {
      const fallbackUpdate = await supabase
        .from("products")
        .update(legacyPayload)
        .eq("id", id)
        .select(LEGACY_PRODUCT_SELECT)
        .single();
      if (fallbackUpdate.error) {
        return { data: null, error: fallbackUpdate.error.message };
      }
      if (!fallbackUpdate.data) {
        return { data: null, error: "Product update returned no data." };
      }
      return {
        data: normalizeAdminProductRow(fallbackUpdate.data as ProductRowWithLegacyName),
        error: null,
      };
    }
    return { data: null, error: updatedWithIdentity.error.message };
  }

  return {
    data: updatedWithIdentity.data
      ? normalizeAdminProductRow(updatedWithIdentity.data as ProductRowWithLegacyName)
      : null,
    error: null,
  };
}

export async function uploadAdminProductImage(params: {
  file: Blob;
  fileName?: string;
  contentType?: string;
}): Promise<ServiceResult<AdminUploadedImage | null>> {
  if (!hasSupabaseEnv || !supabase) return missingEnvResult(null);

  const fileSize = typeof params.file.size === "number" ? params.file.size : 0;
  const tenMb = 10 * 1024 * 1024;
  if (fileSize > tenMb) return { data: null, error: "Image must be 10MB or smaller." };

  const ext = extensionFromMeta(params.fileName, params.contentType);
  const objectPath = `products/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
  const contentType = params.contentType?.trim() || undefined;

  const { error } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).upload(objectPath, params.file, {
    cacheControl: "3600",
    upsert: false,
    contentType,
  });

  if (error) {
    const text = error.message.toLowerCase();
    if (text.includes("bucket")) {
      return {
        data: null,
        error: `Storage bucket '${PRODUCT_IMAGE_BUCKET}' is missing. Apply database/schema.sql first.`,
      };
    }
    return { data: null, error: error.message };
  }

  const { data } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(objectPath);
  return {
    data: { bucket: PRODUCT_IMAGE_BUCKET, path: objectPath, publicUrl: data.publicUrl },
    error: null,
  };
}

export async function deleteAdminProduct(productId: string): Promise<ServiceResult<null>> {
  if (!hasSupabaseEnv || !supabase) return missingEnvResult(null);

  const { error } = await supabase.from("products").delete().eq("id", productId);
  return { data: null, error: error ? error.message : null };
}
