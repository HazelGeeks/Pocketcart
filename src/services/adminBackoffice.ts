import type { User } from "@supabase/supabase-js";
import { hasSupabaseEnv, supabase } from "./supabaseClient";

type ServiceResult<T> = {
  data: T;
  error: string | null;
};

export type AdminUser = {
  id: string;
  email: string;
};

export type AdminProduct = {
  id: string;
  name: string;
  category: string;
  thumbnail_url: string | null;
  created_at: string;
};

export type AdminStore = {
  id: string;
  name: string;
  area: string;
  latitude: number;
  longitude: number;
  price_note: string | null;
  created_at: string;
};

export type AdminPriceEntry = {
  id: string;
  product_id: string;
  product_name: string | null;
  store_id: string;
  store_name: string | null;
  price: number;
  valid_from: string;
  valid_to: string | null;
  observed_at: string;
  created_at: string;
};

export type AdminUploadedImage = {
  bucket: string;
  path: string;
  publicUrl: string;
};

type ProductRow = {
  id: string;
  name: string;
  category: string;
  thumbnail_url: string | null;
  created_at: string;
};

type StoreRow = {
  id: string;
  name: string;
  area: string;
  latitude: number | string;
  longitude: number | string;
  price_note: string | null;
  created_at: string;
};

type JoinedName = { name?: string | null } | Array<{ name?: string | null }> | null;

type PriceRow = {
  id: string;
  product_id: string;
  store_id: string;
  price: number | string;
  valid_from?: string | null;
  valid_to?: string | null;
  observed_at: string;
  created_at: string;
  products?: JoinedName;
  stores?: JoinedName;
};

const PRODUCT_IMAGE_BUCKET =
  (process.env.EXPO_PUBLIC_SUPABASE_PRODUCT_IMAGE_BUCKET ?? "product-images").trim() ||
  "product-images";

function missingEnvResult<T>(fallback: T): ServiceResult<T> {
  return {
    data: fallback,
    error:
      "Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.",
  };
}

function parseNumber(value: number | string | null | undefined): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function extensionFromMeta(fileName?: string, contentType?: string): string {
  const byName = fileName?.trim().toLowerCase() ?? "";
  const byNameMatch = byName.match(/\.([a-z0-9]+)$/);
  if (byNameMatch?.[1]) return byNameMatch[1];

  const mime = contentType?.trim().toLowerCase() ?? "";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "jpg";
}

function isSessionMissing(message?: string | null): boolean {
  const text = message?.toLowerCase() ?? "";
  return text.includes("auth session missing") || text.includes("session not found");
}

function userFromAuth(user: User | null): AdminUser | null {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email ?? "",
  };
}

function joinedName(value: JoinedName | undefined): string | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0]?.name ?? null;
  return value.name ?? null;
}

function isMissingColumnError(message?: string | null): boolean {
  const text = message?.toLowerCase() ?? "";
  return text.includes("does not exist") && (text.includes("valid_from") || text.includes("valid_to"));
}

function priceEntryFromRow(
  row: PriceRow,
  fallbackPrice?: number,
): AdminPriceEntry | null {
  const price = parseNumber(row.price) ?? fallbackPrice ?? null;
  if (price === null) return null;
  return {
    id: row.id,
    product_id: row.product_id,
    product_name: joinedName(row.products),
    store_id: row.store_id,
    store_name: joinedName(row.stores),
    price,
    valid_from: row.valid_from ?? row.observed_at,
    valid_to: row.valid_to ?? null,
    observed_at: row.observed_at,
    created_at: row.created_at,
  };
}

export async function getAdminUser(): Promise<ServiceResult<AdminUser | null>> {
  if (!hasSupabaseEnv || !supabase) {
    return missingEnvResult(null);
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    if (isSessionMissing(error.message)) {
      return { data: null, error: null };
    }
    return { data: null, error: error.message };
  }

  return {
    data: userFromAuth(user),
    error: null,
  };
}

export async function signInAdmin(params: {
  email: string;
  password: string;
}): Promise<ServiceResult<AdminUser | null>> {
  if (!hasSupabaseEnv || !supabase) {
    return missingEnvResult(null);
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: params.email.trim(),
    password: params.password,
  });

  if (error) {
    return { data: null, error: error.message };
  }

  return {
    data: userFromAuth(data.user ?? null),
    error: null,
  };
}

export async function signOutAdmin(): Promise<ServiceResult<null>> {
  if (!hasSupabaseEnv || !supabase) {
    return missingEnvResult(null);
  }

  const { error } = await supabase.auth.signOut();
  return {
    data: null,
    error: error ? error.message : null,
  };
}

export async function listAdminProducts(): Promise<ServiceResult<AdminProduct[]>> {
  if (!hasSupabaseEnv || !supabase) {
    return missingEnvResult([]);
  }

  const { data, error } = await supabase
    .from("products")
    .select("id, name, category, thumbnail_url, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return { data: [], error: error.message };
  }

  return {
    data: (data ?? []) as AdminProduct[],
    error: null,
  };
}

export async function createAdminProduct(params: {
  name: string;
  category: string;
  thumbnailUrl?: string;
}): Promise<ServiceResult<AdminProduct | null>> {
  if (!hasSupabaseEnv || !supabase) {
    return missingEnvResult(null);
  }

  const payload = {
    name: params.name.trim(),
    category: params.category.trim(),
    thumbnail_url: params.thumbnailUrl?.trim() ? params.thumbnailUrl.trim() : null,
  };

  const { data, error } = await supabase
    .from("products")
    .insert(payload)
    .select("id, name, category, thumbnail_url, created_at")
    .single();

  return {
    data: (data as ProductRow | null) ?? null,
    error: error ? error.message : null,
  };
}

export async function updateAdminProduct(params: {
  id: string;
  name: string;
  category: string;
  thumbnailUrl?: string;
}): Promise<ServiceResult<AdminProduct | null>> {
  if (!hasSupabaseEnv || !supabase) {
    return missingEnvResult(null);
  }

  const id = params.id.trim();
  if (!id) {
    return { data: null, error: "Product ID is required." };
  }

  const payload = {
    name: params.name.trim(),
    category: params.category.trim(),
    thumbnail_url: params.thumbnailUrl?.trim() ? params.thumbnailUrl.trim() : null,
  };

  const { data, error } = await supabase
    .from("products")
    .update(payload)
    .eq("id", id)
    .select("id, name, category, thumbnail_url, created_at")
    .single();

  return {
    data: (data as ProductRow | null) ?? null,
    error: error ? error.message : null,
  };
}

export async function uploadAdminProductImage(params: {
  file: Blob;
  fileName?: string;
  contentType?: string;
}): Promise<ServiceResult<AdminUploadedImage | null>> {
  if (!hasSupabaseEnv || !supabase) {
    return missingEnvResult(null);
  }

  const fileSize = typeof params.file.size === "number" ? params.file.size : 0;
  const TEN_MB = 10 * 1024 * 1024;
  if (fileSize > TEN_MB) {
    return {
      data: null,
      error: "Image must be 10MB or smaller.",
    };
  }

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
    data: {
      bucket: PRODUCT_IMAGE_BUCKET,
      path: objectPath,
      publicUrl: data.publicUrl,
    },
    error: null,
  };
}

export async function deleteAdminProduct(
  productId: string,
): Promise<ServiceResult<null>> {
  if (!hasSupabaseEnv || !supabase) {
    return missingEnvResult(null);
  }

  const { error } = await supabase.from("products").delete().eq("id", productId);

  return {
    data: null,
    error: error ? error.message : null,
  };
}

export async function listAdminStores(): Promise<ServiceResult<AdminStore[]>> {
  if (!hasSupabaseEnv || !supabase) {
    return missingEnvResult([]);
  }

  const { data, error } = await supabase
    .from("stores")
    .select("id, name, area, latitude, longitude, price_note, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return { data: [], error: error.message };
  }

  const stores = ((data ?? []) as StoreRow[])
    .map((row) => {
      const lat = parseNumber(row.latitude);
      const lng = parseNumber(row.longitude);
      if (lat === null || lng === null) return null;
      return {
        id: row.id,
        name: row.name,
        area: row.area,
        latitude: lat,
        longitude: lng,
        price_note: row.price_note,
        created_at: row.created_at,
      };
    })
    .filter((row): row is AdminStore => row !== null);

  return { data: stores, error: null };
}

export async function createAdminStore(params: {
  name: string;
  area: string;
  latitude: string;
  longitude: string;
  priceNote?: string;
}): Promise<ServiceResult<AdminStore | null>> {
  if (!hasSupabaseEnv || !supabase) {
    return missingEnvResult(null);
  }

  const lat = parseNumber(params.latitude);
  const lng = parseNumber(params.longitude);

  if (lat === null || lng === null) {
    return {
      data: null,
      error: "Latitude and longitude must be valid numbers.",
    };
  }

  const payload = {
    name: params.name.trim(),
    area: params.area.trim(),
    latitude: lat,
    longitude: lng,
    price_note: params.priceNote?.trim() ? params.priceNote.trim() : null,
  };

  const { data, error } = await supabase
    .from("stores")
    .insert(payload)
    .select("id, name, area, latitude, longitude, price_note, created_at")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  const row = data as StoreRow;
  return {
    data: {
      id: row.id,
      name: row.name,
      area: row.area,
      latitude: parseNumber(row.latitude) ?? lat,
      longitude: parseNumber(row.longitude) ?? lng,
      price_note: row.price_note,
      created_at: row.created_at,
    },
    error: null,
  };
}

export async function deleteAdminStore(storeId: string): Promise<ServiceResult<null>> {
  if (!hasSupabaseEnv || !supabase) {
    return missingEnvResult(null);
  }

  const { error } = await supabase.from("stores").delete().eq("id", storeId);

  return {
    data: null,
    error: error ? error.message : null,
  };
}

export async function listAdminPriceEntries(
  limit = 80,
): Promise<ServiceResult<AdminPriceEntry[]>> {
  if (!hasSupabaseEnv || !supabase) {
    return missingEnvResult([]);
  }

  const queryLimit = Math.max(1, Math.min(limit, 300));
  const withPeriod = await supabase
    .from("product_prices")
    .select(
      "id, product_id, store_id, price, valid_from, valid_to, observed_at, created_at, products(name), stores(name)",
    )
    .order("observed_at", { ascending: false })
    .limit(queryLimit);

  let rows: PriceRow[] = [];
  if (withPeriod.error) {
    if (!isMissingColumnError(withPeriod.error.message)) {
      return { data: [], error: withPeriod.error.message };
    }
    const fallback = await supabase
      .from("product_prices")
      .select(
        "id, product_id, store_id, price, observed_at, created_at, products(name), stores(name)",
      )
      .order("observed_at", { ascending: false })
      .limit(queryLimit);

    if (fallback.error) {
      return { data: [], error: fallback.error.message };
    }
    rows = (fallback.data ?? []) as PriceRow[];
  } else {
    rows = (withPeriod.data ?? []) as PriceRow[];
  }

  const entries = rows
    .map((row) => priceEntryFromRow(row))
    .filter((row): row is AdminPriceEntry => row !== null);

  return { data: entries, error: null };
}

export async function createAdminPriceEntry(params: {
  productId: string;
  storeId: string;
  price: string;
  observedAt?: string;
  periodEnd?: string;
}): Promise<ServiceResult<AdminPriceEntry | null>> {
  if (!hasSupabaseEnv || !supabase) {
    return missingEnvResult(null);
  }

  const productId = params.productId.trim();
  const storeId = params.storeId.trim();
  if (!productId || !storeId) {
    return {
      data: null,
      error: "Product ID and Store ID are required.",
    };
  }

  const price = parseNumber(params.price);
  if (price === null) {
    return {
      data: null,
      error: "Price must be a valid number.",
    };
  }

  let observedAt = new Date().toISOString();
  const observedRaw = params.observedAt?.trim() ?? "";
  if (observedRaw.length > 0) {
    const parsed = new Date(observedRaw);
    if (Number.isNaN(parsed.getTime())) {
      return {
        data: null,
        error: "Observed date must be a valid date string.",
      };
    }
    observedAt = parsed.toISOString();
  }

  let validTo: string | null = null;
  const periodEndRaw = params.periodEnd?.trim() ?? "";
  if (periodEndRaw) {
    const parsed = new Date(periodEndRaw);
    if (Number.isNaN(parsed.getTime())) {
      return {
        data: null,
        error: "Period end date must be a valid date string.",
      };
    }
    validTo = parsed.toISOString();
    if (new Date(validTo).getTime() < new Date(observedAt).getTime()) {
      return {
        data: null,
        error: "Period end date must be after period start date.",
      };
    }
  }

  const payload = {
    product_id: productId,
    store_id: storeId,
    price,
    valid_from: observedAt,
    valid_to: validTo,
    observed_at: observedAt,
  };

  const withPeriod = await supabase
    .from("product_prices")
    .insert(payload)
    .select(
      "id, product_id, store_id, price, valid_from, valid_to, observed_at, created_at, products(name), stores(name)",
    )
    .single();

  let row: PriceRow | null = null;
  if (withPeriod.error) {
    if (!isMissingColumnError(withPeriod.error.message)) {
      return { data: null, error: withPeriod.error.message };
    }
    const fallbackPayload = {
      product_id: productId,
      store_id: storeId,
      price,
      observed_at: observedAt,
    };
    const fallback = await supabase
      .from("product_prices")
      .insert(fallbackPayload)
      .select(
        "id, product_id, store_id, price, observed_at, created_at, products(name), stores(name)",
      )
      .single();

    if (fallback.error) {
      return { data: null, error: fallback.error.message };
    }
    row = (fallback.data as PriceRow) ?? null;
    if (row) {
      row.valid_from = observedAt;
      row.valid_to = validTo;
    }
  } else {
    row = (withPeriod.data as PriceRow) ?? null;
  }

  if (!row) {
    return { data: null, error: "Failed to create price entry." };
  }

  const entry = priceEntryFromRow(row, price);
  if (!entry) {
    return { data: null, error: "Failed to read price entry result." };
  }

  return {
    data: entry,
    error: null,
  };
}

export async function deleteAdminPriceEntry(
  priceEntryId: string,
): Promise<ServiceResult<null>> {
  if (!hasSupabaseEnv || !supabase) {
    return missingEnvResult(null);
  }

  const { error } = await supabase
    .from("product_prices")
    .delete()
    .eq("id", priceEntryId);

  return {
    data: null,
    error: error ? error.message : null,
  };
}
