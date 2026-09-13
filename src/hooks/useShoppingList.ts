import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import { randomUUID } from "expo-crypto";
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
  toggleShoppingListItem,
  restoreShoppingListItems,
  type ShoppingListItem,
} from "../utils/shoppingListState";
import { markShoppingItemStored } from "../utils/shoppingFreezer";
import { persistShoppingListMigration } from "../utils/shoppingListStorage";

export type { ShoppingListItem } from "../utils/shoppingListState";

const LEGACY_STORAGE_KEY = "pc-shopping-list-v1";
const STORAGE_KEY = "pc-shopping-list-v2";

function storageKey(profileId: string | null) {
  return profileId ? `${STORAGE_KEY}.user.${profileId}` : `${STORAGE_KEY}.guest`;
}

export default function useShoppingList(profileId: string | null) {
  const [items, setItems] = React.useState<ShoppingListItem[]>([]);
  const [loadedKey, setLoadedKey] = React.useState<string | null>(null);
  const [remoteReadyKey, setRemoteReadyKey] = React.useState<string | null>(null);
  const [syncReadyKey, setSyncReadyKey] = React.useState<string | null>(null);
  const [localMessage, setLocalMessage] = React.useState<string | null>(null);
  const [syncMessage, setSyncMessage] = React.useState<string | null>(null);
  const itemsRef = React.useRef(items);
  const writeChainRef = React.useRef(Promise.resolve());
  const activeKeyRef = React.useRef("");
  const lastHydratedKeyRef = React.useRef<string | null>(null);
  const pendingMutationsRef = React.useRef<Array<(
    current: ShoppingListItem[],
  ) => ShoppingListItem[]>>([]);
  const [undo, setUndo] = React.useState<{ key: string; items: ShoppingListItem[] } | null>(null);
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
    const next = mutation(itemsRef.current);
    itemsRef.current = next;
    setItems(next);
  }, [key, loadedKey, syncReadyKey]);

  React.useEffect(() => {
    let active = true;
    setLoadedKey(null);
    setSyncReadyKey(null);
    setRemoteReadyKey(null);
    setSyncMessage(null);
    setLocalMessage(null);
    const inMemoryGuestItems = profileId && lastHydratedKeyRef.current === guestKey
      ? itemsRef.current
      : [];
    void Promise.all([
      AsyncStorage.getItem(key),
      AsyncStorage.getItem(guestKey),
      AsyncStorage.getItem(LEGACY_STORAGE_KEY),
    ])
      .then(async ([raw, guestRaw, legacyRaw]) => {
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
        let nextItems = pending.reduce(
          (current, mutation) => mutation(current),
          hydrated,
        );
        if (legacyRaw) {
          let migrationComplete = false;
          while (!migrationComplete && active) {
            await persistShoppingListMigration(
              AsyncStorage,
              key,
              LEGACY_STORAGE_KEY,
              nextItems,
            ).catch(() => undefined);
            const queuedDuringMigration = pendingMutationsRef.current;
            pendingMutationsRef.current = [];
            if (queuedDuringMigration.length === 0) {
              migrationComplete = true;
            } else {
              nextItems = queuedDuringMigration.reduce(
                (current, mutation) => mutation(current),
                nextItems,
              );
            }
          }
        }
        if (!active) return;
        itemsRef.current = nextItems;
        setItems(nextItems);
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
    const beforeSync = itemsRef.current;
    pendingMutationsRef.current = [];
    void listSyncedShoppingListItems(profileId).then(({ data, error }) => {
      if (!active) return;
      const merged = mergeShoppingListItems(beforeSync, data);
      const next = pendingMutationsRef.current.reduce((current, mutation) => mutation(current), merged);
      pendingMutationsRef.current = [];
      itemsRef.current = next;
      setItems(next);
      setSyncMessage(error);
      if (!error) setRemoteReadyKey(key);
      setSyncReadyKey(key);
    }).catch(() => {
      if (!active) return;
      setSyncMessage("Couldn't sync your list. Changes will stay on this device for now.");
      setSyncReadyKey(key);
    });
    return () => {
      active = false;
    };
  }, [key, loadedKey, profileId]);

  React.useEffect(() => {
    if (loadedKey !== key || syncReadyKey !== key) return;
    const snapshot = items.map((item) => ({ ...item }));
    const writeKey = key;
    writeChainRef.current = writeChainRef.current.then(async () => {
      try {
        await persistShoppingListMigration(AsyncStorage, writeKey, LEGACY_STORAGE_KEY, snapshot);
        if (activeKeyRef.current === writeKey) setLocalMessage(null);
      } catch {
        if (activeKeyRef.current === writeKey) setLocalMessage("Couldn't save your list on this device. Keep the app open and try again.");
        return;
      }
      if (!profileId || remoteReadyKey !== writeKey) return;

      const error = await replaceSyncedShoppingListItems(profileId, snapshot);
      if (activeKeyRef.current === writeKey) setSyncMessage(error);
      if (!error) {
        await AsyncStorage.removeItem(guestKey).catch(() => undefined);
      }
    }).catch(() => {
      if (activeKeyRef.current === writeKey) setSyncMessage("Couldn't sync your list. Changes are saved on this device.");
    });
  }, [guestKey, items, key, loadedKey, profileId, remoteReadyKey, syncReadyKey]);

  const addProduct = React.useCallback((product: MarketProduct) => {
    mutateItems((current) => addShoppingListProduct(current, {
      id: product.id,
      name: productDisplayName(product),
      unit: product.unit,
      category: product.category,
    }));
  }, [mutateItems]);

  const changeQuantity = React.useCallback((productId: string, delta: number) => {
    mutateItems((current) => changeShoppingListQuantity(current, productId, delta));
  }, [mutateItems]);

  const addCustomItem = React.useCallback((name: string) => {
    const trimmed = name.trim().slice(0, 120);
    if (!trimmed) return;
    const id = `custom:${randomUUID()}`;
    mutateItems((current) => addShoppingListProduct(current, { id, name: trimmed, unit: null, category: "Other items" }));
  }, [mutateItems]);

  const toggleCompleted = React.useCallback((id: string) => {
    mutateItems((current) => toggleShoppingListItem(current, id));
  }, [mutateItems]);

  const markStored = React.useCallback((productId: string, freezerItemId: string) => {
    mutateItems(current => markShoppingItemStored(current, productId, freezerItemId));
  }, [mutateItems]);

  const removeProduct = React.useCallback((productId: string) => {
    setUndo({ key, items: itemsRef.current.filter((item) => item.productId === productId) });
    mutateItems((current) => removeShoppingListProduct(current, productId));
  }, [key, mutateItems]);

  const clear = React.useCallback(() => {
    setUndo({ key, items: [...itemsRef.current] });
    mutateItems(() => []);
  }, [key, mutateItems]);

  const undoRemove = React.useCallback(() => {
    if (!undo || undo.key !== key) return;
    mutateItems((current) => restoreShoppingListItems(current, undo.items));
    setUndo(null);
  }, [key, mutateItems, undo]);

  return {
    markStored,
    addCustomItem,
    toggleCompleted,
    undoRemove,
    undoCount: undo?.key === key ? undo.items.length : 0,
    addProduct,
    changeQuantity,
    clear,
    items,
    loaded: loadedKey === key && syncReadyKey === key,
    removeProduct,
    syncMessage: localMessage ?? syncMessage,
  };
}
