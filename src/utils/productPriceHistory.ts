import {
  normalizeSessionDate,
  saleSessionKey,
  saleSessionStart,
} from "./saleSession";

export type ProductPriceHistoryCandidate = {
  id: string;
  productId: string;
  price: number;
  observedAt: string;
  validFrom: string | null;
  validTo: string | null;
  storeId: string | null;
  storeName: string;
  storeArea: string | null;
};

export type LowestPriceHistoryPoint = ProductPriceHistoryCandidate & {
  sessionStartedAt: string;
  storePrices: ProductPriceHistoryCandidate[];
};

function timestamp(value: string): number {
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
}

function tieBreakKey(row: ProductPriceHistoryCandidate): string {
  return [
    row.storeName.trim().toLocaleLowerCase("en-US"),
    row.storeId ?? "",
    row.id,
  ].join("|");
}

/**
 * A chart point represents one sale session, not one store-price row.
 * When several stores participate in the same session, the lowest price wins.
 */
export function selectLowestPricePerSaleSession(
  rows: ProductPriceHistoryCandidate[],
  nowMs = Date.now(),
): LowestPriceHistoryPoint[] {
  const bestBySession = new Map<string, LowestPriceHistoryPoint>();
  const storePricesBySession = new Map<
    string,
    Map<string, ProductPriceHistoryCandidate>
  >();

  for (const row of rows) {
    if (!Number.isFinite(row.price) || row.price < 0) continue;

    const sessionStartedAt = saleSessionStart(row);
    const sessionKey = saleSessionKey(row);
    const sessionStartedAtMs = timestamp(sessionStartedAt);
    if (sessionStartedAtMs > nowMs) continue;

    const candidate: LowestPriceHistoryPoint = {
      ...row,
      validFrom: normalizeSessionDate(row.validFrom),
      validTo: normalizeSessionDate(row.validTo),
      observedAt: normalizeSessionDate(row.observedAt) ?? row.observedAt,
      sessionStartedAt,
      storePrices: [],
    };
    const storeKey =
      candidate.storeId ??
      `${candidate.storeName}\u0000${candidate.storeArea ?? ""}`;
    const storePrices = storePricesBySession.get(sessionKey) ?? new Map();
    const existingStorePrice = storePrices.get(storeKey);
    if (
      !existingStorePrice ||
      candidate.price < existingStorePrice.price ||
      (candidate.price === existingStorePrice.price &&
        tieBreakKey(candidate).localeCompare(tieBreakKey(existingStorePrice)) < 0)
    ) {
      storePrices.set(storeKey, candidate);
    }
    storePricesBySession.set(sessionKey, storePrices);
    const existing = bestBySession.get(sessionKey);

    if (
      !existing ||
      candidate.price < existing.price ||
      (candidate.price === existing.price &&
        tieBreakKey(candidate).localeCompare(tieBreakKey(existing)) < 0)
    ) {
      bestBySession.set(sessionKey, candidate);
    }
  }

  return Array.from(bestBySession.entries())
    .map(([sessionKey, point]) => ({
      ...point,
      storePrices: [
        ...(storePricesBySession.get(sessionKey)?.values() ?? []),
      ].sort(
        (left, right) =>
          left.price - right.price ||
          tieBreakKey(left).localeCompare(tieBreakKey(right)),
      ),
    }))
    .sort(
      (a, b) =>
        timestamp(a.sessionStartedAt) - timestamp(b.sessionStartedAt) ||
        a.sessionStartedAt.localeCompare(b.sessionStartedAt) ||
        (a.validTo ?? "").localeCompare(b.validTo ?? "") ||
        a.id.localeCompare(b.id),
    );
}
