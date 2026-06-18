import { hasSupabaseEnv, supabase } from "../supabaseClient";
import { extensionFromMeta, missingEnvResult, PRODUCT_IMAGE_BUCKET } from "./shared";
import type { AdminProduct, AdminUploadedImage, ProductRow, ServiceResult } from "./types";

const PRODUCT_SELECT = "id, name, category, thumbnail_url, created_at";

export async function listAdminProducts(): Promise<ServiceResult<AdminProduct[]>> {
  if (!hasSupabaseEnv || !supabase) return missingEnvResult([]);

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .order("created_at", { ascending: false });

  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as AdminProduct[], error: null };
}

export async function createAdminProduct(params: {
  name: string;
  category: string;
  thumbnailUrl?: string;
}): Promise<ServiceResult<AdminProduct | null>> {
  if (!hasSupabaseEnv || !supabase) return missingEnvResult(null);

  const payload = {
    name: params.name.trim(),
    category: params.category.trim(),
    thumbnail_url: params.thumbnailUrl?.trim() ? params.thumbnailUrl.trim() : null,
  };

  const { data, error } = await supabase.from("products").insert(payload).select(PRODUCT_SELECT).single();
  return { data: (data as ProductRow | null) ?? null, error: error ? error.message : null };
}

export async function updateAdminProduct(params: {
  id: string;
  name: string;
  category: string;
  thumbnailUrl?: string;
}): Promise<ServiceResult<AdminProduct | null>> {
  if (!hasSupabaseEnv || !supabase) return missingEnvResult(null);

  const id = params.id.trim();
  if (!id) return { data: null, error: "Product ID is required." };

  const payload = {
    name: params.name.trim(),
    category: params.category.trim(),
    thumbnail_url: params.thumbnailUrl?.trim() ? params.thumbnailUrl.trim() : null,
  };

  const { data, error } = await supabase
    .from("products")
    .update(payload)
    .eq("id", id)
    .select(PRODUCT_SELECT)
    .single();

  return { data: (data as ProductRow | null) ?? null, error: error ? error.message : null };
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
