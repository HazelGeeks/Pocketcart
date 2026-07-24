import { collectPagedRows } from "../../utils/paginatedQuery";
import { hasSupabaseEnv, supabase } from "../supabaseClient";
import { extensionFromMeta, missingEnvResult, PRODUCT_IMAGE_BUCKET } from "./shared";
import type { AdminProduct, AdminUploadedImage, ProductRow, ServiceResult } from "./types";

const PRODUCT_SELECT_WITH_ENGLISH = "id, name, english_name, category, unit, thumbnail_url, created_at";
const PRODUCT_SELECT_WITHOUT_ENGLISH = "id, name, category, unit, thumbnail_url, created_at";

type ProductRowWithOptionalEnglish = Omit<ProductRow, "english_name"> & {
  english_name?: string | null;
};

type ProductQueryError = { message: string };

function hasEnglishNameColumnError(message: string | undefined): boolean {
  const text = message?.toLowerCase() ?? "";
  return (
    text.includes("english_name") &&
    (text.includes("does not exist") ||
      text.includes("could not find") ||
      text.includes("schema cache"))
  );
}

function normalizeAdminProductRow(row: ProductRowWithOptionalEnglish | null): AdminProduct {
  const safeRow = row ?? null;
  if (!safeRow) {
    return {
      id: "",
      name: "",
      english_name: null,
      category: "",
      unit: null,
      thumbnail_url: null,
      created_at: new Date().toISOString(),
    };
  }

  return {
    id: safeRow.id,
    name: safeRow.name,
    english_name: safeRow.english_name ?? null,
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
    collectPagedRows<ProductRowWithOptionalEnglish, ProductQueryError>(
      async (from, to) => {
        const response = await client
          .from("products")
          .select(selectClause)
          .order("created_at", { ascending: false })
          .order("id", { ascending: false })
          .range(from, to);
        return {
          data: (response.data ?? []) as unknown as ProductRowWithOptionalEnglish[],
          error: response.error,
        };
      },
    );

  let productsRows: ProductRowWithOptionalEnglish[] = [];
  const productsQuery = await fetchProducts(PRODUCT_SELECT_WITH_ENGLISH);

  if (productsQuery.error) {
    if (hasEnglishNameColumnError(productsQuery.error.message)) {
      const fallbackQuery = await fetchProducts(PRODUCT_SELECT_WITHOUT_ENGLISH);
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
  name: string;
  englishName?: string;
  category: string;
  unit?: string;
  thumbnailUrl?: string;
}): Promise<ServiceResult<AdminProduct | null>> {
  if (!hasSupabaseEnv || !supabase) return missingEnvResult(null);

  const withEnglishPayload = {
    name: params.name.trim(),
    english_name: params.englishName?.trim() ? params.englishName.trim() : null,
    category: params.category.trim(),
    unit: params.unit?.trim() ? params.unit.trim() : null,
    thumbnail_url: params.thumbnailUrl?.trim() ? params.thumbnailUrl.trim() : null,
  };
  const withoutEnglishPayload = {
    name: withEnglishPayload.name,
    category: withEnglishPayload.category,
    unit: withEnglishPayload.unit,
    thumbnail_url: withEnglishPayload.thumbnail_url,
  };

  const insertedWithEnglish = await supabase
    .from("products")
    .insert(withEnglishPayload)
    .select(PRODUCT_SELECT_WITH_ENGLISH)
    .single();

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
      if (!fallbackInsert.data) {
        return { data: null, error: "Product insert returned no data." };
      }
      return {
        data: normalizeAdminProductRow(fallbackInsert.data as ProductRowWithOptionalEnglish),
        error: null,
      };
    }
    return { data: null, error: insertedWithEnglish.error.message };
  }

  return {
    data: insertedWithEnglish.data
      ? normalizeAdminProductRow(insertedWithEnglish.data as ProductRowWithOptionalEnglish)
      : null,
    error: null,
  };
}

export async function updateAdminProduct(params: {
  id: string;
  name: string;
  englishName?: string;
  category: string;
  unit?: string;
  thumbnailUrl?: string;
}): Promise<ServiceResult<AdminProduct | null>> {
  if (!hasSupabaseEnv || !supabase) return missingEnvResult(null);

  const id = params.id.trim();
  if (!id) return { data: null, error: "Product ID is required." };

  const withEnglishPayload = {
    name: params.name.trim(),
    english_name: params.englishName?.trim() ? params.englishName.trim() : null,
    category: params.category.trim(),
    unit: params.unit?.trim() ? params.unit.trim() : null,
    thumbnail_url: params.thumbnailUrl?.trim() ? params.thumbnailUrl.trim() : null,
  };
  const withoutEnglishPayload = { ...withEnglishPayload };
  delete (withoutEnglishPayload as { english_name?: string | null }).english_name;

  const updatedWithEnglish = await supabase
    .from("products")
    .update(withEnglishPayload)
    .eq("id", id)
    .select(PRODUCT_SELECT_WITH_ENGLISH)
    .single();

  if (updatedWithEnglish.error) {
    if (hasEnglishNameColumnError(updatedWithEnglish.error.message)) {
      const fallbackUpdate = await supabase
        .from("products")
        .update(withoutEnglishPayload)
        .eq("id", id)
        .select(PRODUCT_SELECT_WITHOUT_ENGLISH)
        .single();
      if (fallbackUpdate.error) {
        return { data: null, error: fallbackUpdate.error.message };
      }
      if (!fallbackUpdate.data) {
        return { data: null, error: "Product update returned no data." };
      }
      return {
        data: normalizeAdminProductRow(fallbackUpdate.data as ProductRowWithOptionalEnglish),
        error: null,
      };
    }
    return { data: null, error: updatedWithEnglish.error.message };
  }

  return {
    data: updatedWithEnglish.data
      ? normalizeAdminProductRow(updatedWithEnglish.data as ProductRowWithOptionalEnglish)
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
