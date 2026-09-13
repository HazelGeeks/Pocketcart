import React from "react";
import { AppState } from "react-native";
import { useFamily } from "../contexts/FamilyContext";
import { refreshFreezerReminders } from "../services/freezerNotifications";
import {
  deleteMyFreezerItem,
  listMyFreezerItems,
  type MyFreezerItem,
  saveMyFreezerItem,
} from "../services/myFreezer";
import type { FreezerItemDraft } from "../utils/freezerItem";

function sortItems(items: MyFreezerItem[]): MyFreezerItem[] {
  return [...items].sort((a, b) => {
    if (a.storage_area !== b.storage_area) return a.storage_area.localeCompare(b.storage_area);
    if (a.expires_on && b.expires_on) return a.expires_on.localeCompare(b.expires_on);
    if (a.expires_on) return -1;
    if (b.expires_on) return 1;
    return b.created_at.localeCompare(a.created_at);
  });
}

export default function useMyFreezer(userId: string) {
  const family = useFamily();
  const scope = `${userId}:${family.family?.id ?? "personal"}`;
  const currentScope = React.useRef(scope); currentScope.current = scope;
  const requestId = React.useRef(0);
  const [loadedScope, setLoadedScope] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<MyFreezerItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  const load = React.useCallback(async (quiet = false) => {
    if (!family.ready) return;
    const request = ++requestId.current;
    if (!quiet) setLoading(true);
    try {
      const result = await listMyFreezerItems(userId);
      if (currentScope.current !== scope || request !== requestId.current) return;
      if (!result.error) { setItems(sortItems(result.data)); setLoadedScope(scope); }
      if (!quiet || result.error) setMessage(result.error);
    } catch { if (currentScope.current === scope) setMessage("Could not refresh My Freezer."); }
    finally { if (currentScope.current === scope && request === requestId.current) setLoading(false); }
  }, [userId, scope, family.ready]);

  React.useEffect(() => {
    setItems([]); setMessage(null); setLoading(true);
    void load();
    const timer = setInterval(() => { if (AppState.currentState === "active") void load(true); }, 10000);
    const resume = AppState.addEventListener("change", state => { if (state === "active") void load(true); });
    return () => { requestId.current++; clearInterval(timer); resume.remove(); };
  }, [load]);

  const save = React.useCallback(async (draft: FreezerItemDraft, itemId?: string, expectedUpdatedAt?: string) => {
    if (!family.ready) return false;
    requestId.current++;
    setSaving(true);
    try {
    const result = await saveMyFreezerItem({ userId, itemId, draft, expectedUpdatedAt, expectedFamilyId: family.family?.id ?? null });
    if (currentScope.current !== scope) return false;
    if (result.error || !result.data) {
      setMessage(result.error ?? "My Freezer item could not be saved.");
      return false;
    }
    setItems((current) => sortItems([
      ...current.filter((item) => item.id !== result.data?.id),
      result.data!,
    ]));
    const reminderWarning = await refreshFreezerReminders(userId);
    setMessage(reminderWarning ? `Item saved. ${reminderWarning}` : (itemId ? "Item updated." : "Item added to My Freezer."));
    return true;
    } catch {
      if (currentScope.current === scope) setMessage("Could not confirm this change. Refresh My Freezer before trying again.");
      return false;
    } finally { setSaving(false); }
  }, [userId, scope, family.ready, family.family?.id]);

  const remove = React.useCallback(async (itemId: string) => {
    if (!family.ready) return false;
    requestId.current++;
    setDeletingId(itemId);
    try {
    const error = await deleteMyFreezerItem(userId, itemId);
    if (currentScope.current !== scope) return false;
    if (error) {
      setMessage(error);
      return false;
    }
    setItems((current) => current.filter((item) => item.id !== itemId));
    const reminderWarning = await refreshFreezerReminders(userId);
    setMessage(reminderWarning ? `Item removed. ${reminderWarning}` : "Item removed from My Freezer.");
    return true;
    } catch {
      if (currentScope.current === scope) setMessage("Could not confirm removal. Refresh My Freezer before trying again.");
      return false;
    } finally { setDeletingId(null); }
  }, [userId, scope, family.ready, family.family?.id]);

  return { deletingId, items: family.ready && loadedScope === scope ? items : [], load: () => load(), loading, message, remove, save, saving, setMessage };
}
