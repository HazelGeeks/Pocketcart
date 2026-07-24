import { hasSupabaseEnv, supabase } from "../supabaseClient";
import { FALLBACK_PRICE_HISTORY, FALLBACK_PRODUCTS } from "./fallbacks";
import { parseNumber } from "./shared";
import type { MarketPricePoint, MarketStorePrice, PriceRow, ServiceResult } from "./types";
import { collectPagedRows } from "../../utils/paginatedQuery";

type PriceDeltaInfo = {
  previousPrice: number | null;
  priceDelta: number | null;
  percentDelta: number | null;
};

type PriceRowWithMeta = PriceRow & {
  price: number;
  priceSession: string;
};

type QueryError = { message: string };

function isMissingPriceQueryColumnError(error: string | null | undefined): boolean {
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

function toPriceSession(row: PriceRow): string {
  const source = row.valid_from?.trim() || row.observed_at;
  const parsed = new Date(source);
  if (Number.isNaN(parsed.getTime())) {
    return row.observed_at;
  }
  return parsed.toISOString();
}

function buildSessionLabel(session: string): string {
  const date = new Date(session);
  if (Number.isNaN(date.getTime())) {
    return "unknown";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function sessionTime(session: string): number {
  const parsed = new Date(session).getTime();
  return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
}

function rowEndTime(row: PriceRowWithMeta): number {
  if (!row.valid_to) return Number.POSITIVE_INFINITY;
  const parsed = new Date(row.valid_to).getTime();
  return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
}

function getCurrentSaleSession(rows: PriceRowWithMeta[], nowMs = Date.now()): string | null {
  const orderedSessions: string[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    if (seen.has(row.priceSession)) continue;
    seen.add(row.priceSession);
    orderedSessions.push(row.priceSession);
  }

  return orderedSessions.find((session) =>
    rows.some((row) => row.priceSession === session && sessionTime(row.priceSession) <= nowMs && rowEndTime(row) >= nowMs),
  ) ?? null;
}

function getPreviousVisibleSession(rows: PriceRowWithMeta[], currentSession: string | null, nowMs = Date.now()): string | null {
  if (!currentSession) return null;
  const currentTime = sessionTime(currentSession);
  const orderedSessions: string[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    if (seen.has(row.priceSession)) continue;
    seen.add(row.priceSession);
    orderedSessions.push(row.priceSession);
  }

  return orderedSessions.find((session) => {
    const time = sessionTime(session);
    return time <= nowMs && time < currentTime;
  }) ?? null;
}

function toPriceDelta(current: number | null, previous: number | null): PriceDeltaInfo {
  if (current === null || previous === null) {
    return {
      previousPrice: previous,
      priceDelta: null,
      percentDelta: null,
    };
  }

  const delta = current - previous;
  const percent =
    previous === 0 ? (delta > 0 ? Number.POSITIVE_INFINITY : delta < 0 ? Number.NEGATIVE_INFINITY : 0) : (delta / previous) * 100;
  return {
    previousPrice: previous,
    priceDelta: delta,
    percentDelta: percent,
  };
}

function rowToMeta(row: PriceRow): PriceRowWithMeta | null {
  const price = parseNumber(row.price);
  if (price === null) return null;

  const session = toPriceSession(row);
  return {
    ...row,
    price,
    priceSession: session,
  };
}

function formatComparisonLabel(currentLabel: string | null, previousLabel: string | null): string {
  if (!currentLabel || !previousLabel) {
    return "First tracked sale price";
  }

  return `Current sale ${currentLabel} vs last sale ${previousLabel}`;
}

function getStoreNameFromRow(row: PriceRowWithMeta | undefined | null): string {
  return storeDisplayName(row?.stores);
}

function storeDisplayName(store: PriceRow["stores"] | undefined | null): string {
  if (!store) return "Unknown store";
  const name = store.name?.trim() ?? "";
  const brand = store.brand?.trim() ?? "";
  if (brand && name && brand.toLowerCase() !== name.toLowerCase()) {
    return `${brand} - ${name}`;
  }
  return brand || name || "Unknown store";
}

export async function listProductPriceHistory(
  productId: string,
): Promise<ServiceResult<MarketPricePoint[]>> {
  if (!productId.trim()) {
    return { data: [], error: "Product id is required." };
  }

  if (!hasSupabaseEnv || !supabase) {
    const values = FALLBACK_PRICE_HISTORY[productId] ?? [];
    const today = new Date();
    const points: MarketPricePoint[] = values.map((value, index) => {
      const day = new Date(today);
      day.setDate(today.getDate() - (values.length - 1 - index));
      return {
        id: `${productId}-${index}`,
        product_id: productId,
        price: value,
        observed_at: day.toISOString(),
      };
    });

    return { data: points, error: null };
  }
  const client = supabase;

  async function fetchHistoryRows(selectClause: string, orderByValidFrom: boolean) {
    let query = client
      .from("product_prices")
      .select(selectClause)
      .eq("product_id", productId);
    if (orderByValidFrom) {
      query = query.order("valid_from", { ascending: true });
    }
    return query.order("observed_at", { ascending: true }).limit(60);
  }

  let response = await fetchHistoryRows("id, product_id, price, observed_at, valid_from, valid_to", true);
  if (response.error && isMissingPriceQueryColumnError(response.error.message)) {
    response = await fetchHistoryRows("id, product_id, price, observed_at, valid_from", true);
  }
  if (response.error && isMissingPriceQueryColumnError(response.error.message)) {
    response = await fetchHistoryRows("id, product_id, price, observed_at", false);
  }

  if (response.error) {
    return { data: [], error: response.error.message };
  }

  const nowMs = Date.now();
  const points = (((response.data ?? []) as unknown) as PriceRow[])
    .map((row) => {
      const parsedPrice = parseNumber(row.price);
      if (parsedPrice === null) return null;
      const meta = rowToMeta(row);
      if (!meta || sessionTime(meta.priceSession) > nowMs) return null;
      return {
        id: row.id,
        product_id: row.product_id,
        price: parsedPrice,
        observed_at: meta.priceSession,
      };
    })
    .filter((row): row is MarketPricePoint => row !== null);

  return {
    data: points,
    error: null,
  };
}

export type ProductPriceSummary = {
  product_id: string;
  current_price: number | null;
  previous_price: number | null;
  price_delta: number | null;
  price_delta_percent: number | null;
  price_compare_label: string;
  price_compare_current_batch: string | null;
  price_compare_previous_batch: string | null;
  best_store_id: string | null;
  best_store_name: string | null;
  best_store_area: string | null;
  best_store_price: number | null;
};

export async function listProductPriceSummaries(): Promise<ServiceResult<Map<string, ProductPriceSummary>>> {
  if (!hasSupabaseEnv || !supabase) {
    return {
      data: new Map(
        FALLBACK_PRODUCTS.map((product) => [
          product.id,
          {
            product_id: product.id,
            current_price: product.current_price,
            previous_price: product.previous_price,
            price_delta: product.price_delta,
            price_delta_percent: product.price_delta_percent,
            price_compare_label: product.price_compare_label,
            price_compare_current_batch: product.price_compare_current_batch,
            price_compare_previous_batch: product.price_compare_previous_batch,
            best_store_id: product.best_store_id,
            best_store_name: product.best_store_name,
            best_store_area: product.best_store_area,
            best_store_price: product.best_store_price,
          },
        ]),
      ),
      error: null,
    };
  }
  const client = supabase;

  async function fetchSummaryRows(selectClause: string, orderByValidFrom: boolean) {
    return collectPagedRows<PriceRow, QueryError>(async (from, to) => {
      let query = client.from("product_prices").select(selectClause);
      if (orderByValidFrom) {
        query = query.order("valid_from", { ascending: false });
      }
      const response = await query
        .order("observed_at", { ascending: false })
        .order("id", { ascending: true })
        .range(from, to);
      return {
        data: ((response.data ?? []) as unknown) as PriceRow[],
        error: response.error,
      };
    });
  }

  let response = await fetchSummaryRows(
    "id, product_id, store_id, price, observed_at, valid_from, valid_to, stores(brand, name, area)",
    true,
  );
  if (response.error && isMissingPriceQueryColumnError(response.error.message)) {
    response = await fetchSummaryRows(
      "id, product_id, store_id, price, observed_at, valid_from, stores(name, area)",
      true,
    );
  }
  if (response.error && isMissingPriceQueryColumnError(response.error.message)) {
    response = await fetchSummaryRows(
      "id, product_id, store_id, price, observed_at, stores(name, area)",
      false,
    );
  }

  if (response.error) {
    return { data: new Map(), error: response.error.message };
  }

  const rows = response.data
    .map(rowToMeta)
    .filter((row): row is PriceRowWithMeta => row !== null);

  const byProduct = new Map<string, PriceRowWithMeta[]>();
  for (const row of rows) {
    const list = byProduct.get(row.product_id) ?? [];
    list.push(row);
    byProduct.set(row.product_id, list);
  }

  const summaries = new Map<string, ProductPriceSummary>();
  for (const [productId, productRows] of byProduct.entries()) {
    if (productRows.length === 0) {
      continue;
    }

    const bestBySession = new Map<string, PriceRowWithMeta>();

    for (const row of productRows) {
      const existing = bestBySession.get(row.priceSession);
      if (!existing || row.price < existing.price) {
        bestBySession.set(row.priceSession, row);
      }
    }

    const currentSession = getCurrentSaleSession(productRows);
    const previousSession = getPreviousVisibleSession(productRows, currentSession);

    if (!currentSession) {
      continue;
    }

    const currentBest = bestBySession.get(currentSession);
    const effectiveCurrentSession = currentSession;
    const effectivePreviousSession = previousSession;
    const previousBest = effectivePreviousSession ? bestBySession.get(effectivePreviousSession) : null;

    const currentPrice = currentBest?.price ?? null;
    const previousPrice = previousBest?.price ?? null;
    const delta = toPriceDelta(currentPrice, previousPrice);

    const currentLabel = effectiveCurrentSession ? buildSessionLabel(effectiveCurrentSession) : null;
    const previousLabel = effectivePreviousSession ? buildSessionLabel(effectivePreviousSession) : null;
    const comparisonLabel = formatComparisonLabel(currentLabel, previousLabel);

    summaries.set(productId, {
      product_id: productId,
      current_price: currentPrice,
      previous_price: previousPrice,
      price_delta: delta.priceDelta,
      price_delta_percent: delta.percentDelta,
      price_compare_label: comparisonLabel.includes("vs")
        ? `${comparisonLabel} (Current lowest: ${getStoreNameFromRow(currentBest)}, Last lowest: ${getStoreNameFromRow(previousBest)})`
        : comparisonLabel,
      price_compare_current_batch: currentLabel,
      price_compare_previous_batch: previousLabel,
      best_store_id: currentBest?.store_id ?? null,
      best_store_name: currentBest ? storeDisplayName(currentBest.stores) : null,
      best_store_area: currentBest?.stores?.area ?? null,
      best_store_price: currentBest?.price ?? null,
    });
  }

  return { data: summaries, error: null };
}

export async function listLatestStorePricesForProduct(
  productId: string,
): Promise<ServiceResult<MarketStorePrice[]>> {
  if (!productId.trim()) {
    return { data: [], error: "Product id is required." };
  }

  if (!hasSupabaseEnv || !supabase) {
    const product = FALLBACK_PRODUCTS.find((item) => item.id === productId);
    if (!product || product.current_price === null || !product.best_store_id || !product.best_store_name) {
      return { data: [], error: null };
    }
    const basePrice = product.best_store_price ?? product.current_price;
    const observedAt = new Date().toISOString();
    return {
      data: [
        {
          id: `${product.id}-${product.best_store_id}`,
          product_id: product.id,
          store_id: product.best_store_id,
          store_name: product.best_store_name,
          store_area: product.best_store_area,
          price: basePrice,
          observed_at: observedAt,
          previous_price: null,
          price_delta: null,
          price_delta_percent: null,
          comparison_label: "First tracked sale price",
          comparison_session_previous: null,
          comparison_session_current: "unknown",
        },
        {
          id: `${product.id}-mock-store-b`,
          product_id: product.id,
          store_id: "mock-store-b",
          store_name: "Market B",
          store_area: "Nearby",
          price: Number((basePrice * 1.06).toFixed(2)),
          observed_at: observedAt,
          previous_price: null,
          price_delta: null,
          price_delta_percent: null,
          comparison_label: "First tracked sale price",
          comparison_session_previous: null,
          comparison_session_current: "unknown",
        },
        {
          id: `${product.id}-mock-store-c`,
          product_id: product.id,
          store_id: "mock-store-c",
          store_name: "Fresh Club",
          store_area: "Weekly flyer",
          price: Number((basePrice * 1.12).toFixed(2)),
          observed_at: observedAt,
          previous_price: null,
          price_delta: null,
          price_delta_percent: null,
          comparison_label: "First tracked sale price",
          comparison_session_previous: null,
          comparison_session_current: "unknown",
        },
      ],
      error: null,
    };
  }
  const client = supabase;

  async function fetchStorePriceRows(selectClause: string, orderByValidFrom: boolean) {
    return collectPagedRows<PriceRow, QueryError>(async (from, to) => {
      let query = client
        .from("product_prices")
        .select(selectClause)
        .eq("product_id", productId);
      if (orderByValidFrom) {
        query = query.order("valid_from", { ascending: false });
      }
      const response = await query
        .order("observed_at", { ascending: false })
        .order("id", { ascending: true })
        .range(from, to);
      return {
        data: ((response.data ?? []) as unknown) as PriceRow[],
        error: response.error,
      };
    });
  }

  let response = await fetchStorePriceRows(
    "id, product_id, store_id, price, observed_at, valid_from, valid_to, stores(brand, name, area)",
    true,
  );
  if (response.error && isMissingPriceQueryColumnError(response.error.message)) {
    response = await fetchStorePriceRows(
      "id, product_id, store_id, price, observed_at, valid_from, stores(name, area)",
      true,
    );
  }
  if (response.error && isMissingPriceQueryColumnError(response.error.message)) {
    response = await fetchStorePriceRows(
      "id, product_id, store_id, price, observed_at, stores(name, area)",
      false,
    );
  }

  if (response.error) {
    return { data: [], error: response.error.message };
  }

  const rows = response.data.map(rowToMeta).filter((row): row is PriceRowWithMeta => row !== null);
  const currentSession = getCurrentSaleSession(rows);
  const previousSession = getPreviousVisibleSession(rows, currentSession);
  if (!currentSession) {
    return { data: [], error: null };
  }

  const byStore = new Map<
    string,
    {
      current?: PriceRowWithMeta;
      previous?: PriceRowWithMeta;
      latestSession?: string;
      storeName?: string;
      storeArea?: string | null;
    }
  >();

  for (const row of rows) {
    if (!row.store_id) continue;

    const storeState = byStore.get(row.store_id) ?? {};

    if (row.priceSession === currentSession) {
      storeState.current = row;
      storeState.latestSession = row.priceSession;
      storeState.storeName = storeDisplayName(row.stores);
      storeState.storeArea = row.stores?.area ?? null;
    } else if (row.priceSession === previousSession) {
      storeState.previous = row;
    }

    byStore.set(row.store_id, storeState);
  }

  const result: MarketStorePrice[] = [];
  for (const [storeId, state] of byStore.entries()) {
    if (!state.current) {
      continue;
    }

    const delta = toPriceDelta(state.current.price, state.previous?.price ?? null);
    const currentLabel = state.current.priceSession
      ? buildSessionLabel(state.current.priceSession)
      : null;
    const previousLabel = state.previous?.priceSession
      ? buildSessionLabel(state.previous.priceSession)
      : null;

    const comparisonLabel = state.previous
      ? `Current sale ${currentLabel} vs last sale ${previousLabel}`
      : `First tracked sale price${currentLabel ? ` (${currentLabel})` : ""}`;

    result.push({
      id: state.current.id,
      product_id: state.current.product_id,
      store_id: storeId,
      store_name: state.storeName ?? storeDisplayName(state.current.stores),
      store_area: state.storeArea ?? state.current.stores?.area ?? null,
      price: state.current.price,
      observed_at: state.current.observed_at,
      previous_price: state.previous?.price ?? null,
      price_delta: delta.priceDelta,
      price_delta_percent: delta.percentDelta,
      comparison_label: comparisonLabel,
      comparison_session_current: currentLabel,
      comparison_session_previous: previousLabel,
    });
  }

  return {
    data: result.sort((a, b) => a.price - b.price),
    error: null,
  };
}
