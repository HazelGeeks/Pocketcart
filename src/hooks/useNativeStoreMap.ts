import React from "react";
import MapView, { type Region } from "react-native-maps";
import {
  listStores,
  type MarketStore,
} from "../services/marketData";
import { matchesStoreFilter } from "../services/marketData/shared";
import {
  DEFAULT_REGION,
  type NativeTabId,
} from "../screens/nativeAppData";
import { getStoreDistanceScope } from "../utils/storeDistanceScope";
import type { NativeOnboardingState } from "./useNativeOnboarding";

type UseNativeStoreMapOptions = {
  activeTab: NativeTabId;
  favoriteStoreIds: string[];
  onboardingState: NativeOnboardingState;
  onHideOnboarding: () => void;
  onOpenMap: () => void;
  showToast: (message: string) => void;
};

export default function useNativeStoreMap({
  activeTab,
  favoriteStoreIds,
  onboardingState,
  onHideOnboarding,
  onOpenMap,
  showToast,
}: UseNativeStoreMapOptions) {
  const mapRef = React.useRef<MapView | null>(null);
  const [query, setQuery] = React.useState("");
  const [stores, setStores] = React.useState<MarketStore[]>([]);
  const [focusedStoreId, setFocusedStoreId] = React.useState("");
  const [focusMode, setFocusMode] = React.useState<"store" | "user">("store");
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [pendingStoreId, setPendingStoreId] = React.useState<string | null>(null);
  const [favoriteFilterActive, setFavoriteFilterActive] = React.useState(false);
  const favoriteStoreIdSet = React.useMemo(
    () => new Set(favoriteStoreIds),
    [favoriteStoreIds],
  );

  const filteredStores = React.useMemo(
    () => stores.filter(
      (store) =>
        matchesStoreFilter(store, query) &&
        (!favoriteFilterActive || favoriteStoreIdSet.has(store.id)),
    ),
    [favoriteFilterActive, favoriteStoreIdSet, query, stores],
  );

  const personalizationStoreOptions = React.useMemo(() => {
    const names = stores
      .map((store) => (store.brand ?? store.name).trim())
      .filter(Boolean);
    const uniqueNames = [...new Set(names)].slice(0, 10);
    return uniqueNames.length > 0
      ? uniqueNames
      : ["Costco", "Walmart", "No Frills", "Save-On-Foods", "T&T", "H Mart"];
  }, [stores]);

  const activeStore = React.useMemo(
    () => filteredStores.find((store) => store.id === focusedStoreId) ?? filteredStores[0],
    [filteredStores, focusedStoreId],
  );

  const userLocation = React.useMemo(() => {
    if (
      onboardingState.locationMode !== "share" ||
      onboardingState.locationLatitude === null ||
      onboardingState.locationLongitude === null
    ) {
      return null;
    }

    return {
      latitude: onboardingState.locationLatitude,
      longitude: onboardingState.locationLongitude,
    };
  }, [
    onboardingState.locationLatitude,
    onboardingState.locationLongitude,
    onboardingState.locationMode,
  ]);
  const distanceScope = React.useMemo(
    () => getStoreDistanceScope(filteredStores, Boolean(userLocation)),
    [filteredStores, userLocation],
  );

  const region = React.useMemo<Region>(() => {
    if (
      focusMode === "user" &&
      userLocation &&
      distanceScope !== "outside"
    ) {
      return {
        ...userLocation,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      };
    }
    if (!activeStore) {
      return userLocation
        ? {
            ...userLocation,
            latitudeDelta: 0.04,
            longitudeDelta: 0.04,
          }
        : DEFAULT_REGION;
    }
    return {
      latitude: activeStore.latitude,
      longitude: activeStore.longitude,
      latitudeDelta: 0.045,
      longitudeDelta: 0.045,
    };
  }, [activeStore, distanceScope, focusMode, userLocation]);

  const loadStores = React.useCallback(async () => {
    const searchText =
      query.trim().length > 0
        ? query.trim()
        : onboardingState.locationMode === "postal"
          ? onboardingState.postalCode ?? ""
          : "";

    setLoading(true);
    const { data, error } = await listStores({
      search: searchText,
      latitude: onboardingState.locationLatitude ?? undefined,
      longitude: onboardingState.locationLongitude ?? undefined,
    });
    setStores(data);
    setLoading(false);
    setMessage(error ?? null);

    if (data.length > 0) {
      setFocusedStoreId((current) => current || data[0].id);
    }
  }, [
    onboardingState.locationLatitude,
    onboardingState.locationLongitude,
    onboardingState.locationMode,
    onboardingState.postalCode,
    query,
  ]);

  React.useEffect(() => {
    if (
      onboardingState.locationMode === "share" &&
      onboardingState.locationLatitude !== null &&
      onboardingState.locationLongitude !== null
    ) {
      setFocusMode("user");
    }
  }, [
    onboardingState.locationLatitude,
    onboardingState.locationLongitude,
    onboardingState.locationMode,
  ]);

  React.useEffect(() => {
    if (activeTab !== "map") return;
    void loadStores();
  }, [activeTab, loadStores]);

  React.useEffect(() => {
    if (pendingStoreId === null) return;
    const target = filteredStores.find((store) => store.id === pendingStoreId);
    if (!target) return;

    setFocusedStoreId(target.id);
    mapRef.current?.animateToRegion(
      {
        latitude: target.latitude,
        longitude: target.longitude,
        latitudeDelta: 0.022,
        longitudeDelta: 0.022,
      },
      220,
    );
    setPendingStoreId(null);
    showToast(`Open ${target.name} on map.`);
  }, [filteredStores, pendingStoreId, showToast]);

  React.useEffect(() => {
    if (filteredStores.length === 0) {
      setFocusedStoreId("");
      return;
    }
    if (!filteredStores.some((store) => store.id === focusedStoreId)) {
      setFocusedStoreId(filteredStores[0].id);
    }
  }, [filteredStores, focusedStoreId]);

  React.useEffect(() => {
    if (!activeStore && !userLocation) return;
    mapRef.current?.animateToRegion(region, 220);
  }, [activeStore, region, userLocation]);

  React.useEffect(() => {
    if (onboardingState.locationMode !== "postal") {
      if (onboardingState.locationMode === "share" && query.includes(",")) {
        setQuery("");
      }
      return;
    }

    if (onboardingState.postalCode && !query) {
      setQuery(onboardingState.postalCode);
    }
  }, [onboardingState.locationMode, onboardingState.postalCode, query]);

  const openStore = React.useCallback(
    (storeId: string, storeName?: string) => {
      if (!storeId || storeId === "unlinked-store") return;
      setPendingStoreId(storeId);
      setFocusMode("store");
      setFavoriteFilterActive(false);
      setQuery(storeName ?? "");
      onOpenMap();
      onHideOnboarding();
    },
    [onHideOnboarding, onOpenMap],
  );

  const focusStore = React.useCallback((store: MarketStore) => {
    setFocusMode("store");
    setFocusedStoreId(store.id);
    mapRef.current?.animateToRegion(
      {
        latitude: store.latitude,
        longitude: store.longitude,
        latitudeDelta: 0.025,
        longitudeDelta: 0.025,
      },
      220,
    );
  }, []);

  const focusUserLocation = React.useCallback((latitude: number, longitude: number) => {
    setFocusMode("user");
    setFocusedStoreId("");
    mapRef.current?.animateToRegion(
      {
        latitude,
        longitude,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      },
      260,
    );
  }, []);

  return {
    favoriteFilterActive,
    distanceScope,
    filteredStores,
    focusedStoreId,
    focusStore,
    focusUserLocation,
    loading,
    mapRef,
    message,
    openStore,
    personalizationStoreOptions,
    query,
    region,
    setFocusMode,
    setFavoriteFilterActive,
    setFocusedStoreId,
    setMessage,
    setQuery,
    userLocation,
  };
}
