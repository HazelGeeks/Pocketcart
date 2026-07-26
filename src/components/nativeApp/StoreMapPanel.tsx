import React from "react";
import { FlatList, Text, View } from "react-native";
import MapView, { type Region } from "react-native-maps";
import type { MarketStore } from "../../services/marketData";
import { st } from "../../screens/nativeAppStyles";
import {
  getStoreScopeMessage,
  getStoreScopeTitle,
  type StoreDistanceScope,
} from "../../utils/storeDistanceScope";
import { StoreMapControls } from "./StoreMapControls";
import { StoreMapMarkers } from "./StoreMapMarkers";
import { StoreMapModeButton } from "./StoreMapModeButton";
import {
  getStoreDisplayName,
  StoreResultCard,
} from "./StoreMapResultCard";

type StoreMapPanelProps = {
  mapRef: React.RefObject<MapView | null>;
  query: string;
  message: string | null;
  loading: boolean;
  stores: MarketStore[];
  favoriteStoreIds: string[];
  favoriteStoresLoading: boolean;
  favoriteFilterActive: boolean;
  focusedStoreId: string;
  region: Region;
  distanceScope: StoreDistanceScope;
  userLocation: { latitude: number; longitude: number } | null;
  locatingUser: boolean;
  topInset: number;
  bottomInset: number;
  horizontalPad: number;
  onChangeQuery: (value: string) => void;
  onSetFavoriteFilter: (active: boolean) => void;
  onToggleFavoriteStore: (storeId: string, storeName: string) => void;
  onFocusStoreId: (storeId: string) => void;
  onFocusStore: (store: MarketStore) => void;
  onUseCurrentLocation: () => void;
  onViewStoreInHome: (storeId: string, storeName: string) => void;
};

export function StoreMapPanel(props: StoreMapPanelProps) {
  const {
    mapRef,
    query,
    message,
    loading,
    stores,
    favoriteStoreIds,
    favoriteStoresLoading,
    favoriteFilterActive,
    focusedStoreId,
    region,
    distanceScope,
    userLocation,
    locatingUser,
    topInset,
    bottomInset,
    horizontalPad,
    onChangeQuery,
    onSetFavoriteFilter,
    onToggleFavoriteStore,
    onFocusStoreId,
    onFocusStore,
    onUseCurrentLocation,
    onViewStoreInHome,
  } = props;
  const [viewMode, setViewMode] = React.useState<"map" | "list">("map");
  const [visibleRegion, setVisibleRegion] = React.useState(region);
  const favoriteStoreIdSet = React.useMemo(
    () => new Set(favoriteStoreIds),
    [favoriteStoreIds],
  );
  const activeStore =
    stores.find((store) => store.id === focusedStoreId) ?? stores[0] ?? null;
  const scopeTitle = getStoreScopeTitle(
    distanceScope,
    favoriteFilterActive,
  );
  const scopeMessage = favoriteFilterActive
    ? `${stores.length} saved ${
        stores.length === 1 ? "store" : "stores"
      }`
    : getStoreScopeMessage(distanceScope, stores.length);
  const showScopeNotice =
    !favoriteFilterActive && distanceScope !== "nearby";

  React.useEffect(() => {
    setVisibleRegion(region);
  }, [
    region.latitude,
    region.latitudeDelta,
    region.longitude,
    region.longitudeDelta,
  ]);

  const controls = (overlay: boolean) => (
    <StoreMapControls
      overlay={overlay}
      topInset={topInset}
      horizontalPad={horizontalPad}
      query={query}
      storeCount={stores.length}
      favoriteStoreCount={favoriteStoreIds.length}
      favoriteFilterActive={favoriteFilterActive}
      userLocation={userLocation}
      locatingUser={locatingUser}
      onChangeQuery={onChangeQuery}
      onSetFavoriteFilter={onSetFavoriteFilter}
      onUseCurrentLocation={onUseCurrentLocation}
    />
  );

  const openDeals = (store: MarketStore) =>
    onViewStoreInHome(store.id, getStoreDisplayName(store));
  const toggleFavorite = (store: MarketStore) =>
    onToggleFavoriteStore(store.id, getStoreDisplayName(store));

  if (viewMode === "list") {
    return (
      <View style={st.storeListScreen}>
        {controls(false)}
        <FlatList
          data={stores}
          keyExtractor={(store) => store.id}
          style={st.storeListScroll}
          contentContainerStyle={{
            paddingHorizontal: horizontalPad,
            paddingBottom: 104 + Math.max(bottomInset, 10),
          }}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              <View style={st.storeListHeaderRow}>
                <View style={st.storeListHeaderCopy}>
                  <Text style={st.storeListTitle}>{scopeTitle}</Text>
                  <Text style={st.storeListSubtitle}>
                    {loading || favoriteStoresLoading
                      ? "Updating results…"
                      : scopeMessage}
                  </Text>
                </View>
                <StoreMapModeButton
                  mode="map"
                  onPress={() => setViewMode("map")}
                />
              </View>
              {message ? (
                <Text style={st.storeMapMessage}>{message}</Text>
              ) : null}
            </>
          }
          ListEmptyComponent={
            !loading ? (
              <View style={st.storeMapEmptyCard}>
                <Text style={st.storeMapEmptyTitle}>
                  {favoriteFilterActive
                    ? "No saved stores yet"
                    : "No stores found"}
                </Text>
                <Text style={st.storeMapEmptyText}>
                  {favoriteFilterActive
                    ? "Switch to All stores, then save the stores you visit often."
                    : "Try another store name or view all supported stores."}
                </Text>
              </View>
            ) : null
          }
          ItemSeparatorComponent={() => (
            <View style={st.storeListCardSeparator} />
          )}
          renderItem={({ item: store }) => (
            <StoreResultCard
              store={store}
              active={store.id === focusedStoreId}
              favorite={favoriteStoreIdSet.has(store.id)}
              onFocus={() => {
                onFocusStore(store);
                setViewMode("map");
              }}
              onToggleFavorite={() => toggleFavorite(store)}
              onViewDeals={() => openDeals(store)}
            />
          )}
        />
      </View>
    );
  }

  return (
    <View style={st.storeMapScreen}>
      <MapView
        ref={mapRef}
        initialRegion={region}
        showsUserLocation={Boolean(userLocation)}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        onRegionChangeComplete={setVisibleRegion}
        style={st.storeMapCanvas}
      >
        <StoreMapMarkers
          mapRef={mapRef}
          stores={stores}
          visibleRegion={visibleRegion}
          favoriteStoreIds={favoriteStoreIdSet}
          focusedStoreId={focusedStoreId}
          onFocusStoreId={onFocusStoreId}
        />
      </MapView>
      {controls(true)}

      <View
        style={[
          st.storeMapBottomSheet,
          { bottom: 88 + Math.max(bottomInset, 10) },
        ]}
      >
        <View style={st.storeMapSheetHandle} />
        <View style={st.storeMapSheetHeader}>
          <View style={st.storeMapSheetHeaderCopy}>
            <Text style={st.storeMapSheetTitle}>{scopeTitle}</Text>
            <Text
              style={[
                st.storeMapSheetSubtitle,
                showScopeNotice && st.storeMapScopeNotice,
              ]}
            >
              {loading || favoriteStoresLoading
                ? "Updating map…"
                : scopeMessage}
            </Text>
          </View>
          <StoreMapModeButton
            mode="list"
            onPress={() => setViewMode("list")}
          />
        </View>
        {message ? <Text style={st.storeMapMessage}>{message}</Text> : null}
        {activeStore ? (
          <StoreResultCard
            store={activeStore}
            active
            compact
            favorite={favoriteStoreIdSet.has(activeStore.id)}
            onFocus={() => onFocusStore(activeStore)}
            onToggleFavorite={() => toggleFavorite(activeStore)}
            onViewDeals={() => openDeals(activeStore)}
          />
        ) : !loading ? (
          <Text style={st.storeMapEmptyText}>
            {favoriteFilterActive
              ? "No saved stores yet. Switch to All stores and save one."
              : "No matches. Try another store or address."}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
