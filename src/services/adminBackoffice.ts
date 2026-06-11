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
  address: string | null;
  phone: string | null;
  website: string | null;
  hours: string | null;
  store_type: string;
  is_active: boolean;
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

export type AdminAuditLog = {
  id: string;
  actor_user_id: string | null;
  actor_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  summary: string;
  metadata: Record<string, unknown>;
  created_at: string;
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
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  hours?: string | null;
  store_type?: string | null;
  is_active?: boolean | null;
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

type AuditLogRow = {
  id: string;
  actor_user_id: string | null;
  actor_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  summary: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
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

function coordinateError(latitude: number, longitude: number): string | null {
  if (latitude < -90 || latitude > 90) {
    return "Latitude must be between -90 and 90.";
  }
  if (longitude < -180 || longitude > 180) {
    return "Longitude must be between -180 and 180.";
  }
  return null;
}

function isMissingStoreDetailsColumn(error: { code?: string; message?: string } | null): boolean {
  const text = `${error?.code ?? ""} ${error?.message ?? ""}`.toLowerCase();
  return text.includes("pgrst204") || text.includes("could not find") || text.includes("column");
}

function normalizeStoreRow(row: StoreRow, fallback?: { latitude: number; longitude: number }): AdminStore | null {
  const lat = parseNumber(row.latitude) ?? fallback?.latitude ?? null;
  const lng = parseNumber(row.longitude) ?? fallback?.longitude ?? null;
  if (lat === null || lng === null) return null;
  return {
    id: row.id,
    name: row.name,
    area: row.area,
    latitude: lat,
    longitude: lng,
    price_note: row.price_note,
    address: row.address ?? null,
    phone: row.phone ?? null,
    website: row.website ?? null,
    hours: row.hours ?? null,
    store_type: row.store_type?.trim() || "grocery",
    is_active: row.is_active ?? true,
    created_at: row.created_at,
  };
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

  const extendedFields =
    "id, name, area, latitude, longitude, price_note, address, phone, website, hours, store_type, is_active, created_at";
  const baseFields = "id, name, area, latitude, longitude, price_note, created_at";
  const initial = await supabase
    .from("stores")
    .select(extendedFields)
    .order("created_at", { ascending: false });
  let data = initial.data as StoreRow[] | null;
  let error = initial.error;

  if (error && isMissingStoreDetailsColumn(error)) {
    const fallback = await supabase
      .from("stores")
      .select(baseFields)
      .order("created_at", { ascending: false });
    data = fallback.data as StoreRow[] | null;
    error = fallback.error;
  }

  if (error) {
    return { data: [], error: error.message };
  }

  const stores = ((data ?? []) as StoreRow[])
    .map((row) => normalizeStoreRow(row))
    .filter((row): row is AdminStore => row !== null);

  return { data: stores, error: null };
}

export async function listAdminAuditLogs(
  limit = 50,
): Promise<ServiceResult<AdminAuditLog[]>> {
  if (!hasSupabaseEnv || !supabase) {
    return missingEnvResult([]);
  }

  const queryLimit = Math.max(1, Math.min(limit, 200));
  const { data, error } = await supabase
    .from("admin_audit_logs")
    .select("id, actor_user_id, actor_email, action, entity_type, entity_id, summary, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(queryLimit);

  if (error) {
    const text = error.message.toLowerCase();
    if (text.includes("admin_audit_logs") || text.includes("does not exist")) {
      return { data: [], error: null };
    }
    return { data: [], error: error.message };
  }

  return {
    data: ((data ?? []) as AuditLogRow[]).map((row) => ({
      id: row.id,
      actor_user_id: row.actor_user_id,
      actor_email: row.actor_email,
      action: row.action,
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      summary: row.summary,
      metadata: row.metadata ?? {},
      created_at: row.created_at,
    })),
    error: null,
  };
}

export async function createAdminAuditLog(params: {
  action: string;
  entityType: string;
  entityId?: string;
  summary: string;
  metadata?: Record<string, unknown>;
}): Promise<ServiceResult<AdminAuditLog | null>> {
  if (!hasSupabaseEnv || !supabase) {
    return missingEnvResult(null);
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return { data: null, error: userError.message };
  }
  if (!user) {
    return { data: null, error: "Signed-in admin user is required." };
  }

  const payload = {
    actor_user_id: user.id,
    actor_email: user.email ?? null,
    action: params.action.trim(),
    entity_type: params.entityType.trim(),
    entity_id: params.entityId?.trim() ? params.entityId.trim() : null,
    summary: params.summary.trim(),
    metadata: params.metadata ?? {},
  };

  const { data, error } = await supabase
    .from("admin_audit_logs")
    .insert(payload)
    .select("id, actor_user_id, actor_email, action, entity_type, entity_id, summary, metadata, created_at")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  const row = data as AuditLogRow;
  return {
    data: {
      id: row.id,
      actor_user_id: row.actor_user_id,
      actor_email: row.actor_email,
      action: row.action,
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      summary: row.summary,
      metadata: row.metadata ?? {},
      created_at: row.created_at,
    },
    error: null,
  };
}

export async function createAdminStore(params: {
  name: string;
  area: string;
  latitude: string;
  longitude: string;
  priceNote?: string;
  address?: string;
  phone?: string;
  website?: string;
  hours?: string;
  storeType?: string;
  isActive?: boolean;
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
  const coordError = coordinateError(lat, lng);
  if (coordError) {
    return { data: null, error: coordError };
  }

  const basePayload = {
    name: params.name.trim(),
    area: params.area.trim(),
    latitude: lat,
    longitude: lng,
    price_note: params.priceNote?.trim() ? params.priceNote.trim() : null,
  };
  const extendedPayload = {
    ...basePayload,
    address: params.address?.trim() ? params.address.trim() : null,
    phone: params.phone?.trim() ? params.phone.trim() : null,
    website: params.website?.trim() ? params.website.trim() : null,
    hours: params.hours?.trim() ? params.hours.trim() : null,
    store_type: params.storeType?.trim() ? params.storeType.trim() : "grocery",
    is_active: params.isActive ?? true,
  };
  const extendedFields =
    "id, name, area, latitude, longitude, price_note, address, phone, website, hours, store_type, is_active, created_at";
  const baseFields = "id, name, area, latitude, longitude, price_note, created_at";

  const initial = await supabase
    .from("stores")
    .insert(extendedPayload)
    .select(extendedFields)
    .single();
  let data = initial.data as StoreRow | null;
  let error = initial.error;

  if (error && isMissingStoreDetailsColumn(error)) {
    const fallback = await supabase
      .from("stores")
      .insert(basePayload)
      .select(baseFields)
      .single();
    data = fallback.data as StoreRow | null;
    error = fallback.error;
  }

  if (error) {
    return { data: null, error: error.message };
  }

  const normalized = normalizeStoreRow(data as StoreRow, { latitude: lat, longitude: lng });
  return {
    data: normalized,
    error: null,
  };
}

export async function updateAdminStore(params: {
  id: string;
  name: string;
  area: string;
  latitude: string;
  longitude: string;
  priceNote?: string;
  address?: string;
  phone?: string;
  website?: string;
  hours?: string;
  storeType?: string;
  isActive?: boolean;
}): Promise<ServiceResult<AdminStore | null>> {
  if (!hasSupabaseEnv || !supabase) {
    return missingEnvResult(null);
  }

  const id = params.id.trim();
  if (!id) {
    return { data: null, error: "Store ID is required." };
  }

  const lat = parseNumber(params.latitude);
  const lng = parseNumber(params.longitude);

  if (lat === null || lng === null) {
    return {
      data: null,
      error: "Latitude and longitude must be valid numbers.",
    };
  }
  const coordError = coordinateError(lat, lng);
  if (coordError) {
    return { data: null, error: coordError };
  }

  const basePayload = {
    name: params.name.trim(),
    area: params.area.trim(),
    latitude: lat,
    longitude: lng,
    price_note: params.priceNote?.trim() ? params.priceNote.trim() : null,
  };
  const extendedPayload = {
    ...basePayload,
    address: params.address?.trim() ? params.address.trim() : null,
    phone: params.phone?.trim() ? params.phone.trim() : null,
    website: params.website?.trim() ? params.website.trim() : null,
    hours: params.hours?.trim() ? params.hours.trim() : null,
    store_type: params.storeType?.trim() ? params.storeType.trim() : "grocery",
    is_active: params.isActive ?? true,
  };
  const extendedFields =
    "id, name, area, latitude, longitude, price_note, address, phone, website, hours, store_type, is_active, created_at";
  const baseFields = "id, name, area, latitude, longitude, price_note, created_at";

  const initial = await supabase
    .from("stores")
    .update(extendedPayload)
    .eq("id", id)
    .select(extendedFields)
    .single();
  let data = initial.data as StoreRow | null;
  let error = initial.error;

  if (error && isMissingStoreDetailsColumn(error)) {
    const fallback = await supabase
      .from("stores")
      .update(basePayload)
      .eq("id", id)
      .select(baseFields)
      .single();
    data = fallback.data as StoreRow | null;
    error = fallback.error;
  }

  if (error) {
    return { data: null, error: error.message };
  }

  const normalized = normalizeStoreRow(data as StoreRow, { latitude: lat, longitude: lng });
  return {
    data: normalized,
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

export async function updateAdminPriceEntry(params: {
  id: string;
  productId: string;
  storeId: string;
  price: string;
  observedAt?: string;
  periodEnd?: string;
}): Promise<ServiceResult<AdminPriceEntry | null>> {
  if (!hasSupabaseEnv || !supabase) {
    return missingEnvResult(null);
  }

  const id = params.id.trim();
  const productId = params.productId.trim();
  const storeId = params.storeId.trim();
  if (!id || !productId || !storeId) {
    return {
      data: null,
      error: "Price ID, Product ID, and Store ID are required.",
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
    .update(payload)
    .eq("id", id)
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
      .update(fallbackPayload)
      .eq("id", id)
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
    return { data: null, error: "Failed to update price entry." };
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
