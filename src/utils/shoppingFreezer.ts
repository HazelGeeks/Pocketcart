import { emptyFreezerItemDraft, type FreezerItemDraft } from "./freezerItem";
import type { ShoppingListItem } from "./shoppingListState";

export function shoppingItemFreezerDraft(item: ShoppingListItem): FreezerItemDraft {
  return { ...emptyFreezerItemDraft(), name: item.name, quantity: String(item.quantity), unit: item.unit ?? "" };
}

export function markShoppingItemStored(items: ShoppingListItem[], productId: string, freezerItemId: string) {
  return items.map(item => item.productId === productId && item.completed ? { ...item, freezerItemId } : item);
}
