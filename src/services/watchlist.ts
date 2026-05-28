import { hasSupabaseEnv, supabase } from "./supabaseClient";

export type WatchlistItem = {
  id: string;
  user_id: string;
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
    .select("id, user_id, name, store, target_price, latest_price, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return {
    data: data ?? [],
    error: error ? error.message : null,
  };
}

export async function addWatchlistItem(params: {
  name: string;
  store: string;
  targetPrice?: string;
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
    name: params.name,
    store: params.store,
    target_price: params.targetPrice?.trim() ? params.targetPrice.trim() : null,
  };

  const { data, error } = await supabase
    .from("watchlist_items")
    .insert(payload)
    .select("id, user_id, name, store, target_price, latest_price, created_at")
    .single();

  return {
    data: data ?? null,
    error: error ? error.message : null,
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
