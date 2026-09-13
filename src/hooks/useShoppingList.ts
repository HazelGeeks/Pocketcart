import { useFamily } from "../contexts/FamilyContext";
import usePersonalShoppingList from "./usePersonalShoppingList";
import useFamilyCart from "./useFamilyCart";
export type { ShoppingListItem } from "../utils/shoppingListState";
export default function useShoppingList(profileId: string | null) {
  const family = useFamily();
  const personal = usePersonalShoppingList(profileId);
  const shared = useFamilyCart(family.ready && family.userId === profileId ? family.family?.id ?? null : null, profileId);
  if (!family.ready || family.userId !== profileId) {
    const noop = () => {};
    return { ...personal, items: [], loaded: false, syncMessage: family.error ?? "Loading your Cart…", familyName: null,
      addProduct: noop, addCustomItem: noop, changeQuantity: noop, toggleCompleted: noop, markStored: noop, removeProduct: noop, clear: noop, undoRemove: noop, undoCount: 0,
      reload: family.refresh, importPersonal: noop, personalCount: 0 };
  }
  return family.family
    ? { ...shared, familyName: family.family.name, importPersonal: () => shared.importItems(personal.items), personalCount: personal.loaded ? personal.items.length : 0 }
    : { ...personal, familyName: null, reload: family.refresh, importPersonal: () => {}, personalCount: 0 };
}
