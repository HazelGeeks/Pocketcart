import type { ShoppingListItem } from "../utils/shoppingListState";
import { hasSupabaseEnv, supabase } from "./supabaseClient";

type ServiceResult<T> = {
  data: T;
  error: string | null;
};

type ShoppingListRow = {
  user_id: string;
  product_id: string;
  name: string;
  unit: string | null;
  quantity: number;
};

async function validateUser(userId: string): Promise<string | null> {
  if (!hasSupabaseEnv || !supabase) return "Supabase is not configured.";
  const { data, error } = await supabase.auth.getUser();
  if (error) return error.message;
  if (!data.user || data.user.id !== userId) return "Please sign in first.";
  return null;
}

export async function listSyncedShoppingListItems(
  userId: string,
): Promise<ServiceResult<ShoppingListItem[]>> {
  const authError = await validateUser(userId);
  if (authError || !supabase) return { data: [], error: authError };

  const { data, error } = await supabase
    .from("shopping_list_items")
    .select("user_id, product_id, name, unit, quantity")
    .eq("user_id", userId)
    .order("updated_at", { ascending: true });

  const rows = (data ?? []) as ShoppingListRow[];
  return {
    data: rows.map((row) => ({
      productId: row.product_id,
      name: row.name,
      unit: row.unit,
      quantity: Math.max(1, Math.min(99, Math.round(Number(row.quantity) || 1))),
    })),
    error: error?.message ?? null,
  };
}

export async function replaceSyncedShoppingListItems(
  userId: string,
  items: ShoppingListItem[],
): Promise<string | null> {
  const authError = await validateUser(userId);
  if (authError || !supabase) return authError;

  if (items.length > 0) {
    const { error } = await supabase.from("shopping_list_items").upsert(
      items.map((item) => ({
        user_id: userId,
        product_id: item.productId,
        name: item.name,
        unit: item.unit,
        quantity: item.quantity,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: "user_id,product_id" },
    );
    if (error) return error.message;
  }

  let deleteQuery = supabase
    .from("shopping_list_items")
    .delete()
    .eq("user_id", userId);

  if (items.length > 0) {
    deleteQuery = deleteQuery.not(
      "product_id",
      "in",
      `(${items.map((item) => item.productId).join(",")})`,
    );
  }

  const { error: deleteError } = await deleteQuery;
  return deleteError?.message ?? null;
}
