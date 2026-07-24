export type SaleAlertPriceCandidate = {
  store_id: string | null;
  priceValue: number;
  observed_at: string;
  valid_from: string | null;
  valid_to: string | null;
};

export type SaleAlertPriceSelection<T extends SaleAlertPriceCandidate> = {
  current: T;
  previous: T | null;
  sessionKey: string;
  sessionStartedAt: string;
};

function normalizedDate(value: string | null | undefined): string | null {
  const source = value?.trim();
  if (!source) return null;
  const parsed = new Date(source);
  return Number.isNaN(parsed.getTime()) ? source : parsed.toISOString();
}

function sessionStart(row: SaleAlertPriceCandidate): string {
  return normalizedDate(row.valid_from) ??
    normalizedDate(row.observed_at) ??
    row.observed_at;
}

function sessionEnd(row: SaleAlertPriceCandidate): string | null {
  return normalizedDate(row.valid_to);
}

function sessionKey(row: SaleAlertPriceCandidate): string {
  return `${sessionStart(row)}\u0000${sessionEnd(row) ?? "open"}`;
}

function sessionTime(key: string): number {
  const start = key.split("\u0000", 1)[0] ?? key;
  const parsed = new Date(start).getTime();
  return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
}

function rowEndTime(row: SaleAlertPriceCandidate): number {
  if (!row.valid_to) return Number.POSITIVE_INFINITY;
  const parsed = new Date(row.valid_to).getTime();
  return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
}

function currentSession<T extends SaleAlertPriceCandidate>(
  rows: T[],
  nowMs: number,
): string | null {
  const sessions = [...new Set(rows.map(sessionKey))].sort(
    (a, b) => sessionTime(b) - sessionTime(a) || b.localeCompare(a),
  );
  return sessions.find((key) =>
    rows.some(
      (row) =>
        sessionKey(row) === key &&
        sessionTime(key) <= nowMs &&
        rowEndTime(row) >= nowMs,
    ),
  ) ?? null;
}

function previousSession<T extends SaleAlertPriceCandidate>(
  rows: T[],
  current: string,
  nowMs: number,
): string | null {
  const currentTime = sessionTime(current);
  return [...new Set(rows.map(sessionKey))]
    .filter((key) => {
      const start = sessionTime(key);
      return start <= nowMs && start < currentTime;
    })
    .sort((a, b) => sessionTime(b) - sessionTime(a) || b.localeCompare(a))[0] ?? null;
}

function lowestPrice<T extends SaleAlertPriceCandidate>(rows: T[]): T | null {
  return rows.reduce<T | null>(
    (best, row) => (
      !best ||
      row.priceValue < best.priceValue ||
      (row.priceValue === best.priceValue && (row.store_id ?? "").localeCompare(best.store_id ?? "") < 0)
        ? row
        : best
    ),
    null,
  );
}

export function selectSaleAlertPrices<T extends SaleAlertPriceCandidate>(params: {
  rows: T[];
  explicitStoreId?: string | null;
  favoriteStoreIds?: Iterable<string>;
  nowMs?: number;
}): SaleAlertPriceSelection<T> | null {
  const nowMs = params.nowMs ?? Date.now();
  const explicitStoreId = params.explicitStoreId?.trim() ?? "";
  const favoriteStoreIds = new Set(params.favoriteStoreIds ?? []);
  const explicitRows = explicitStoreId
    ? params.rows.filter((row) => row.store_id === explicitStoreId)
    : [];
  const favoriteRows = explicitStoreId
    ? []
    : params.rows.filter((row) => row.store_id && favoriteStoreIds.has(row.store_id));

  let eligibleRows = explicitStoreId ? explicitRows : favoriteRows;
  if (!explicitStoreId && currentSession(eligibleRows, nowMs) === null) {
    eligibleRows = params.rows;
  }
  if (eligibleRows.length === 0) return null;

  const activeSession = currentSession(eligibleRows, nowMs);
  if (!activeSession) return null;
  const previous = previousSession(eligibleRows, activeSession, nowMs);
  const currentPrice = lowestPrice(
    eligibleRows.filter((row) => sessionKey(row) === activeSession),
  );
  if (!currentPrice) return null;
  const previousPrice = previous
    ? lowestPrice(eligibleRows.filter((row) => sessionKey(row) === previous))
    : null;

  return {
    current: currentPrice,
    previous: previousPrice,
    sessionKey: activeSession,
    sessionStartedAt: sessionStart(currentPrice),
  };
}
