import { normalizeFavoriteStoreIds } from "../utils/favoriteStoreState";
import { hasSupabaseEnv, supabase } from "./supabaseClient";

type ServiceResult<T> = {
  data: T;
  error: string | null;
};

type FavoriteStoreRow = {
  store_id: string;
};

async function validateUser(userId: string): Promise<string | null> {
  if (!hasSupabaseEnv || !supabase) return "Supabase is not configured.";
  const { data, error } = await supabase.auth.getUser();
  if (error) return error.message;
  if (!data.user || data.user.id !== userId) return "Please sign in first.";
  return null;
}

export async function listSyncedFavoriteStoreIds(
  userId: string,
): Promise<ServiceResult<string[]>> {
  const authError = await validateUser(userId);
  if (authError || !supabase) return { data: [], error: authError };

  const { data, error } = await supabase
    .from("user_favorite_stores")
    .select("store_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  return {
    data: normalizeFavoriteStoreIds(
      ((data ?? []) as FavoriteStoreRow[]).map((row) => row.store_id),
    ),
    error: error?.message ?? null,
  };
}

export async function replaceSyncedFavoriteStoreIds(
  userId: string,
  storeIds: string[],
): Promise<string | null> {
  const authError = await validateUser(userId);
  if (authError || !supabase) return authError;

  const normalizedIds = normalizeFavoriteStoreIds(storeIds);
  if (normalizedIds.length > 0) {
    const { error } = await supabase.from("user_favorite_stores").upsert(
      normalizedIds.map((storeId) => ({
        user_id: userId,
        store_id: storeId,
      })),
      {
        onConflict: "user_id,store_id",
        ignoreDuplicates: true,
      },
    );
    if (error) return error.message;
  }

  let deleteQuery = supabase
    .from("user_favorite_stores")
    .delete()
    .eq("user_id", userId);

  if (normalizedIds.length > 0) {
    deleteQuery = deleteQuery.not(
      "store_id",
      "in",
      `(${normalizedIds.join(",")})`,
    );
  }

  const { error } = await deleteQuery;
  return error?.message ?? null;
}
