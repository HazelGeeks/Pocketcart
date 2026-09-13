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
  product_id?: string | null;
  thumbnail_url?: string | null;
  category?: string;
  storage_area: FreezerStorageArea;
  storage_unit_id?: string | null;
  quantity: number;
  unit: string | null;
  expires_on: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

type ServiceResult<T> = { data: T; error: string | null };

const SELECT_FIELDS =
  "id, user_id, family_id, name, product_id, storage_area, storage_unit_id, quantity, unit, expires_on, note, created_at, updated_at";

export async function freezerScope(userId: string, expectedFamilyId?: string | null) {
  if (!hasSupabaseEnv || !supabase) return { familyId: null, error: "Supabase is not configured." };
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || (!data.user || data.user.id !== userId)) return { familyId: null, error: "Please sign in first." };
    const familyId = (await loadFamily())?.id ?? null;
    if (expectedFamilyId !== undefined && expectedFamilyId !== familyId) return { familyId, error: "Your family changed. Reopen My Freezer and try again." };
    return { familyId, error: null };
  } catch { return { familyId: null, error: "Could not check your family. Please refresh and try again." }; }
}

export function freezerError(error: { code?: string; message?: string } | null): string | null {
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

function missingStorageColumn(error: { code?: string; message?: string } | null) {
  return Boolean(error && ["42703", "PGRST204"].includes(error.code ?? "") && error.message?.includes("storage_unit_id"));
}

function missingProductColumn(error: { code?: string; message?: string } | null) {
  return Boolean(error && ["42703", "PGRST204"].includes(error.code ?? "") && error.message?.includes("product_id"));
}

export async function listMyFreezerItems(
  userId: string,
): Promise<ServiceResult<MyFreezerItem[]>> {
  const scope = await freezerScope(userId);
  if (scope.error || !supabase) return { data: [], error: scope.error };

  const client = supabase;
  const read = (fields: string) => collectPagedRows<MyFreezerItem, { message?: string; code?: string }>(async (from, to) => {
    const query = client.from("freezer_items").select(fields);
    const scoped = scope.familyId ? query.eq("family_id", scope.familyId) : query.is("family_id", null).eq("user_id", userId);
    const result = await scoped
    .order("storage_area", { ascending: true })
    .order("expires_on", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .range(from, to);
    return { data: result.data as unknown as MyFreezerItem[] | null, error: result.error };
  });

  let fields = SELECT_FIELDS;
  let { data, error } = await read(fields);
  for (let attempt = 0; attempt < 2 && (missingStorageColumn(error) || missingProductColumn(error)); attempt++) {
    fields = fields.replace(missingStorageColumn(error) ? ", storage_unit_id" : ", product_id", "");
    ({ data, error } = await read(fields));
  }

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
    ...(validated.value.productId !== undefined ? { product_id: validated.value.productId } : {}),
    storage_area: validated.value.storageArea,
    storage_unit_id: validated.value.storageUnitId ?? null,
    quantity: validated.value.quantity,
    unit: validated.value.unit,
    expires_on: validated.value.expiresOn,
    note: validated.value.note,
    updated_at: new Date().toISOString(),
  };

  const client = supabase;
  const write = async (includeStorage: boolean, includeProduct: boolean) => {
    const { storage_unit_id, product_id, ...legacyPayload } = payload;
    const values = { ...legacyPayload, ...(includeStorage ? { storage_unit_id } : {}), ...(includeProduct && product_id !== undefined ? { product_id } : {}) };
    const ownedPayload = { ...values, user_id: params.userId, family_id: scope.familyId };
    const query = (() => {
      if (params.itemId) {
        let update = client.from("freezer_items").update(values).eq("id", params.itemId);
        if (params.expectedUpdatedAt) update = update.eq("updated_at", params.expectedUpdatedAt);
        return scope.familyId ? update.eq("family_id", scope.familyId) : update.is("family_id", null).eq("user_id", params.userId);
      }
      return params.creationId
        ? client.from("freezer_items").upsert({ ...ownedPayload, id: params.creationId }, { onConflict: "id" })
        : client.from("freezer_items").insert(ownedPayload);
    })();
    let fields = SELECT_FIELDS;
    if (!includeStorage) fields = fields.replace(", storage_unit_id", "");
    if (!includeProduct) fields = fields.replace(", product_id", "");
    return await query.select(fields).single();
  };
  let includeStorage = true, includeProduct = true;
  let { data, error } = await write(includeStorage, includeProduct);
  for (let attempt = 0; attempt < 2; attempt++) {
    if (missingStorageColumn(error) && !payload.storage_unit_id) includeStorage = false;
    else if (missingProductColumn(error) && !payload.product_id) includeProduct = false;
    else break;
    ({ data, error } = await write(includeStorage, includeProduct));
  }

  return {
    data: (data as MyFreezerItem | null) ?? null,
    error: missingProductColumn(error) ? "Saving the linked product needs a database update. Your food has not been saved." : error?.code === "PGRST116" ? "This food was changed or removed. Refresh My Freezer before editing again." : freezerError(error),
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
