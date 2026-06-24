import { hasSupabaseEnv, supabase } from "../supabaseClient";
import { FALLBACK_PRICE_HISTORY, FALLBACK_PRODUCTS } from "./fallbacks";
import { missingEnvResult, parseNumber } from "./shared";
import type { MarketPricePoint, MarketStorePrice, PriceRow, ServiceResult } from "./types";

type PriceDeltaInfo = {
  previousPrice: number | null;
  priceDelta: number | null;
  percentDelta: number | null;
};

type PriceRowWithMeta = PriceRow & {
  price: number;
  priceSession: string;
};

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
    return "Overall sale cycle: current batch only";
  }

  return `Across stores sale-cycle: ${currentLabel} vs ${previousLabel}`;
}

function getStoreNameFromRow(row: PriceRowWithMeta | undefined | null): string {
  return row?.stores?.name ?? "Unknown store";
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

  const { data, error } = await supabase
    .from("product_prices")
    .select("id, product_id, price, observed_at")
    .eq("product_id", productId)
    .order("observed_at", { ascending: true })
    .limit(60);

  if (error) {
    return { data: [], error: error.message };
  }

  const points = ((data ?? []) as PriceRow[])
    .map((row) => {
      const parsedPrice = parseNumber(row.price);
      if (parsedPrice === null) return null;
      return {
        id: row.id,
        product_id: row.product_id,
        price: parsedPrice,
        observed_at: row.observed_at,
      };
    })
    .filter((row): row is MarketPricePoint => row !== null);

  return {
    data: points,
    error: null,
  };
}

export async function listLatestPricesByProduct(): Promise<ServiceResult<Map<string, number>>> {
  if (!hasSupabaseEnv || !supabase) {
    return { data: new Map(), error: null };
  }

  const latestPriceQuery = await supabase
    .from("product_prices")
    .select("id, product_id, price, observed_at")
    .order("observed_at", { ascending: false })
    .limit(3000);

  const latestByProduct = new Map<string, number>();
  if (!latestPriceQuery.error) {
    const priceRows = (latestPriceQuery.data ?? []) as PriceRow[];
    for (const row of priceRows) {
      if (latestByProduct.has(row.product_id)) continue;
      const parsedPrice = parseNumber(row.price);
      if (parsedPrice === null) continue;
      latestByProduct.set(row.product_id, parsedPrice);
    }
  }

  return {
    data: latestByProduct,
    error: latestPriceQuery.error ? latestPriceQuery.error.message : null,
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

  const { data, error } = await supabase
    .from("product_prices")
    .select("id, product_id, store_id, price, observed_at, valid_from, stores(name, area)")
    .order("valid_from", { ascending: false })
    .order("observed_at", { ascending: false })
    .limit(5000);

  if (error) {
    return { data: new Map(), error: error.message };
  }

  const rows = ((data ?? []) as PriceRow[])
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

    const sessionsInOrder: string[] = [];
    const seenSessions = new Set<string>();
    const bestBySession = new Map<string, PriceRowWithMeta>();

    for (const row of productRows) {
      if (!seenSessions.has(row.priceSession)) {
        seenSessions.add(row.priceSession);
        sessionsInOrder.push(row.priceSession);
      }

      const existing = bestBySession.get(row.priceSession);
      if (!existing || row.price < existing.price) {
        bestBySession.set(row.priceSession, row);
      }
    }

    const currentSession = sessionsInOrder[0] ?? null;
    const previousSession = sessionsInOrder[1] ?? null;

    const currentBest = currentSession ? bestBySession.get(currentSession) : null;
    const previousBest = previousSession ? bestBySession.get(previousSession) : null;

    const currentPrice = currentBest?.price ?? null;
    const previousPrice = previousBest?.price ?? null;
    const delta = toPriceDelta(currentPrice, previousPrice);

    const currentLabel = currentSession ? buildSessionLabel(currentSession) : null;
    const previousLabel = previousSession ? buildSessionLabel(previousSession) : null;
    const comparisonLabel = formatComparisonLabel(currentLabel, previousLabel);

    summaries.set(productId, {
      product_id: productId,
      current_price: currentPrice,
      previous_price: previousPrice,
      price_delta: delta.priceDelta,
      price_delta_percent: delta.percentDelta,
      price_compare_label: comparisonLabel.includes("vs")
        ? `${comparisonLabel} (Current best: ${getStoreNameFromRow(currentBest)}, Previous best: ${getStoreNameFromRow(previousBest)})`
        : comparisonLabel,
      price_compare_current_batch: currentLabel,
      price_compare_previous_batch: previousLabel,
      best_store_id: currentBest?.store_id ?? null,
      best_store_name: currentBest?.stores?.name ?? null,
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
          comparison_label: "Store sale-cycle: current batch only",
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
          comparison_label: "Store sale-cycle: current batch only",
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
          comparison_label: "Store sale-cycle: current batch only",
          comparison_session_previous: null,
          comparison_session_current: "unknown",
        },
      ],
      error: null,
    };
  }

  const { data, error } = await supabase
    .from("product_prices")
    .select("id, product_id, store_id, price, observed_at, valid_from, stores(name, area)")
    .eq("product_id", productId)
    .order("valid_from", { ascending: false })
    .order("observed_at", { ascending: false })
    .limit(300);

  if (error) {
    return { data: [], error: error.message };
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

  for (const row of ((data ?? []) as PriceRow[]).map(rowToMeta).filter((row): row is PriceRowWithMeta => row !== null)) {
    if (!row.store_id) continue;

    const storeState = byStore.get(row.store_id) ?? {};

    if (!storeState.current) {
      storeState.current = row;
      storeState.latestSession = row.priceSession;
      storeState.storeName = row.stores?.name ?? "Unknown store";
      storeState.storeArea = row.stores?.area ?? null;
    } else if (!storeState.previous && row.priceSession !== storeState.latestSession) {
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
      ? `Store sale-cycle: ${currentLabel} vs ${previousLabel}`
      : `Store sale-cycle: ${currentLabel ?? "unknown"} (only one cycle available)`;

    result.push({
      id: state.current.id,
      product_id: state.current.product_id,
      store_id: storeId,
      store_name: state.storeName ?? state.current.stores?.name ?? "Unknown store",
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

export async function createProductPrice(params: {
  productId: string;
  storeId: string;
  price: string;
  observedAt: string;
}): Promise<ServiceResult<MarketPricePoint | null>> {
  if (!hasSupabaseEnv || !supabase) return missingEnvResult(null);

  if (!params.productId.trim() || !params.storeId.trim()) {
    return { data: null, error: "Product ID and Store ID are required." };
  }

  const price = parseNumber(params.price);
  if (price === null) {
    return { data: null, error: "Price must be a valid number." };
  }

  let observedAt = new Date().toISOString();
  const observedAtInput = params.observedAt?.trim();
  if (observedAtInput) {
    const parsed = new Date(observedAtInput);
    if (Number.isNaN(parsed.getTime())) {
      return { data: null, error: "Observed date must be a valid date string." };
    }
    observedAt = parsed.toISOString();
  }

  const payload = {
    product_id: params.productId.trim(),
    store_id: params.storeId.trim(),
    price,
    valid_from: observedAt,
    valid_to: null,
    observed_at: observedAt,
  };

  const { data, error } = await supabase
    .from("product_prices")
    .insert(payload)
    .select("id, product_id, price, observed_at")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  const row = data as PriceRow;
  return {
    data: {
      id: row.id,
      product_id: row.product_id,
      price: parseNumber(row.price) ?? price,
      observed_at: row.observed_at,
    },
    error: null,
  };
}
