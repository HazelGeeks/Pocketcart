import { loadFamily } from "./family";
import {
  type FreezerItemDraft,
  type FreezerStorageArea,
  validateFreezerItemDraft,
} from "../utils/freezerItem";
import { hasSupabaseEnv, supabase } from "./supabaseClient";
import { collectPagedRows } from "../utils/paginatedQuery";

export type MyFreezerItem = {
  id: string;
  user_id: string;
  family_id?: string | null;
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
  "id, user_id, family_id, name, storage_area, quantity, unit, expires_on, note, created_at, updated_at";

async function freezerScope(userId: string, expectedFamilyId?: string | null) {
  if (!hasSupabaseEnv || !supabase) return { familyId: null, error: "Supabase is not configured." };
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || (!data.user || data.user.id !== userId)) return { familyId: null, error: "Please sign in first." };
    const familyId = (await loadFamily())?.id ?? null;
    if (expectedFamilyId !== undefined && expectedFamilyId !== familyId) return { familyId, error: "Your family changed. Reopen My Freezer and try again." };
    return { familyId, error: null };
  } catch { return { familyId: null, error: "Could not check your family. Please refresh and try again." }; }
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
  const scope = await freezerScope(userId);
  if (scope.error || !supabase) return { data: [], error: scope.error };

  const client = supabase;
  const { data, error } = await collectPagedRows<MyFreezerItem, { message?: string; code?: string }>(async (from, to) => {
    const query = client.from("freezer_items").select(SELECT_FIELDS);
    const scoped = scope.familyId ? query.eq("family_id", scope.familyId) : query.is("family_id", null).eq("user_id", userId);
    return await scoped
    .order("storage_area", { ascending: true })
    .order("expires_on", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .range(from, to);
  });

  return {
    data: (data ?? []) as MyFreezerItem[],
    error: freezerError(error),
  };
}

export async function saveMyFreezerItem(params: {
  userId: string;
  expectedFamilyId?: string | null;
  expectedUpdatedAt?: string;
  itemId?: string;
  creationId?: string;
  draft: FreezerItemDraft;
}): Promise<ServiceResult<MyFreezerItem | null>> {
  const scope = await freezerScope(params.userId, params.expectedFamilyId);
  if (scope.error || !supabase) return { data: null, error: scope.error };
  const validated = validateFreezerItemDraft(params.draft);
  if (!validated.ok) return { data: null, error: validated.error };

  const payload = {
    name: validated.value.name,
    storage_area: validated.value.storageArea,
    quantity: validated.value.quantity,
    unit: validated.value.unit,
    expires_on: validated.value.expiresOn,
    note: validated.value.note,
    updated_at: new Date().toISOString(),
  };

  const ownedPayload = { ...payload, user_id: params.userId, family_id: scope.familyId };
  const client = supabase;
  const query = (() => {
    if (params.itemId) {
      let update = client.from("freezer_items").update(payload).eq("id", params.itemId);
      if (params.expectedUpdatedAt) update = update.eq("updated_at", params.expectedUpdatedAt);
      return scope.familyId ? update.eq("family_id", scope.familyId) : update.is("family_id", null).eq("user_id", params.userId);
    }
    return params.creationId
      ? client.from("freezer_items").upsert({ ...ownedPayload, id: params.creationId }, { onConflict: "id" })
      : client.from("freezer_items").insert(ownedPayload);
  })();
  const { data, error } = await query.select(SELECT_FIELDS).single();

  return {
    data: (data as MyFreezerItem | null) ?? null,
    error: error?.code === "PGRST116" ? "This food was changed or removed. Refresh My Freezer before editing again." : freezerError(error),
  };
}

export async function deleteMyFreezerItem(
  userId: string,
  itemId: string,
): Promise<string | null> {
  const scope = await freezerScope(userId);
  if (scope.error || !supabase) return scope.error;
  const query = supabase.from("freezer_items").delete().eq("id", itemId);
  const { error } = await (scope.familyId ? query.eq("family_id", scope.familyId) : query.is("family_id", null).eq("user_id", userId));
  return freezerError(error);
}
