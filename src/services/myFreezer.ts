import {
  type FreezerItemDraft,
  type FreezerStorageArea,
  validateFreezerItemDraft,
} from "../utils/freezerItem";
import { hasSupabaseEnv, supabase } from "./supabaseClient";

export type MyFreezerItem = {
  id: string;
  user_id: string;
  name: string;
  storage_area: FreezerStorageArea;
  quantity: number;
  unit: string | null;
  expires_on: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

type ServiceResult<T> = { data: T; error: string | null };

const SELECT_FIELDS =
  "id, user_id, name, storage_area, quantity, unit, expires_on, note, created_at, updated_at";

async function validateUser(userId: string): Promise<string | null> {
  if (!hasSupabaseEnv || !supabase) return "Supabase is not configured.";
  const { data, error } = await supabase.auth.getUser();
  if (error) return error.message;
  if (!data.user || data.user.id !== userId) return "Please sign in first.";
  return null;
}

function freezerError(error: { code?: string; message?: string } | null): string | null {
  if (!error) return null;
  const normalized = error.message?.toLowerCase() ?? "";
  if (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    normalized.includes("could not find the table")
  ) {
    return "My Freezer is waiting for its database update. Please try again after deployment.";
  }
  return error.message ?? "My Freezer could not be updated.";
}

export async function listMyFreezerItems(
  userId: string,
): Promise<ServiceResult<MyFreezerItem[]>> {
  const authError = await validateUser(userId);
  if (authError || !supabase) return { data: [], error: authError };

  const { data, error } = await supabase
    .from("freezer_items")
    .select(SELECT_FIELDS)
    .eq("user_id", userId)
    .order("storage_area", { ascending: true })
    .order("expires_on", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  return {
    data: (data ?? []) as MyFreezerItem[],
    error: freezerError(error),
  };
}

export async function saveMyFreezerItem(params: {
  userId: string;
  itemId?: string;
  draft: FreezerItemDraft;
}): Promise<ServiceResult<MyFreezerItem | null>> {
  const authError = await validateUser(params.userId);
  if (authError || !supabase) return { data: null, error: authError };
  const validated = validateFreezerItemDraft(params.draft);
  if (!validated.ok) return { data: null, error: validated.error };

  const payload = {
    user_id: params.userId,
    name: validated.value.name,
    storage_area: validated.value.storageArea,
    quantity: validated.value.quantity,
    unit: validated.value.unit,
    expires_on: validated.value.expiresOn,
    note: validated.value.note,
    updated_at: new Date().toISOString(),
  };

  const query = params.itemId
    ? supabase
        .from("freezer_items")
        .update(payload)
        .eq("id", params.itemId)
        .eq("user_id", params.userId)
    : supabase.from("freezer_items").insert(payload);
  const { data, error } = await query.select(SELECT_FIELDS).single();

  return {
    data: (data as MyFreezerItem | null) ?? null,
    error: freezerError(error),
  };
}

export async function deleteMyFreezerItem(
  userId: string,
  itemId: string,
): Promise<string | null> {
  const authError = await validateUser(userId);
  if (authError || !supabase) return authError;
  const { error } = await supabase
    .from("freezer_items")
    .delete()
    .eq("id", itemId)
    .eq("user_id", userId);
  return freezerError(error);
}
