import type { MyFreezerItem } from "../services/myFreezer";
import type { ShoppingListItem } from "./shoppingListState";

export function isCatalogProductId(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function freezerProductId(item: MyFreezerItem, cart: ShoppingListItem[]) {
  if (isCatalogProductId(item.product_id)) return item.product_id;
  const ids = [...new Set(cart.filter(row => row.freezerItemId === item.id && isCatalogProductId(row.productId)
    && row.name === item.name && (row.unit ?? null) === (item.unit ?? null)).map(row => row.productId))];
  return ids.length === 1 ? ids[0] : null;
}
