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

  const payload = {
    user_id: userId,
    product_id: params.productId?.trim() ? params.productId.trim() : null,
    store_id: params.storeId?.trim() ? params.storeId.trim() : null,
    name: params.name,
    store: params.store,
    target_price: params.targetPrice?.trim() ? params.targetPrice.trim() : null,
  };

  let missingProductStoreColumns = false;

  if (payload.product_id) {
    const existing = await supabase
      .from("watchlist_items")
      .select("id")
      .eq("user_id", userId)
      .eq("product_id", payload.product_id)
      .limit(1)
      .maybeSingle();

    if (existing.error) {
      if (isWatchlistSchemaError(existing.error.message)) {
        missingProductStoreColumns = true;
      } else {
        return { data: null, error: existing.error.message };
      }
    } else if (existing.data?.id) {
      const { data, error } = await supabase
        .from("watchlist_items")
        .update(payload)
        .eq("id", existing.data.id)
        .eq("user_id", userId)
        .select(WATCHLIST_FIELD_SELECT)
        .single();

      if (!error) {
        return {
          data: data ?? null,
          error: null,
        };
      }

      if (isWatchlistSchemaError(error.message)) {
        missingProductStoreColumns = true;
        const legacyUpdated = await supabase
          .from("watchlist_items")
          .update({
            name: payload.name,
            store: payload.store,
            target_price: payload.target_price,
          })
          .eq("id", existing.data.id)
          .eq("user_id", userId)
          .select(WATCHLIST_FIELD_SELECT_LEGACY)
          .single();

        if (legacyUpdated.error) {
          return { data: null, error: legacyUpdated.error.message };
        }

        return {
          data: normalizeLegacyWatchlistRow(legacyUpdated.data as Record<string, unknown>),
          error: null,
        };
      }

      return { data: null, error: error.message };
    }
  }

  if (!missingProductStoreColumns) {
    const { data, error } = await supabase
      .from("watchlist_items")
      .insert(payload)
      .select(WATCHLIST_FIELD_SELECT)
      .single();

    if (!error) {
      return {
        data: data ?? null,
        error: null,
      };
    }

    if (!isWatchlistSchemaError(error.message)) {
      return { data: null, error: error.message };
    }

    missingProductStoreColumns = true;
  }

  const legacyInsert = await supabase
    .from("watchlist_items")
    .insert({
      user_id: payload.user_id,
      name: payload.name,
      store: payload.store,
      target_price: payload.target_price,
      latest_price: null,
    })
    .select(WATCHLIST_FIELD_SELECT_LEGACY)
    .single();

  if (legacyInsert.error) {
    return { data: null, error: legacyInsert.error.message };
  }

  return {
    data: normalizeLegacyWatchlistRow(legacyInsert.data as Record<string, unknown>),
    error: null,
  };
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
