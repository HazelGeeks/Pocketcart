import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import type { MarketProduct } from "../services/marketData";
import { productDisplayName } from "../utils/productNames";
import {
  listSyncedShoppingListItems,
  replaceSyncedShoppingListItems,
} from "../services/shoppingList";
import {
  addShoppingListProduct,
  changeShoppingListQuantity,
  mergeShoppingListItemSources,
  mergeShoppingListItems,
  normalizeShoppingListItems,
  removeShoppingListProduct,
  type ShoppingListItem,
} from "../utils/shoppingListState";

export type { ShoppingListItem } from "../utils/shoppingListState";

const LEGACY_STORAGE_KEY = "pc-shopping-list-v1";
const STORAGE_KEY = "pc-shopping-list-v2";

function storageKey(profileId: string | null) {
  return profileId ? `${STORAGE_KEY}.user.${profileId}` : `${STORAGE_KEY}.guest`;
}

export default function useShoppingList(profileId: string | null) {
  const [items, setItems] = React.useState<ShoppingListItem[]>([]);
  const [loadedKey, setLoadedKey] = React.useState<string | null>(null);
  const [syncReadyKey, setSyncReadyKey] = React.useState<string | null>(null);
  const [syncMessage, setSyncMessage] = React.useState<string | null>(null);
  const itemsRef = React.useRef(items);
  const writeChainRef = React.useRef(Promise.resolve());
  const activeKeyRef = React.useRef("");
  const lastHydratedKeyRef = React.useRef<string | null>(null);
  const pendingMutationsRef = React.useRef<Array<(
    current: ShoppingListItem[],
  ) => ShoppingListItem[]>>([]);
  const key = storageKey(profileId);
  const guestKey = storageKey(null);
  activeKeyRef.current = key;

  React.useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const mutateItems = React.useCallback((mutation: (
    current: ShoppingListItem[],
  ) => ShoppingListItem[]) => {
    if (loadedKey !== key || syncReadyKey !== key) {
      pendingMutationsRef.current.push(mutation);
    }
    setItems((current) => mutation(current));
  }, [key, loadedKey, syncReadyKey]);

  React.useEffect(() => {
    let active = true;
    setLoadedKey(null);
    setSyncReadyKey(null);
    setSyncMessage(null);
    const inMemoryGuestItems = profileId && lastHydratedKeyRef.current === guestKey
      ? itemsRef.current
      : [];
    void Promise.all([
      AsyncStorage.getItem(key),
      AsyncStorage.getItem(guestKey),
      AsyncStorage.getItem(LEGACY_STORAGE_KEY),
    ])
      .then(([raw, guestRaw, legacyRaw]) => {
        if (!active) return;
        const primary = raw ? normalizeShoppingListItems(JSON.parse(raw)) : [];
        const guest = guestRaw ? normalizeShoppingListItems(JSON.parse(guestRaw)) : [];
        const legacy = legacyRaw ? normalizeShoppingListItems(JSON.parse(legacyRaw)) : [];
        const guestItems = mergeShoppingListItemSources(
          legacy,
          guest,
          inMemoryGuestItems,
        );
        const hydrated = profileId
          ? mergeShoppingListItems(guestItems, primary)
          : mergeShoppingListItems(legacy, primary);
        const pending = pendingMutationsRef.current;
        pendingMutationsRef.current = [];
        setItems(pending.reduce((current, mutation) => mutation(current), hydrated));
        lastHydratedKeyRef.current = key;
        setLoadedKey(key);
      })
      .catch(() => {
        if (!active) return;
        setItems([]);
        lastHydratedKeyRef.current = key;
        setLoadedKey(key);
      });
    return () => {
      active = false;
    };
  }, [guestKey, key, profileId]);

  React.useEffect(() => {
    if (loadedKey !== key) return;
    if (!profileId) {
      setSyncReadyKey(key);
      return;
    }

    let active = true;
    void listSyncedShoppingListItems(profileId).then(({ data, error }) => {
      if (!active) return;
      const merged = mergeShoppingListItems(itemsRef.current, data);
      setItems(merged);
      setSyncMessage(error);
      setSyncReadyKey(key);
    });
    return () => {
      active = false;
    };
  }, [key, loadedKey, profileId]);

  React.useEffect(() => {
    if (loadedKey !== key || syncReadyKey !== key) return;
    void AsyncStorage.setItem(key, JSON.stringify(items)).catch(() => undefined);
    if (!profileId) return;

    const snapshot = items.map((item) => ({ ...item }));
    const writeKey = key;
    writeChainRef.current = writeChainRef.current.then(async () => {
      const error = await replaceSyncedShoppingListItems(profileId, snapshot);
      if (activeKeyRef.current === writeKey) setSyncMessage(error);
      if (!error) {
        await Promise.all([
          AsyncStorage.removeItem(guestKey),
          AsyncStorage.removeItem(LEGACY_STORAGE_KEY),
        ]).catch(() => undefined);
      }
    });
  }, [guestKey, items, key, loadedKey, profileId, syncReadyKey]);

  const addProduct = React.useCallback((product: MarketProduct) => {
    mutateItems((current) => addShoppingListProduct(current, {
      id: product.id,
      name: productDisplayName(product),
      unit: product.unit,
    }));
  }, [mutateItems]);

  const changeQuantity = React.useCallback((productId: string, delta: number) => {
    mutateItems((current) => changeShoppingListQuantity(current, productId, delta));
  }, [mutateItems]);

  const removeProduct = React.useCallback((productId: string) => {
    mutateItems((current) => removeShoppingListProduct(current, productId));
  }, [mutateItems]);

  const clear = React.useCallback(() => mutateItems(() => []), [mutateItems]);

  return {
    addProduct,
    changeQuantity,
    clear,
    items,
    loaded: loadedKey === key && syncReadyKey === key,
    removeProduct,
    syncMessage,
  };
}
