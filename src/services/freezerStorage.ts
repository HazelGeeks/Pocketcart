import { validateStorageAppearance, type StorageAppearance } from "../utils/freezerStorageAppearance";
import type { FreezerStorageArea } from "../utils/freezerItem";
import { validateStorageName } from "../utils/freezerStorage";
import { collectPagedRows } from "../utils/paginatedQuery";
import { freezerError, freezerScope } from "./myFreezer";
import { supabase } from "./supabaseClient";

export type FreezerStorageUnit = {
  id: string;
  name: string;
  emoji?: string | null;
  color?: string;
  storage_area: FreezerStorageArea;
  user_id: string | null;
  family_id: string | null;
  updated_at: string;
};
const LEGACY_FIELDS = "id, name, storage_area, user_id, family_id, updated_at";
const FIELDS = `${LEGACY_FIELDS}, emoji, color`;
function missingAppearance(error: { code?: string; message?: string } | null) {
  return Boolean(error && ["42703", "PGRST204"].includes(error.code ?? "") && /emoji|color/.test(error.message ?? ""));
}

export async function listFreezerStorage(userId: string, expectedFamilyId: string | null) {
  const scope = await freezerScope(userId, expectedFamilyId);
  if (scope.error || !supabase) return { data: [] as FreezerStorageUnit[], error: scope.error };
  const client = supabase;
  const read = (fields: string) => collectPagedRows<FreezerStorageUnit, { code?: string; message?: string }>(async (from, to) => {
    const query = client.from("freezer_storage_units").select(fields);
    const result = await (scope.familyId ? query.eq("family_id", scope.familyId) : query.is("family_id", null).eq("user_id", userId))
      .order("created_at").order("id").range(from, to);
    return { data: result.data as unknown as FreezerStorageUnit[] | null, error: result.error };
  });
  let result = await read(FIELDS);
  if (missingAppearance(result.error)) result = await read(LEGACY_FIELDS);
  return { data: result.data ?? [], error: freezerError(result.error) };
}

export async function saveFreezerStorage(params: {
  userId: string; expectedFamilyId: string | null; name: string;
  area: FreezerStorageArea; creationId: string; unit?: FreezerStorageUnit; appearance?: StorageAppearance;
}) {
  const valid = validateStorageName(params.name, params.area);
  if (!valid.ok) return { data: null, error: valid.error };
  if (params.appearance) {
    const appearance = validateStorageAppearance(params.appearance);
    if (!appearance.ok) return { data: null, error: appearance.error };
  }
  const scope = await freezerScope(params.userId, params.expectedFamilyId);
  if (scope.error || !supabase) return { data: null, error: scope.error };
  const query = (() => {
    if (params.unit) {
      const update = supabase.from("freezer_storage_units").update({ name: valid.name, ...params.appearance })
        .eq("id", params.unit.id).eq("updated_at", params.unit.updated_at);
      return scope.familyId ? update.eq("family_id", scope.familyId) : update.is("family_id", null).eq("user_id", params.userId);
    }
    return supabase.from("freezer_storage_units").upsert({
      id: params.creationId, name: valid.name, storage_area: params.area, ...params.appearance,
      user_id: scope.familyId ? null : params.userId, family_id: scope.familyId,
    }, { onConflict: "id" });
  })();
  const { data, error } = await query.select(params.appearance ? FIELDS : LEGACY_FIELDS).single();
  return {
    data: data as FreezerStorageUnit | null,
    error: missingAppearance(error) ? "Emoji and color saving needs a database update. Your changes have not been saved."
      : error?.code === "PGRST116" ? "This storage location changed. Close and reopen it before editing." : freezerError(error),
  };
}

export async function deleteFreezerStorage(userId: string, expectedFamilyId: string | null, unit: FreezerStorageUnit) {
  const scope = await freezerScope(userId, expectedFamilyId);
  if (scope.error || !supabase) return scope.error ?? "Please sign in first.";
  const query = supabase.from("freezer_storage_units").delete()
    .eq("id", unit.id).eq("updated_at", unit.updated_at);
  const { data, error } = await (scope.familyId ? query.eq("family_id", scope.familyId)
    : query.is("family_id", null).eq("user_id", userId)).select("id").maybeSingle();
  if (error?.code === "42501") return "Storage deletion needs a database update. Nothing was deleted.";
  if (error) return freezerError(error);
  if (!data) return "This storage location changed or was already deleted. Close and reopen it before trying again.";
  return null;
}
