import { supabase } from "./supabaseClient";
import { normalizeShoppingListItems, type ShoppingListItem } from "../utils/shoppingListState";
export type Family = { id: string; name: string; owner_id: string | null };
export type FamilyMember = { user_id: string; display_name: string; joined_at: string };
export async function loadFamily() {
  if (!supabase) throw new Error("Please sign in to use family sharing.");
  const { data, error } = await supabase.from("families").select("id,name,owner_id").maybeSingle();
  if (error) throw new Error("Family sharing is unavailable. Please refresh after the app update.");
  return data as Family | null;
}
export async function familyAction(action: "create" | "join" | "invite" | "revoke" | "remove" | "leave" | "import_freezer", value?: string) {
  if (!supabase) throw new Error("Please sign in first.");
  const { data, error } = await supabase.rpc("family_action", { p_action: action, p_value: value ?? null });
  if (error) throw new Error(error.message);
  return data as { token?: string; family_id: string };
}
export async function listFamilyMembers(): Promise<FamilyMember[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("list_family_members");
  if (error) throw new Error(error.message);
  return data ?? [];
}
export async function readFamilyCart(familyId: string) {
  if (!supabase) throw new Error("Please sign in first.");
  const { data, error } = await supabase.from("family_carts").select("items,revision").eq("family_id", familyId).single();
  if (error) throw new Error("Could not sync the family Cart. Check your connection or family membership.");
  return { items: normalizeShoppingListItems(data.items), revision: Number(data.revision) };
}
export async function writeFamilyCart(familyId: string, revision: number, items: ShoppingListItem[]) {
  if (!supabase) throw new Error("Please sign in first.");
  const { data, error } = await supabase.rpc("save_family_cart", { p_family_id: familyId, p_revision: revision, p_items: items });
  if (error) throw new Error(error.message);
  return data === true;
}
