import type { ShoppingPlan } from "./shoppingOptimizer";
import type { ShoppingListItem } from "./shoppingListState";

export type ShoppingGroupMode = "list" | "category" | "store";

export function groupShoppingList(items: ShoppingListItem[], mode: ShoppingGroupMode, plan: ShoppingPlan | null) {
  const groups = new Map<string, { key: string; label: string; items: ShoppingListItem[] }>();
  const stores = new Map(plan?.stops.flatMap((stop) => stop.items.map((item) => [item.productId, stop] as const)) ?? []);
  for (const item of items) {
    if (item.completed) continue;
    const store = stores.get(item.productId);
    const key = mode === "category" ? (item.category || "Other items")
      : mode === "store" ? (store ? `store:${store.storeId}` : "unassigned") : "all";
    const label = mode === "category" ? key
      : mode === "store" ? (store ? [store.storeName, store.storeArea].filter(Boolean).join(" · ") : "No recommended store") : "To buy";
    const group = groups.get(key) ?? { key, label, items: [] };
    group.items.push(item);
    groups.set(key, group);
  }
  return [...groups.values()];
}
