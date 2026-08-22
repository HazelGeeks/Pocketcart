import { collectPagedRows } from "../../utils/paginatedQuery";
import { canonicalProductCategory } from "../../utils/productCategory";
import {
  gtinValidationMessage,
  normalizeGtin,
} from "../../utils/productIdentity";
import { hasSupabaseEnv, supabase } from "../supabaseClient";
import { extensionFromMeta, missingEnvResult, PRODUCT_IMAGE_BUCKET } from "./shared";
import type { AdminProduct, AdminUploadedImage, ProductRow, ServiceResult } from "./types";

const PRODUCT_SELECT =
  "id, korean_name, english_name, brand, gtin, category, unit, thumbnail_url, created_at";

type ProductQueryError = { message: string };

function normalizeAdminProductRow(row: ProductRow | null): AdminProduct {
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
    korean_name: safeRow.korean_name.trim(),
    english_name: safeRow.english_name ?? null,
    brand: safeRow.brand?.trim() ? safeRow.brand.trim() : null,
    gtin: safeRow.gtin?.trim() ? safeRow.gtin.trim() : null,
    category: canonicalProductCategory(safeRow.category),
    unit: safeRow.unit?.trim() ? safeRow.unit.trim() : null,
    thumbnail_url: safeRow.thumbnail_url,
    created_at: safeRow.created_at,
  };
}

export async function listAdminProducts(): Promise<ServiceResult<AdminProduct[]>> {
  if (!hasSupabaseEnv || !supabase) return missingEnvResult([]);
  const client = supabase;

  const productsQuery = await collectPagedRows<ProductRow, ProductQueryError>(
    async (from, to) => {
      const response = await client
        .from("products")
        .select(PRODUCT_SELECT)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(from, to);
      return {
        data: (response.data ?? []) as unknown as ProductRow[],
        error: response.error,
      };
    },
  );

  if (productsQuery.error) {
    return { data: [], error: productsQuery.error.message };
  }

  return {
    data: productsQuery.data.map(normalizeAdminProductRow),
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

  const payload = {
    korean_name: params.koreanName.trim(),
    english_name: params.englishName?.trim() ? params.englishName.trim() : null,
    brand: params.brand?.trim() ? params.brand.trim() : null,
    gtin: normalizeGtin(params.gtin) || null,
    category: canonicalProductCategory(params.category),
    unit: params.unit?.trim() ? params.unit.trim() : null,
    thumbnail_url: params.thumbnailUrl?.trim() ? params.thumbnailUrl.trim() : null,
  };
  const inserted = await supabase
    .from("products")
    .insert(payload)
    .select(PRODUCT_SELECT)
    .single();

  if (inserted.error) {
    return { data: null, error: inserted.error.message };
  }

  return {
    data: inserted.data
      ? normalizeAdminProductRow(inserted.data as ProductRow)
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

  const payload = {
    korean_name: params.koreanName.trim(),
    english_name: params.englishName?.trim() ? params.englishName.trim() : null,
    category: canonicalProductCategory(params.category),
    unit: params.unit?.trim() ? params.unit.trim() : null,
    thumbnail_url: params.thumbnailUrl?.trim() ? params.thumbnailUrl.trim() : null,
    ...(params.brand === undefined
      ? {}
      : { brand: params.brand.trim() || null }),
    ...(params.gtin === undefined
      ? {}
      : { gtin: normalizeGtin(params.gtin) || null }),
  };
  const updated = await supabase
    .from("products")
    .update(payload)
    .eq("id", id)
    .select(PRODUCT_SELECT)
    .single();

  if (updated.error) {
    return { data: null, error: updated.error.message };
  }

  return {
    data: updated.data
      ? normalizeAdminProductRow(updated.data as ProductRow)
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
