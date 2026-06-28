import { hasSupabaseEnv, supabase } from "../supabaseClient";
import {
  coordinateError,
  isMissingStoreDetailsColumn,
  missingEnvResult,
  normalizeStoreRow,
  parseNumber,
} from "./shared";
import type { AdminStore, ServiceResult, StoreRow } from "./types";

const STORE_EXTENDED_FIELDS =
  "id, brand, name, area, latitude, longitude, price_note, address, place_id, phone, website, hours, store_type, is_active, created_at";
const STORE_BASE_FIELDS = "id, name, area, latitude, longitude, price_note, created_at";

type StorePayloadParams = {
  brand?: string;
  name: string;
  area?: string;
  latitude: string;
  longitude: string;
  priceNote?: string;
  address?: string;
  placeId?: string;
  phone?: string;
  website?: string;
  hours?: string;
  storeType?: string;
  isActive?: boolean;
};

function buildStorePayload(params: StorePayloadParams) {
  const lat = parseNumber(params.latitude);
  const lng = parseNumber(params.longitude);
  if (lat === null || lng === null) {
    return { error: "Latitude and longitude must be valid numbers." as const };
  }
  const coordError = coordinateError(lat, lng);
  if (coordError) return { error: coordError };

  const basePayload = {
    name: params.name.trim(),
    area: params.area?.trim() || params.address?.trim() || params.name.trim(),
    latitude: lat,
    longitude: lng,
    price_note: params.priceNote?.trim() ? params.priceNote.trim() : null,
  };
  const extendedPayload = {
    ...basePayload,
    brand: params.brand?.trim() ? params.brand.trim() : null,
    address: params.address?.trim() ? params.address.trim() : null,
    place_id: params.placeId?.trim() ? params.placeId.trim() : null,
    phone: params.phone?.trim() ? params.phone.trim() : null,
    website: params.website?.trim() ? params.website.trim() : null,
    hours: params.hours?.trim() ? params.hours.trim() : null,
    store_type: params.storeType?.trim() ? params.storeType.trim() : "grocery",
    is_active: params.isActive ?? true,
  };

  return { basePayload, extendedPayload, latitude: lat, longitude: lng };
}

export async function listAdminStores(): Promise<ServiceResult<AdminStore[]>> {
  if (!hasSupabaseEnv || !supabase) return missingEnvResult([]);

  const initial = await supabase
    .from("stores")
    .select(STORE_EXTENDED_FIELDS)
    .order("created_at", { ascending: false });
  let data = initial.data as StoreRow[] | null;
  let error = initial.error;

  if (error && isMissingStoreDetailsColumn(error)) {
    const fallback = await supabase
      .from("stores")
      .select(STORE_BASE_FIELDS)
      .order("created_at", { ascending: false });
    data = fallback.data as StoreRow[] | null;
    error = fallback.error;
  }

  if (error) return { data: [], error: error.message };

  const stores = ((data ?? []) as StoreRow[])
    .map((row) => normalizeStoreRow(row))
    .filter((row): row is AdminStore => row !== null);
  return { data: stores, error: null };
}

export async function createAdminStore(params: StorePayloadParams): Promise<ServiceResult<AdminStore | null>> {
  if (!hasSupabaseEnv || !supabase) return missingEnvResult(null);

  const payload = buildStorePayload(params);
  if ("error" in payload) return { data: null, error: payload.error ?? "Invalid store payload." };

  const initial = await supabase.from("stores").insert(payload.extendedPayload).select(STORE_EXTENDED_FIELDS).single();
  let data = initial.data as StoreRow | null;
  let error = initial.error;

  if (error && isMissingStoreDetailsColumn(error)) {
    const fallback = await supabase.from("stores").insert(payload.basePayload).select(STORE_BASE_FIELDS).single();
    data = fallback.data as StoreRow | null;
    error = fallback.error;
  }

  if (error) return { data: null, error: error.message };
  return {
    data: normalizeStoreRow(data as StoreRow, { latitude: payload.latitude, longitude: payload.longitude }),
    error: null,
  };
}

export async function updateAdminStore(params: StorePayloadParams & { id: string }): Promise<ServiceResult<AdminStore | null>> {
  if (!hasSupabaseEnv || !supabase) return missingEnvResult(null);

  const id = params.id.trim();
  if (!id) return { data: null, error: "Store ID is required." };

  const payload = buildStorePayload(params);
  if ("error" in payload) return { data: null, error: payload.error ?? "Invalid store payload." };

  const initial = await supabase
    .from("stores")
    .update(payload.extendedPayload)
    .eq("id", id)
    .select(STORE_EXTENDED_FIELDS)
    .single();
  let data = initial.data as StoreRow | null;
  let error = initial.error;

  if (error && isMissingStoreDetailsColumn(error)) {
    const fallback = await supabase
      .from("stores")
      .update(payload.basePayload)
      .eq("id", id)
      .select(STORE_BASE_FIELDS)
      .single();
    data = fallback.data as StoreRow | null;
    error = fallback.error;
  }

  if (error) return { data: null, error: error.message };
  return {
    data: normalizeStoreRow(data as StoreRow, { latitude: payload.latitude, longitude: payload.longitude }),
    error: null,
  };
}

export async function deleteAdminStore(storeId: string): Promise<ServiceResult<null>> {
  if (!hasSupabaseEnv || !supabase) return missingEnvResult(null);

  const { error } = await supabase.from("stores").delete().eq("id", storeId);
  return { data: null, error: error ? error.message : null };
}
