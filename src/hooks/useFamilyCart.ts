import React from "react";
import { AppState } from "react-native";
import { randomUUID } from "expo-crypto";
import type { MarketProduct } from "../services/marketData";
import { readFamilyCart, writeFamilyCart } from "../services/family";
import { mutateFamilyCart, setFamilyItemCompleted } from "../utils/familyCartSync";
import { productDisplayName } from "../utils/productNames";
import { addShoppingListProduct, changeShoppingListQuantity, removeShoppingListProduct, restoreShoppingListItems, type ShoppingListItem } from "../utils/shoppingListState";
import { markShoppingItemStored } from "../utils/shoppingFreezer";
export default function useFamilyCart(familyId: string | null, userId: string | null) {
  const scope = familyId && userId ? `${userId}/${familyId}` : null;
  const [snapshot, setSnapshot] = React.useState<{ scope: string | null; items: ShoppingListItem[]; loaded: boolean }>({ scope: null, items: [], loaded: false });
  const [syncMessage, setSyncMessage] = React.useState<string | null>(null);
  const [undo, setUndo] = React.useState<{ scope: string; items: ShoppingListItem[] } | null>(null);
  const [saving, setSaving] = React.useState(false);
  const current = React.useRef(scope);
  current.current = scope;
  const chain = React.useRef(Promise.resolve());
  const pending = React.useRef(0);
  const version = React.useRef(0);
  const reload = React.useCallback(async () => {
    if (!scope || pending.current) return;
    const request = ++version.current;
    try {
      const result = await readFamilyCart(scope.split("/")[1]);
      if (current.current === scope && request === version.current && !pending.current) {
        setSnapshot({ scope, items: result.items, loaded: true });
      }
    } catch (error) {
      if (current.current === scope && request === version.current) { setSnapshot(current => ({ items: current.scope === scope ? current.items : [], scope, loaded: true })); setSyncMessage(error instanceof Error ? error.message : "Could not refresh the family Cart."); }
    }
  }, [scope]);
  React.useEffect(() => {
    setSyncMessage(null); setUndo(null);
    void reload();
    const timer = setInterval(() => { if (AppState.currentState === "active") void reload(); }, 5000);
    const resume = AppState.addEventListener("change", next => { if (next === "active") void reload(); });
    return () => { version.current++; clearInterval(timer); resume.remove(); };
  }, [reload]);
  const mutate = React.useCallback((fn: (items: ShoppingListItem[]) => ShoppingListItem[], captureUndo = false) => {
    if (!scope) return;
    pending.current++; version.current++; setSaving(true);
    chain.current = chain.current.then(async () => {
      if (current.current !== scope) return;
      let removed: ShoppingListItem[] = [];
      const items = await mutateFamilyCart(() => readFamilyCart(scope.split("/")[1]), (revision, next) => writeFamilyCart(scope.split("/")[1], revision, next), before => {
        const next = fn(before);
        removed = before.filter(item => !next.some(value => value.productId === item.productId));
        return next;
      }, () => current.current === scope);
      if (current.current === scope) {
        setSnapshot({ scope, items, loaded: true }); setSyncMessage(null);
        if (captureUndo) setUndo({ scope, items: removed });
      }
    }).catch(error => {
      if (current.current === scope) setSyncMessage(`${error instanceof Error ? error.message : "Could not confirm your change."} Refresh the Cart before trying again.`);
    }).finally(() => { pending.current--; if (!pending.current) { setSaving(false); void reload(); } });
  }, [scope, reload]);
  return {
    items: snapshot.scope === scope ? snapshot.items : [],
    loaded: snapshot.scope === scope && snapshot.loaded,
    syncMessage: saving ? "Saving to your family Cart…" : syncMessage,
    reload,
    importItems: (items: ShoppingListItem[]) => mutate(currentItems => restoreShoppingListItems(currentItems, items.map(({ freezerItemId: _stored, ...item }) => item))),
    addProduct: (product: MarketProduct) => mutate(items => addShoppingListProduct(items, { id: product.id, name: productDisplayName(product), unit: product.unit, category: product.category })),
    addCustomItem: (name: string) => { const text = name.trim().slice(0,120); const id = `custom:${randomUUID()}`; if (text) mutate(items => addShoppingListProduct(items, { id, name: text, unit: null, category: "Other items" })); },
    changeQuantity: (id: string, delta: number) => mutate(items => changeShoppingListQuantity(items, id, delta)),
    toggleCompleted: (id: string) => { const completed = !snapshot.items.find(item => item.productId === id)?.completed; mutate(items => setFamilyItemCompleted(items, id, completed)); },
    markStored: (id: string, freezerId: string) => mutate(items => markShoppingItemStored(items, id, freezerId)),
    removeProduct: (id: string) => mutate(items => removeShoppingListProduct(items, id), true),
    clear: () => mutate(() => [], true),
    undoCount: undo?.scope === scope ? undo.items.length : 0,
    undoRemove: () => { if (undo?.scope === scope) { mutate(items => restoreShoppingListItems(items, undo.items)); setUndo(null); } },
  };
}
