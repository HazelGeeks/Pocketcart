import { toggleShoppingListItem, type ShoppingListItem } from "./shoppingListState";
export async function mutateFamilyCart(
  read: () => Promise<{ items: ShoppingListItem[]; revision: number }>,
  write: (revision: number, items: ShoppingListItem[]) => Promise<boolean>,
  mutation: (items: ShoppingListItem[]) => ShoppingListItem[],
  isActive: () => boolean = () => true,
) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const before = await read();
    if (!isActive()) throw new Error("Your family changed. Please try again.");
    const items = mutation(before.items);
    if (await write(before.revision, items)) return items;
  }
  throw new Error("Your family is updating the Cart. Please try again.");
}

export function setFamilyItemCompleted(items: ShoppingListItem[], id: string, completed: boolean) {
  const item = items.find(item => item.productId === id);
  return item && Boolean(item.completed) !== completed ? toggleShoppingListItem(items, id) : items;
}
