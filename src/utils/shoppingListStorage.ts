import type { ShoppingListItem } from "./shoppingListState";

type ShoppingListStorage = {
  removeItem(key: string): Promise<void>;
  setItem(key: string, value: string): Promise<void>;
};

export async function persistShoppingListMigration(
  storage: ShoppingListStorage,
  destinationKey: string,
  legacyKey: string,
  items: ShoppingListItem[],
) {
  await storage.setItem(destinationKey, JSON.stringify(items));
  await storage.removeItem(legacyKey);
}
