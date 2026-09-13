import { hasSupabaseEnv, supabase } from "./supabaseClient";

export type WatchlistItem = {
  id: string;
  user_id: string;
  product_id: string | null;
  store_id: string | null;
  name: string;
  store: string;
  target_price: string | null;
  latest_price: string | null;
  created_at: string;
};

type ServiceResult<T> = {
  data: T;
  error: string | null;
};

const WATCHLIST_FIELD_SELECT =
  "id, user_id, product_id, store_id, name, store, target_price, latest_price, created_at";
const WATCHLIST_FIELD_SELECT_LEGACY =
  "id, user_id, name, store, target_price, latest_price, created_at";

function isWatchlistSchemaError(message?: string | null): boolean {
  const normalized = message?.toLowerCase() ?? "";
  return (
    (normalized.includes("watchlist_items") || normalized.includes("watchlist_itmes")) &&
    normalized.includes("does not exist") &&
    (normalized.includes("product_id") || normalized.includes("store_id"))
  );
}

function isAuthSessionMissing(message?: string | null): boolean {
  const normalized = message?.toLowerCase() ?? "";
  return (
    normalized.includes("auth session missing") ||
    normalized.includes("session not found")
  );
}

function missingEnvResult<T>(fallback: T): ServiceResult<T> {
  return {
    data: fallback,
    error: "Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.",
  };
}

function normalizeLegacyWatchlistRow(
  row: Record<string, unknown>,
): WatchlistItem {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    product_id: null,
    store_id: null,
    name: String(row.name),
    store: String(row.store),
    target_price: (row.target_price as string | null) ?? null,
    latest_price: (row.latest_price as string | null) ?? null,
    created_at: String(row.created_at),
  };
}

async function getAuthedUserId(): Promise<ServiceResult<string | null>> {
  if (!hasSupabaseEnv || !supabase) {
    return missingEnvResult(null);
  }

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

  if (!user) {
    return { data: null, error: "Please sign in first." };
  }

  return { data: user.id, error: null };
}

export async function listWatchlistItems(): Promise<ServiceResult<WatchlistItem[]>> {
  if (!hasSupabaseEnv || !supabase) {
    return missingEnvResult([]);
  }

  const { data: userId, error: userError } = await getAuthedUserId();
  if (userError || !userId) {
    return { data: [], error: userError ?? "Please sign in first." };
  }

  const { data, error } = await supabase
    .from("watchlist_items")
    .select(WATCHLIST_FIELD_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error && isWatchlistSchemaError(error.message)) {
    const legacy = await supabase
      .from("watchlist_items")
      .select(WATCHLIST_FIELD_SELECT_LEGACY)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (legacy.error) {
      return {
        data: [],
        error: legacy.error.message,
      };
    }

    const legacyData = (legacy.data ?? []) as Record<string, unknown>[];

    return {
      data: legacyData.map(normalizeLegacyWatchlistRow),
      error: null,
    };
  }

  return {
    data: data ?? [],
    error: error ? error.message : null,
  };
}

export async function addWatchlistItem(params: {
  name: string;
  store: string;
  targetPrice?: string;
  productId?: string;
  storeId?: string | null;
}): Promise<ServiceResult<WatchlistItem | null>> {
  if (!hasSupabaseEnv || !supabase) {
    return missingEnvResult(null);
  }

  const { data: userId, error: userError } = await getAuthedUserId();
  if (userError || !userId) {
    return { data: null, error: userError ?? "Please sign in first." };
  }

  const result = await watchlistRequest({ action: "add", item: params });
  const saved = result.data?.data;
  return { data: (Array.isArray(saved) ? saved[0] : saved) ?? null, error: result.error };

}

export async function removeWatchlistItem(
  itemId: string,
): Promise<ServiceResult<null>> {
  if (!hasSupabaseEnv || !supabase) {
    return missingEnvResult(null);
  }

  const { data: userId, error: userError } = await getAuthedUserId();
  if (userError || !userId) {
    return { data: null, error: userError ?? "Please sign in first." };
  }

  const { error } = await supabase
    .from("watchlist_items")
    .delete()
    .eq("id", itemId)
    .eq("user_id", userId);

  return {
    data: null,
    error: error ? error.message : null,
  };
}

async function watchlistRequest(body: Record<string, unknown>): Promise<ServiceResult<any>> {
  if (!supabase) return missingEnvResult(null);
  try {
    const { data, error } = await supabase.functions.invoke("watchlist-access", { body });
    if (error) {
      const detail = await error.context?.json?.().catch(() => null);
      return { data: null, error: detail?.error ?? "Could not check your alert plan. Please try again." };
    }
    return { data, error: data?.error ?? null };
  } catch { return { data: null, error: "Could not check your alert plan. Please try again." }; }
}
export async function getWatchlistAccess(): Promise<ServiceResult<{ items: WatchlistItem[]; activeIds: string[]; isPlus: boolean } | null>> {
  const auth = await getAuthedUserId();
  if (auth.error) return { data: null, error: auth.error };
  return watchlistRequest({ action: "status" });
}
