import { hasSupabaseEnv, supabase } from "../supabaseClient";
import { isMissingColumnError, missingEnvResult, parseNumber, priceEntryFromRow } from "./shared";
import type { AdminPriceEntry, PriceRow, ServiceResult } from "./types";

const PRICE_WITH_PERIOD_SELECT =
  "id, product_id, store_id, price, valid_from, valid_to, observed_at, created_at, products(name), stores(name)";
const PRICE_PAGE_SIZE = 1000;
const PRICE_PERIOD_MIGRATION_ERROR =
  "Sale period columns are missing in Supabase. Run the product_prices valid_from/valid_to migration, then retry.";

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

  const observedRaw = params.observedAt?.trim() ?? "";
  const periodEndRaw = params.periodEnd?.trim() ?? "";
  if (!observedRaw || !periodEndRaw) {
    return { error: "Sale period start and end dates are required for price entries." as const };
  }

  const parsedObserved = new Date(observedRaw);
  if (Number.isNaN(parsedObserved.getTime())) {
    return { error: "Observed date must be a valid date string." as const };
  }
  const observedAt = parsedObserved.toISOString();

  const parsedPeriodEnd = new Date(periodEndRaw);
  if (Number.isNaN(parsedPeriodEnd.getTime())) {
    return { error: "Period end date must be a valid date string." as const };
  }
  const validTo = parsedPeriodEnd.toISOString();
  if (new Date(validTo).getTime() < new Date(observedAt).getTime()) {
    return { error: "Period end date must be after period start date." as const };
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
    observedAt,
    validTo,
  };
}

function isDuplicatePricePeriodError(error: { code?: string; message?: string } | null | undefined): boolean {
  const text = error?.message?.toLowerCase() ?? "";
  return error?.code === "23505" || text.includes("product_prices_product_store_valid_from_key");
}

export async function listAdminPriceEntries(limit = 5000): Promise<ServiceResult<AdminPriceEntry[]>> {
  if (!hasSupabaseEnv || !supabase) return missingEnvResult([]);
  const client = supabase;

  const queryLimit = Math.max(1, Math.min(limit, 5000));

  type FetchPriceRowsResult = {
    rows: PriceRow[];
    error: string | null;
  };

  async function fetchPriceRows(selectClause: string): Promise<FetchPriceRowsResult> {
    const collected: PriceRow[] = [];
    let page = 0;

    while (true) {
      const from = page * PRICE_PAGE_SIZE;
      const to = from + Math.min(PRICE_PAGE_SIZE - 1, queryLimit - 1 - from);
      const response = await client
        .from("product_prices")
        .select(selectClause)
        .order("observed_at", { ascending: false })
        .range(from, to);

      if (response.error) {
        return { rows: [], error: response.error.message };
      }

      const chunk = ((response.data ?? []) as unknown) as PriceRow[];
      collected.push(...chunk);
      if (chunk.length < PRICE_PAGE_SIZE) break;
      if (collected.length >= queryLimit) break;
      page += 1;
    }

    return { rows: collected.slice(0, queryLimit), error: null };
  }

  const withPeriodRows = await fetchPriceRows(PRICE_WITH_PERIOD_SELECT);

  let rows: PriceRow[] = [];
  if (withPeriodRows.error) {
    if (!isMissingColumnError(withPeriodRows.error)) {
      return { data: [], error: withPeriodRows.error };
    }
    return { data: [], error: PRICE_PERIOD_MIGRATION_ERROR };
  } else {
    rows = withPeriodRows.rows;
  }

  if (!rows.length) {
    return { data: [], error: null };
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
    if (isMissingColumnError(withPeriod.error)) {
      return { data: null, error: PRICE_PERIOD_MIGRATION_ERROR };
    }
    if (!isDuplicatePricePeriodError(withPeriod.error)) {
      return { data: null, error: withPeriod.error.message };
    }

    const updatedExisting = await supabase
      .from("product_prices")
      .update(payload.payload)
      .eq("product_id", payload.payload.product_id)
      .eq("store_id", payload.payload.store_id)
      .eq("valid_from", payload.observedAt)
      .select(PRICE_WITH_PERIOD_SELECT)
      .single();

    if (updatedExisting.error) {
      if (isMissingColumnError(updatedExisting.error)) return { data: null, error: PRICE_PERIOD_MIGRATION_ERROR };
      return { data: null, error: updatedExisting.error.message };
    }
    row = (updatedExisting.data as PriceRow) ?? null;
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
    if (!isMissingColumnError(withPeriod.error)) return { data: null, error: withPeriod.error.message };
    return { data: null, error: PRICE_PERIOD_MIGRATION_ERROR };
  } else {
    row = (withPeriod.data as PriceRow) ?? null;
  }

  if (!row) return { data: null, error: "Failed to update price entry." };
  const entry = priceEntryFromRow(row, payload.price);
  if (!entry) return { data: null, error: "Failed to read price entry result." };
  return { data: entry, error: null };
}
