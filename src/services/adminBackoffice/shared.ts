import type { User } from "@supabase/supabase-js";
import type {
  AdminPriceEntry,
  AdminStore,
  AdminUser,
  JoinedName,
  PriceRow,
  ServiceResult,
  StoreRow,
} from "./types";
import { productDisplayName } from "../../utils/productNames";

export const PRODUCT_IMAGE_BUCKET =
  (process.env.EXPO_PUBLIC_SUPABASE_PRODUCT_IMAGE_BUCKET ?? "product-images").trim() ||
  "product-images";

export function missingEnvResult<T>(fallback: T): ServiceResult<T> {
  return {
    data: fallback,
    error:
      "Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.",
  };
}

export function parseNumber(value: number | string | null | undefined): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function coordinateError(latitude: number, longitude: number): string | null {
  if (latitude < -90 || latitude > 90) return "Latitude must be between -90 and 90.";
  if (longitude < -180 || longitude > 180) return "Longitude must be between -180 and 180.";
  return null;
}

export function isMissingStoreDetailsColumn(error: { code?: string; message?: string } | null): boolean {
  const text = `${error?.code ?? ""} ${error?.message ?? ""}`.toLowerCase();
  return text.includes("pgrst204") || text.includes("could not find") || text.includes("column");
}

export function normalizeStoreRow(row: StoreRow, fallback?: { latitude: number; longitude: number }): AdminStore | null {
  const lat = parseNumber(row.latitude) ?? fallback?.latitude ?? null;
  const lng = parseNumber(row.longitude) ?? fallback?.longitude ?? null;
  if (lat === null || lng === null) return null;
  return {
    id: row.id,
    brand: row.brand?.trim() || null,
    name: row.name,
    area: row.area?.trim() ?? "",
    latitude: lat,
    longitude: lng,
    price_note: row.price_note,
    address: row.address ?? null,
    place_id: row.place_id ?? null,
    phone: row.phone ?? null,
    website: row.website ?? null,
    hours: row.hours ?? null,
    store_type: row.store_type?.trim() || "grocery",
    is_active: row.is_active ?? true,
    created_at: row.created_at,
  };
}

export function extensionFromMeta(fileName?: string, contentType?: string): string {
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

export function isSessionMissing(message?: string | null): boolean {
  const text = message?.toLowerCase() ?? "";
  return text.includes("auth session missing") || text.includes("session not found");
}

export function userFromAuth(user: User | null): AdminUser | null {
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

function joinedProductName(value: JoinedName | undefined): string | null {
  if (!value) return null;
  const product = Array.isArray(value) ? value[0] : value;
  if (!product) return null;
  const displayName = productDisplayName({
    english_name: product.english_name,
    korean_name: product.korean_name ?? product.name,
  });
  return displayName === "Unnamed product" ? null : displayName;
}

function joinedBrand(value: JoinedName | undefined): string | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0]?.brand ?? null;
  return value.brand ?? null;
}

type MissingColumnInput = string | null | undefined | {
  message?: string | null;
  details?: string | null;
  hint?: string | null;
  code?: string | null;
};

function getMessageText(error: MissingColumnInput): string {
  if (typeof error === "string") return error.toLowerCase();
  if (!error) return "";
  const message = error.message ?? "";
  const details = error.details ?? "";
  const hint = error.hint ?? "";
  return `${message} ${details} ${hint}`.toLowerCase();
}

export function isMissingColumnError(error?: MissingColumnInput): boolean {
  const text = getMessageText(error);
  const code = typeof error === "object" && error !== null ? (error.code ?? "").toLowerCase() : "";
  const hasTargetColumn = text.includes("valid_from") || text.includes("valid_to");
  const hasMissingPattern =
    text.includes("does not exist") ||
    text.includes("could not find") ||
    text.includes("schema cache") ||
    code === "pgrst204";
  return hasTargetColumn && hasMissingPattern;
}

export function priceEntryFromRow(row: PriceRow, fallbackPrice?: number): AdminPriceEntry | null {
  const price = parseNumber(row.price) ?? fallbackPrice ?? null;
  if (price === null) return null;
  return {
    id: row.id,
    product_id: row.product_id,
    product_name: joinedProductName(row.products),
    store_id: row.store_id,
    store_name: joinedName(row.stores),
    store_brand: joinedBrand(row.stores),
    price,
    valid_from: row.valid_from ?? row.observed_at,
    valid_to: row.valid_to ?? null,
    observed_at: row.observed_at,
    created_at: row.created_at,
  };
}
