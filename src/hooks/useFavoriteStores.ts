import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import {
  listSyncedFavoriteStoreIds,
  replaceSyncedFavoriteStoreIds,
} from "../services/favoriteStores";
import {
  mergeFavoriteStoreIds,
  normalizeFavoriteStoreIds,
  toggleFavoriteStoreId,
} from "../utils/favoriteStoreState";

const STORAGE_KEY = "pc-favorite-stores-v1";

function storageKey(profileId: string | null) {
  return profileId ? `${STORAGE_KEY}.user.${profileId}` : `${STORAGE_KEY}.guest`;
}

export default function useFavoriteStores(
  profileId: string | null,
  showToast: (message: string) => void,
) {
  const [storeIds, setStoreIds] = React.useState<string[]>([]);
  const [loadedKey, setLoadedKey] = React.useState<string | null>(null);
  const [syncReadyKey, setSyncReadyKey] = React.useState<string | null>(null);
  const [remoteWriteReadyKey, setRemoteWriteReadyKey] = React.useState<string | null>(null);
  const [syncMessage, setSyncMessage] = React.useState<string | null>(null);
  const storeIdsRef = React.useRef(storeIds);
  const writeChainRef = React.useRef(Promise.resolve());
  const activeKeyRef = React.useRef("");
  const lastHydratedKeyRef = React.useRef<string | null>(null);
  const pendingMutationsRef = React.useRef<Array<(current: string[]) => string[]>>([]);
  const key = storageKey(profileId);
  const guestKey = storageKey(null);
  activeKeyRef.current = key;

  React.useEffect(() => {
    storeIdsRef.current = storeIds;
  }, [storeIds]);

  const mutateStoreIds = React.useCallback((mutation: (current: string[]) => string[]) => {
    if (loadedKey !== key || syncReadyKey !== key) {
      pendingMutationsRef.current.push(mutation);
    }
    setStoreIds((current) => mutation(current));
  }, [key, loadedKey, syncReadyKey]);

  React.useEffect(() => {
    let active = true;
    setLoadedKey(null);
    setSyncReadyKey(null);
    setRemoteWriteReadyKey(null);
    setSyncMessage(null);
    const inMemoryGuestIds =
      profileId && lastHydratedKeyRef.current === guestKey
        ? storeIdsRef.current
        : [];

    void Promise.all([
      AsyncStorage.getItem(key),
      AsyncStorage.getItem(guestKey),
    ])
      .then(([raw, guestRaw]) => {
        if (!active) return;
        const primary = raw ? normalizeFavoriteStoreIds(JSON.parse(raw)) : [];
        const guest = guestRaw ? normalizeFavoriteStoreIds(JSON.parse(guestRaw)) : [];
        const hydrated = profileId
          ? mergeFavoriteStoreIds(guest, inMemoryGuestIds, primary)
          : primary;
        const pending = pendingMutationsRef.current;
        pendingMutationsRef.current = [];
        setStoreIds(pending.reduce((current, mutation) => mutation(current), hydrated));
        lastHydratedKeyRef.current = key;
        setLoadedKey(key);
      })
      .catch(() => {
        if (!active) return;
        setStoreIds([]);
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
    void listSyncedFavoriteStoreIds(profileId).then(({ data, error }) => {
      if (!active) return;
      setStoreIds((current) => mergeFavoriteStoreIds(current, data));
      setSyncMessage(error);
      if (!error) setRemoteWriteReadyKey(key);
      setSyncReadyKey(key);
    });
    return () => {
      active = false;
    };
  }, [key, loadedKey, profileId]);

  React.useEffect(() => {
    if (loadedKey !== key || syncReadyKey !== key) return;
    void AsyncStorage.setItem(key, JSON.stringify(storeIds)).catch(() => undefined);
    if (!profileId || remoteWriteReadyKey !== key) return;

    const snapshot = [...storeIds];
    const writeKey = key;
    writeChainRef.current = writeChainRef.current.then(async () => {
      const error = await replaceSyncedFavoriteStoreIds(profileId, snapshot);
      if (activeKeyRef.current === writeKey) setSyncMessage(error);
      if (!error) {
        await AsyncStorage.removeItem(guestKey).catch(() => undefined);
      }
    });
  }, [
    guestKey,
    key,
    loadedKey,
    profileId,
    remoteWriteReadyKey,
    storeIds,
    syncReadyKey,
  ]);

  const toggleStore = React.useCallback((storeId: string, storeName: string) => {
    const willSave = !storeIdsRef.current.includes(storeId);
    mutateStoreIds((current) => toggleFavoriteStoreId(current, storeId));
    showToast(willSave ? `${storeName} saved to My stores.` : `${storeName} removed from My stores.`);
  }, [mutateStoreIds, showToast]);

  return {
    loaded: loadedKey === key && syncReadyKey === key,
    storeIds,
    syncMessage,
    toggleStore,
  };
}
