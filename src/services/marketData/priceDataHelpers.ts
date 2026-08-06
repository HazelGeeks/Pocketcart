import { BUSINESS_TIME_ZONE } from "../../utils/businessDateTime";
import {
  saleSessionKey,
  saleSessionStartFromKey,
} from "../../utils/saleSession";
import { parseNumber } from "./shared";
import type { PriceRow } from "./types";

export type PriceDeltaInfo = {
  previousPrice: number | null;
  priceDelta: number | null;
  percentDelta: number | null;
};

export type PriceRowWithMeta = PriceRow & {
  price: number;
  priceSession: string;
};

export type QueryError = { message: string };

export type PriceSummaryRpcRow = {
  product_id: string;
  current_price: number | string;
  previous_price: number | string | null;
  current_session_start: string;
  current_session_end: string | null;
  previous_session_start: string | null;
  previous_session_end: string | null;
  best_store_id: string | null;
  best_store_brand: string | null;
  best_store_name: string | null;
  best_store_area: string | null;
};

export function isMissingPriceQueryColumnError(
  error: string | null | undefined,
): boolean {
  const text = (error ?? "").toLowerCase();
  const mentionsKnownOptionalColumn =
    text.includes("brand") ||
    text.includes("valid_from") ||
    text.includes("valid_to");
  const hasMissingPattern =
    text.includes("does not exist") ||
    text.includes("could not find") ||
    text.includes("schema cache") ||
    text.includes("pgrst204");
  return mentionsKnownOptionalColumn && hasMissingPattern;
}

export function isMissingPriceSummaryRpcError(
  error: string | null | undefined,
): boolean {
  const text = (error ?? "").toLowerCase();
  return (
    text.includes("list_product_price_summaries") &&
    (text.includes("could not find") ||
      text.includes("does not exist") ||
      text.includes("schema cache") ||
      text.includes("pgrst202"))
  );
}

export function buildSessionLabel(session: string): string {
  const date = new Date(saleSessionStartFromKey(session));
  if (Number.isNaN(date.getTime())) return "unknown";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    timeZone: BUSINESS_TIME_ZONE,
  });
}

function sessionTime(session: string): number {
  const parsed = new Date(saleSessionStartFromKey(session)).getTime();
  return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
}

function rowEndTime(row: PriceRowWithMeta): number {
  if (!row.valid_to) return Number.POSITIVE_INFINITY;
  const parsed = new Date(row.valid_to).getTime();
  return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
}

export function getCurrentSaleSession(
  rows: PriceRowWithMeta[],
  nowMs = Date.now(),
): string | null {
  const sessions = [...new Set(rows.map((row) => row.priceSession))].sort(
    (a, b) => sessionTime(b) - sessionTime(a) || b.localeCompare(a),
  );
  return (
    sessions.find((session) =>
      rows.some(
        (row) =>
          row.priceSession === session &&
          sessionTime(row.priceSession) <= nowMs &&
          rowEndTime(row) >= nowMs,
      ),
    ) ?? null
  );
}

export function getPreviousVisibleSession(
  rows: PriceRowWithMeta[],
  currentSession: string | null,
  nowMs = Date.now(),
): string | null {
  if (!currentSession) return null;
  const currentTime = sessionTime(currentSession);
  const sessions = [...new Set(rows.map((row) => row.priceSession))].sort(
    (a, b) => sessionTime(b) - sessionTime(a) || b.localeCompare(a),
  );
  return (
    sessions.find((session) => {
      const time = sessionTime(session);
      return time <= nowMs && time < currentTime;
    }) ?? null
  );
}

export function toPriceDelta(
  current: number | null,
  previous: number | null,
): PriceDeltaInfo {
  if (current === null || previous === null) {
    return { previousPrice: previous, priceDelta: null, percentDelta: null };
  }
  const delta = current - previous;
  const percent =
    previous === 0
      ? delta > 0
        ? Number.POSITIVE_INFINITY
        : delta < 0
          ? Number.NEGATIVE_INFINITY
          : 0
      : (delta / previous) * 100;
  return { previousPrice: previous, priceDelta: delta, percentDelta: percent };
}

export function rowToMeta(row: PriceRow): PriceRowWithMeta | null {
  const price = parseNumber(row.price);
  if (price === null) return null;
  return {
    ...row,
    price,
    priceSession: saleSessionKey({
      validFrom: row.valid_from,
      validTo: row.valid_to,
      observedAt: row.observed_at,
    }),
  };
}

export function formatComparisonLabel(
  currentLabel: string | null,
  previousLabel: string | null,
): string {
  if (!currentLabel || !previousLabel) return "First tracked sale price";
  return `Current sale ${currentLabel} vs last sale ${previousLabel}`;
}

export function storeDisplayName(
  store: PriceRow["stores"] | undefined | null,
): string {
  if (!store) return "Unknown store";
  const name = store.name?.trim() ?? "";
  const brand = store.brand?.trim() ?? "";
  if (brand && name && brand.toLowerCase() !== name.toLowerCase()) {
    return `${brand} - ${name}`;
  }
  return brand || name || "Unknown store";
}

export function getStoreNameFromRow(
  row: PriceRowWithMeta | undefined | null,
): string {
  return storeDisplayName(row?.stores);
}
