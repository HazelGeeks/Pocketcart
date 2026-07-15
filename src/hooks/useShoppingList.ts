import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import type { MarketProduct } from "../services/marketData";
import {
  addShoppingListProduct,
  changeShoppingListQuantity,
  normalizeShoppingListItems,
  removeShoppingListProduct,
  type ShoppingListItem,
} from "../utils/shoppingListState";

export type { ShoppingListItem } from "../utils/shoppingListState";

const STORAGE_KEY = "pc-shopping-list-v1";

export default function useShoppingList() {
  const [items, setItems] = React.useState<ShoppingListItem[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const hydrationCompleteRef = React.useRef(false);
  const pendingMutationsRef = React.useRef<Array<(
    current: ShoppingListItem[],
  ) => ShoppingListItem[]>>([]);

  const mutateItems = React.useCallback((mutation: (
    current: ShoppingListItem[],
  ) => ShoppingListItem[]) => {
    if (!hydrationCompleteRef.current) pendingMutationsRef.current.push(mutation);
    setItems(mutation);
  }, []);

  React.useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!active) return;
        const hydratedItems = raw
          ? normalizeShoppingListItems(JSON.parse(raw))
          : [];
        const pendingMutations = pendingMutationsRef.current;
        pendingMutationsRef.current = [];
        hydrationCompleteRef.current = true;
        setItems(pendingMutations.reduce(
          (current, mutation) => mutation(current),
          hydratedItems,
        ));
      })
      .catch(() => {
        hydrationCompleteRef.current = true;
        pendingMutationsRef.current = [];
      })
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  React.useEffect(() => {
    if (!loaded) return;
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch(() => {});
  }, [items, loaded]);

  const addProduct = React.useCallback((product: MarketProduct) => {
    mutateItems((current) => addShoppingListProduct(current, product));
  }, [mutateItems]);

  const changeQuantity = React.useCallback((productId: string, delta: number) => {
    mutateItems((current) => changeShoppingListQuantity(current, productId, delta));
  }, [mutateItems]);

  const removeProduct = React.useCallback((productId: string) => {
    mutateItems((current) => removeShoppingListProduct(current, productId));
  }, [mutateItems]);

  const clear = React.useCallback(() => mutateItems(() => []), [mutateItems]);

  return { addProduct, changeQuantity, clear, items, loaded, removeProduct };
}
