import React from "react";
import { Keyboard } from "react-native";
import type MapView from "react-native-maps";
import type { Region } from "react-native-maps";
import { listStores, type MarketStore } from "../services/marketData";
import { calculateHaversineDistanceKm, matchesStoreFilter } from "../services/marketData/shared";
import { DEFAULT_REGION, type NativeTabId } from "../screens/nativeAppData";
import { getStoreDistanceScope } from "../utils/storeDistanceScope";
import type { NativeOnboardingState } from "./useNativeOnboarding";
import type { MapSearchLocation } from "../services/mapLocationSearch";
import useMapLocationSearch from "./useMapLocationSearch";

type UseNativeStoreMapOptions = {
  activeTab: NativeTabId;
  favoriteStoreIds: string[];
  onboardingState: NativeOnboardingState;
  onHideOnboarding: () => void;
  onOpenMap: () => void;
  showToast: (message: string) => void;
};

export default function useNativeStoreMap({
  activeTab, favoriteStoreIds, onboardingState, onHideOnboarding, onOpenMap, showToast,
}: UseNativeStoreMapOptions) {
  const mapRef = React.useRef<MapView | null>(null);
  const [query, updateQuery] = React.useState("");
  const [stores, setStores] = React.useState<MarketStore[]>([]);
  const [focusedStoreId, setFocusedStoreId] = React.useState("");
  const [focusMode, setFocusMode] = React.useState<"store" | "user" | "search">("store");
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [pendingStoreId, setPendingStoreId] = React.useState<string | null>(null);
  const [favoriteFilterActive, setFavoriteFilterActive] = React.useState(false);
  const location = useMapLocationSearch();
  const { selected, setSelected, cancel, search } = location;
  const favoriteStoreIdSet = React.useMemo(() => new Set(favoriteStoreIds), [favoriteStoreIds]);
  const userLocation = React.useMemo(() => {
    const { locationMode, locationLatitude, locationLongitude } = onboardingState;
    return locationMode === "share" && locationLatitude !== null && locationLongitude !== null
      ? { latitude: locationLatitude, longitude: locationLongitude } : null;
  }, [onboardingState.locationMode, onboardingState.locationLatitude, onboardingState.locationLongitude]);
  const origin = selected ?? userLocation;
  // Fetch the catalogue once per map visit, not on every keystroke.
  React.useEffect(() => {
    if (activeTab !== "map") return;
    let current = true;
    setLoading(true);
    void listStores().then(({ data, error }) => {
      if (!current) return;
      setStores(data);
      setMessage(error ?? null);
    }).catch(() => {
      if (current) setMessage("Stores could not be loaded. Leave and reopen Map to retry.");
    }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [activeTab]);

  const filteredStores = React.useMemo(() => stores
    .filter((store) => (selected || matchesStoreFilter(store, query)) &&
      (!favoriteFilterActive || favoriteStoreIdSet.has(store.id)))
    .map((store) => ({ ...store, distance_km: origin ? calculateHaversineDistanceKm(
      origin.latitude, origin.longitude, store.latitude, store.longitude,
    ) : null }))
    .sort((a, b) => (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity) || a.name.localeCompare(b.name)),
  [stores, selected, query, favoriteFilterActive, favoriteStoreIdSet, origin]);
  const activeStore = filteredStores.find((store) => store.id === focusedStoreId) ?? filteredStores[0];
  const distanceScope = getStoreDistanceScope(filteredStores, Boolean(origin));
  const region = React.useMemo<Region>(() => {
    const center = focusMode === "search" && selected ? selected
      : focusMode === "user" && userLocation && distanceScope !== "outside" ? userLocation
      : activeStore ?? origin ?? DEFAULT_REGION;
    return { latitude: center.latitude, longitude: center.longitude, latitudeDelta: 0.045, longitudeDelta: 0.045 };
  }, [distanceScope, focusMode, selected, userLocation, activeStore?.latitude, activeStore?.longitude, origin]);

  React.useEffect(() => {
    mapRef.current?.animateToRegion(region, 220);
  }, [region]);
  React.useEffect(() => {
    if (userLocation) setFocusMode("user");
  }, [userLocation]);
  React.useEffect(() => {
    if (!filteredStores.some((store) => store.id === focusedStoreId)) {
      setFocusedStoreId(filteredStores[0]?.id ?? "");
    }
  }, [filteredStores, focusedStoreId]);

  const setQuery = React.useCallback((value: string) => {
    cancel();
    setSelected(null);
    setMessage(null);
    updateQuery(value);
    setFocusMode(value.trim() ? "store" : userLocation ? "user" : "store");
  }, [cancel, setSelected, userLocation]);

  const focusStore = React.useCallback((store: MarketStore) => {
    Keyboard.dismiss();
    setFocusMode("store");
    setFocusedStoreId(store.id);
    mapRef.current?.animateToRegion({ ...store, latitudeDelta: 0.025, longitudeDelta: 0.025 }, 220);
  }, []);
  const searchLocation = React.useCallback(() => {
    Keyboard.dismiss();
    void search(query);
  }, [query, search]);
  const submitSearch = React.useCallback(() => {
    // Only a retailer-name query is a store search. Matching an address or
    // city in the catalogue must still resolve the requested location.
    const normalize = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, "");
    const text = normalize(query);
    const brandMatch = text.length >= 2 && filteredStores.find((store) =>
      store.brand && normalize(store.brand).includes(text));
    if (brandMatch && !selected) focusStore(brandMatch);
    else searchLocation();
  }, [query, filteredStores, selected, focusStore, searchLocation]);
  const selectLocation = React.useCallback((place: MapSearchLocation) => {
    cancel();
    Keyboard.dismiss();
    setSelected(place);
    setFocusedStoreId("");
    setFocusMode("search");
    updateQuery(place.label);
  }, [cancel, setSelected]);

  React.useEffect(() => {
    if (!selected) return;
    setFocusMode("search");
    setFocusedStoreId("");
    updateQuery(selected.label);
    mapRef.current?.animateToRegion({ ...selected, latitudeDelta: 0.045, longitudeDelta: 0.045 }, 220);
  }, [selected]);

  const initializedPostal = React.useRef("");
  // Initialize a saved postal search once per setting change; clearing stays cleared.
  React.useEffect(() => {
    if (activeTab !== "map") return;
    const setting = `${onboardingState.locationMode}:${onboardingState.postalCode ?? ""}`;
    if (initializedPostal.current === setting) return;
    initializedPostal.current = setting;
    if (onboardingState.locationMode !== "postal" || !onboardingState.postalCode) return;
    updateQuery(onboardingState.postalCode);
    setSelected(null);
    void search(onboardingState.postalCode);
  }, [activeTab, onboardingState.locationMode, onboardingState.postalCode, search, setSelected]);

  React.useEffect(() => {
    if (!pendingStoreId) return;
    const target = stores.find((store) => store.id === pendingStoreId);
    if (!target) return;
    focusStore(target);
    setPendingStoreId(null);
    showToast(`Open ${target.name} on map.`);
  }, [stores, pendingStoreId, focusStore, showToast]);
  const openStore = React.useCallback((storeId: string, _storeName?: string) => {
    if (!storeId || storeId === "unlinked-store") return;
    setQuery("");
    setPendingStoreId(storeId);
    setFocusMode("store");
    setFavoriteFilterActive(false);
    onOpenMap();
    onHideOnboarding();
  }, [setQuery, onHideOnboarding, onOpenMap]);
  const focusUserLocation = React.useCallback((latitude: number, longitude: number) => {
    setQuery("");
    setFavoriteFilterActive(false);
    setFocusMode("user");
    setFocusedStoreId("");
    mapRef.current?.animateToRegion({ latitude, longitude, latitudeDelta: 0.04, longitudeDelta: 0.04 }, 260);
  }, [setQuery]);
  const personalizationStoreOptions = React.useMemo(() => {
    const names = [...new Set(stores.map((store) => (store.brand ?? store.name).trim()).filter(Boolean))].slice(0, 10);
    return names.length ? names : ["Costco", "Walmart", "No Frills", "Save-On-Foods", "T&T", "H Mart"];
  }, [stores]);

  return {
    favoriteFilterActive, distanceScope, filteredStores, focusedStoreId, focusStore,
    focusUserLocation, loading, mapRef, message: location.message ?? message, openStore,
    personalizationStoreOptions, query, region, setFocusMode, setFavoriteFilterActive,
    setFocusedStoreId, setMessage, setQuery, userLocation, submitSearch, searchLocation,
    selectLocation, locationResults: location.results, searchingLocation: location.loading,
    searchOrigin: selected,
  };
}
