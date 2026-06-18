import { hasSupabaseEnv, supabase } from "../supabaseClient";
import { isMissingColumnError, missingEnvResult, parseNumber, priceEntryFromRow } from "./shared";
import type { AdminPriceEntry, PriceRow, ServiceResult } from "./types";

const PRICE_WITH_PERIOD_SELECT =
  "id, product_id, store_id, price, valid_from, valid_to, observed_at, created_at, products(name), stores(name)";
const PRICE_BASE_SELECT = "id, product_id, store_id, price, observed_at, created_at, products(name), stores(name)";

type PricePayloadParams = {
  productId: string;
  storeId: string;
  price: string;
  observedAt?: string;
  periodEnd?: string;
};

function buildPricePayload(params: PricePayloadParams) {
  const productId = params.productId.trim();
  const storeId = params.storeId.trim();
  if (!productId || !storeId) return { error: "Product ID and Store ID are required." as const };

  const price = parseNumber(params.price);
  if (price === null) return { error: "Price must be a valid number." as const };

  let observedAt = new Date().toISOString();
  const observedRaw = params.observedAt?.trim() ?? "";
  if (observedRaw.length > 0) {
    const parsed = new Date(observedRaw);
    if (Number.isNaN(parsed.getTime())) return { error: "Observed date must be a valid date string." as const };
    observedAt = parsed.toISOString();
  }

  let validTo: string | null = null;
  const periodEndRaw = params.periodEnd?.trim() ?? "";
  if (periodEndRaw) {
    const parsed = new Date(periodEndRaw);
    if (Number.isNaN(parsed.getTime())) return { error: "Period end date must be a valid date string." as const };
    validTo = parsed.toISOString();
    if (new Date(validTo).getTime() < new Date(observedAt).getTime()) {
      return { error: "Period end date must be after period start date." as const };
    }
  }

  return {
    price,
    payload: {
      product_id: productId,
      store_id: storeId,
      price,
      valid_from: observedAt,
      valid_to: validTo,
      observed_at: observedAt,
    },
    fallbackPayload: {
      product_id: productId,
      store_id: storeId,
      price,
      observed_at: observedAt,
    },
    observedAt,
    validTo,
  };
}

export async function listAdminPriceEntries(limit = 80): Promise<ServiceResult<AdminPriceEntry[]>> {
  if (!hasSupabaseEnv || !supabase) return missingEnvResult([]);

  const queryLimit = Math.max(1, Math.min(limit, 300));
  const withPeriod = await supabase
    .from("product_prices")
    .select(PRICE_WITH_PERIOD_SELECT)
    .order("observed_at", { ascending: false })
    .limit(queryLimit);

  let rows: PriceRow[] = [];
  if (withPeriod.error) {
    if (!isMissingColumnError(withPeriod.error.message)) return { data: [], error: withPeriod.error.message };
    const fallback = await supabase
      .from("product_prices")
      .select(PRICE_BASE_SELECT)
      .order("observed_at", { ascending: false })
      .limit(queryLimit);

    if (fallback.error) return { data: [], error: fallback.error.message };
    rows = (fallback.data ?? []) as PriceRow[];
  } else {
    rows = (withPeriod.data ?? []) as PriceRow[];
  }

  const entries = rows.map((row) => priceEntryFromRow(row)).filter((row): row is AdminPriceEntry => row !== null);
  return { data: entries, error: null };
}

export async function createAdminPriceEntry(params: PricePayloadParams): Promise<ServiceResult<AdminPriceEntry | null>> {
  if (!hasSupabaseEnv || !supabase) return missingEnvResult(null);

  const payload = buildPricePayload(params);
  if ("error" in payload) return { data: null, error: payload.error ?? "Invalid price payload." };

  const withPeriod = await supabase
    .from("product_prices")
    .insert(payload.payload)
    .select(PRICE_WITH_PERIOD_SELECT)
    .single();

  let row: PriceRow | null = null;
  if (withPeriod.error) {
    if (!isMissingColumnError(withPeriod.error.message)) return { data: null, error: withPeriod.error.message };
    const fallback = await supabase
      .from("product_prices")
      .insert(payload.fallbackPayload)
      .select(PRICE_BASE_SELECT)
      .single();

    if (fallback.error) return { data: null, error: fallback.error.message };
    row = (fallback.data as PriceRow) ?? null;
    if (row) {
      row.valid_from = payload.observedAt;
      row.valid_to = payload.validTo;
    }
  } else {
    row = (withPeriod.data as PriceRow) ?? null;
  }

  if (!row) return { data: null, error: "Failed to create price entry." };
  const entry = priceEntryFromRow(row, payload.price);
  if (!entry) return { data: null, error: "Failed to read price entry result." };
  return { data: entry, error: null };
}

export async function updateAdminPriceEntry(
  params: PricePayloadParams & { id: string },
): Promise<ServiceResult<AdminPriceEntry | null>> {
  if (!hasSupabaseEnv || !supabase) return missingEnvResult(null);

  const id = params.id.trim();
  if (!id) return { data: null, error: "Price ID, Product ID, and Store ID are required." };

  const payload = buildPricePayload(params);
  if ("error" in payload) {
    const error = payload.error === "Product ID and Store ID are required."
      ? "Price ID, Product ID, and Store ID are required."
      : payload.error ?? "Invalid price payload.";
    return { data: null, error };
  }

  const withPeriod = await supabase
    .from("product_prices")
    .update(payload.payload)
    .eq("id", id)
    .select(PRICE_WITH_PERIOD_SELECT)
    .single();

  let row: PriceRow | null = null;
  if (withPeriod.error) {
    if (!isMissingColumnError(withPeriod.error.message)) return { data: null, error: withPeriod.error.message };
    const fallback = await supabase
      .from("product_prices")
      .update(payload.fallbackPayload)
      .eq("id", id)
      .select(PRICE_BASE_SELECT)
      .single();

    if (fallback.error) return { data: null, error: fallback.error.message };
    row = (fallback.data as PriceRow) ?? null;
    if (row) {
      row.valid_from = payload.observedAt;
      row.valid_to = payload.validTo;
    }
  } else {
    row = (withPeriod.data as PriceRow) ?? null;
  }

  if (!row) return { data: null, error: "Failed to update price entry." };
  const entry = priceEntryFromRow(row, payload.price);
  if (!entry) return { data: null, error: "Failed to read price entry result." };
  return { data: entry, error: null };
}

export async function deleteAdminPriceEntry(priceEntryId: string): Promise<ServiceResult<null>> {
  if (!hasSupabaseEnv || !supabase) return missingEnvResult(null);

  const { error } = await supabase.from("product_prices").delete().eq("id", priceEntryId);
  return { data: null, error: error ? error.message : null };
}
