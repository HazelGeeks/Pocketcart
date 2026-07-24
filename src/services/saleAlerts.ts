import {
  listLatestStorePricesForProduct,
  listProducts,
  type MarketStorePrice,
} from "./marketData";
import { listSyncedFavoriteStoreIds } from "./favoriteStores";
import { hasSupabaseEnv, supabase } from "./supabaseClient";
import type { WatchlistItem } from "./watchlist";
import {
  buildSaleAlertCandidates,
  type SaleAlertCandidate,
} from "../utils/saleAlertRules";

export type SaleAlert = {
  id: string;
  user_id: string;
  watchlist_item_id: string | null;
  product_id: string | null;
  store_id: string | null;
  alert_key: string;
  title: string;
  body: string;
  sale_price: number | null;
  previous_price: number | null;
  sale_started_at: string | null;
  push_sent_at: string | null;
  read_at: string | null;
  created_at: string;
};

type ServiceResult<T> = {
  data: T;
  error: string | null;
};

export type SaleAlertSyncResult = {
  alerts: SaleAlert[];
  created: SaleAlert[];
};

const SALE_ALERT_SELECT =
  "id, user_id, watchlist_item_id, product_id, store_id, alert_key, title, body, sale_price, previous_price, sale_started_at, push_sent_at, read_at, created_at";
const SALE_ALERT_SCHEMA_ERROR =
  "Sale alerts table is missing. Run the sale_alerts migration in Supabase, then retry.";

function missingEnvResult<T>(fallback: T): ServiceResult<T> {
  return {
    data: fallback,
    error: "Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.",
  };
}

function isMissingSaleAlertsTable(message?: string | null): boolean {
  const text = message?.toLowerCase() ?? "";
  return (
    text.includes("sale_alerts") &&
    (text.includes("does not exist") ||
      text.includes("could not find") ||
      text.includes("schema cache") ||
      text.includes("pgrst204"))
  );
}

function isAuthSessionMissing(message?: string | null): boolean {
  const text = message?.toLowerCase() ?? "";
  return text.includes("auth session missing") || text.includes("session not found");
}

async function getAuthedUserId(): Promise<ServiceResult<string | null>> {
  if (!hasSupabaseEnv || !supabase) return missingEnvResult(null);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    if (isAuthSessionMissing(error.message)) {
      return { data: null, error: "Please sign in first." };
    }
    return { data: null, error: error.message };
  }

  if (!user) return { data: null, error: "Please sign in first." };
  return { data: user.id, error: null };
}

function candidateToPayload(userId: string, candidate: SaleAlertCandidate) {
  return {
    user_id: userId,
    watchlist_item_id: candidate.watchlistItemId,
    product_id: candidate.productId,
    store_id: candidate.storeId,
    alert_key: candidate.alertKey,
    title: candidate.title,
    body: candidate.body,
    sale_price: candidate.salePrice,
    previous_price: candidate.previousPrice,
    sale_started_at: candidate.saleStartedAt,
  };
}

async function listSaleAlerts(): Promise<ServiceResult<SaleAlert[]>> {
  if (!hasSupabaseEnv || !supabase) return missingEnvResult([]);

  const { data: userId, error: userError } = await getAuthedUserId();
  if (userError || !userId) {
    return { data: [], error: userError ?? "Please sign in first." };
  }

  const { data, error } = await supabase
    .from("sale_alerts")
    .select(SALE_ALERT_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return {
      data: [],
      error: isMissingSaleAlertsTable(error.message) ? SALE_ALERT_SCHEMA_ERROR : error.message,
    };
  }

  return { data: (data ?? []) as SaleAlert[], error: null };
}

export async function syncSaleAlertsForWatchlist(
  watchlistItems: WatchlistItem[],
): Promise<ServiceResult<SaleAlertSyncResult>> {
  const fallback = { alerts: [], created: [] };
  if (!hasSupabaseEnv || !supabase) return missingEnvResult(fallback);

  const { data: userId, error: userError } = await getAuthedUserId();
  if (userError || !userId) {
    return { data: fallback, error: userError ?? "Please sign in first." };
  }

  if (watchlistItems.length === 0) {
    const alerts = await listSaleAlerts();
    return {
      data: { alerts: alerts.data, created: [] },
      error: alerts.error,
    };
  }

  const favoriteStores = await listSyncedFavoriteStoreIds(userId);
  const products = await listProducts({
    preferredStoreIds: favoriteStores.data,
  });
  if (products.error) {
    return { data: fallback, error: products.error };
  }
  let preferredStorePrices: MarketStorePrice[] = [];
  const productIds = [
    ...new Set(
      watchlistItems.flatMap((item) => item.product_id ? [item.product_id] : []),
    ),
  ];
  if (productIds.length > 0) {
    const priceResults = await Promise.all(
      productIds.map((productId) => listLatestStorePricesForProduct(productId)),
    );
    preferredStorePrices = priceResults.flatMap((result) => result.data);
  }

  const candidates = buildSaleAlertCandidates({
    favoriteStoreIds: favoriteStores.data,
    preferredStorePrices,
    watchlistItems,
    products: products.data,
  });

  if (candidates.length === 0) {
    const alerts = await listSaleAlerts();
    return {
      data: { alerts: alerts.data, created: [] },
      error: alerts.error,
    };
  }

  const keys = candidates.map((candidate) => candidate.alertKey);
  const existing = await supabase
    .from("sale_alerts")
    .select("alert_key")
    .eq("user_id", userId)
    .in("alert_key", keys);

  if (existing.error) {
    return {
      data: fallback,
      error: isMissingSaleAlertsTable(existing.error.message)
        ? SALE_ALERT_SCHEMA_ERROR
        : existing.error.message,
    };
  }

  const existingKeys = new Set(((existing.data ?? []) as Array<{ alert_key: string }>).map((row) => row.alert_key));
  const payloads = candidates
    .filter((candidate) => !existingKeys.has(candidate.alertKey))
    .map((candidate) => candidateToPayload(userId, candidate));

  let created: SaleAlert[] = [];
  if (payloads.length > 0) {
    const inserted = await supabase
      .from("sale_alerts")
      .upsert(payloads, {
        onConflict: "user_id,alert_key",
        ignoreDuplicates: true,
      })
      .select(SALE_ALERT_SELECT);

    if (inserted.error) {
      return {
        data: fallback,
        error: isMissingSaleAlertsTable(inserted.error.message)
          ? SALE_ALERT_SCHEMA_ERROR
          : inserted.error.message,
      };
    }
    created = (inserted.data ?? []) as SaleAlert[];
  }

  const alerts = await listSaleAlerts();
  return {
    data: { alerts: alerts.data, created },
    error: alerts.error,
  };
}

export async function markSaleAlertsRead(): Promise<ServiceResult<null>> {
  if (!hasSupabaseEnv || !supabase) return missingEnvResult(null);

  const { data: userId, error: userError } = await getAuthedUserId();
  if (userError || !userId) {
    return { data: null, error: userError ?? "Please sign in first." };
  }

  const { error } = await supabase
    .from("sale_alerts")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);

  return {
    data: null,
    error: error
      ? isMissingSaleAlertsTable(error.message)
        ? SALE_ALERT_SCHEMA_ERROR
        : error.message
      : null,
  };
}
