import React from "react";
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
  const [items, setItems] = React.useState<MyFreezerItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    const result = await listMyFreezerItems(userId);
    setItems(sortItems(result.data));
    setMessage(result.error);
    setLoading(false);
  }, [userId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const save = React.useCallback(async (draft: FreezerItemDraft, itemId?: string) => {
    setSaving(true);
    const result = await saveMyFreezerItem({ userId, itemId, draft });
    setSaving(false);
    if (result.error || !result.data) {
      setMessage(result.error ?? "My Freezer item could not be saved.");
      return false;
    }
    setItems((current) => sortItems([
      ...current.filter((item) => item.id !== result.data?.id),
      result.data!,
    ]));
    setMessage(itemId ? "Item updated." : "Item added to My Freezer.");
    return true;
  }, [userId]);

  const remove = React.useCallback(async (itemId: string) => {
    setDeletingId(itemId);
    const error = await deleteMyFreezerItem(userId, itemId);
    setDeletingId(null);
    if (error) {
      setMessage(error);
      return false;
    }
    setItems((current) => current.filter((item) => item.id !== itemId));
    setMessage("Item removed from My Freezer.");
    return true;
  }, [userId]);

  return { deletingId, items, load, loading, message, remove, save, saving, setMessage };
}
