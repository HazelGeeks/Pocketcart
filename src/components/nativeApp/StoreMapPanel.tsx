import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import MapView, { Marker, type Region } from "react-native-maps";
import Svg, { Circle, Line, Path } from "react-native-svg";
import type { MarketStore } from "../../services/marketData";
import { marketingPalette as C } from "../../shared/design/palette";
import { st } from "../../screens/nativeAppStyles";
import { getStoreBrandLogoKey } from "../../utils/storeBrandLogo";

type StoreMapPanelProps = {
  mapRef: React.RefObject<MapView | null>;
  query: string;
  message: string | null;
  loading: boolean;
  stores: MarketStore[];
  focusedStoreId: string;
  region: Region;
  userLocation: { latitude: number; longitude: number } | null;
  locatingUser: boolean;
  topInset: number;
  bottomInset: number;
  horizontalPad: number;
  onChangeQuery: (value: string) => void;
  onFocusStoreId: (storeId: string) => void;
  onFocusStore: (store: MarketStore) => void;
  onUseCurrentLocation: () => void;
  onViewStoreInHome: (storeId: string, storeName: string) => void;
};

function getStoreDisplayName(store: MarketStore) {
  return store.brand ? `${store.brand} - ${store.name}` : store.name;
}

function getStoreInitials(store: MarketStore) {
  const source = store.brand?.trim() || store.name.trim();
  const initials = source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return initials || "PC";
}

const STORE_LOGOS = {
  hMart: require("../../../assets/store-logos/h-mart.png"),
  hannamMart: require("../../../assets/store-logos/hannam-mart.png"),
  priceSmart: require("../../../assets/store-logos/pricesmart-foods.png"),
  marketRibbon: require("../../../assets/store-logos/market-ribbon.png"),
  tAndT: require("../../../assets/store-logos/t-and-t.png"),
};

function getStoreLogo(store: MarketStore) {
  const logoKey = getStoreBrandLogoKey(store);
  return logoKey ? STORE_LOGOS[logoKey] : null;
}

function formatDistance(distance: number | null | undefined) {
  if (distance == null) return null;
  return distance < 1
    ? `${Math.round(distance * 1000)} m away`
    : `${distance.toFixed(1)} km away`;
}

function buildStoreClusters(stores: MarketStore[], region: Region) {
  const latitudeCell = Math.max(region.latitudeDelta / 8, 0.0012);
  const longitudeCell = Math.max(region.longitudeDelta / 6, 0.0012);
  const groups = new Map<string, MarketStore[]>();

  stores.forEach((store) => {
    const row = Math.round(store.latitude / latitudeCell);
    const column = Math.round(store.longitude / longitudeCell);
    const key = `${row}:${column}`;
    const group = groups.get(key);
    if (group) group.push(store);
    else groups.set(key, [store]);
  });

  return [...groups.entries()].map(([key, group]) => ({
    key,
    stores: group,
    latitude: group.reduce((sum, store) => sum + store.latitude, 0) / group.length,
    longitude: group.reduce((sum, store) => sum + store.longitude, 0) / group.length,
  }));
}

export function StoreMapPanel({
  mapRef,
  query,
  message,
  loading,
  stores,
  focusedStoreId,
  region,
  userLocation,
  locatingUser,
  topInset,
  bottomInset,
  horizontalPad,
  onChangeQuery,
  onFocusStoreId,
  onFocusStore,
  onUseCurrentLocation,
  onViewStoreInHome,
}: StoreMapPanelProps) {
  const [viewMode, setViewMode] = React.useState<"map" | "list">("map");
  const [visibleRegion, setVisibleRegion] = React.useState(region);
  const activeStore =
    stores.find((store) => store.id === focusedStoreId) ?? stores[0] ?? null;
  const storeClusters = React.useMemo(
    () => buildStoreClusters(stores, visibleRegion),
    [stores, visibleRegion],
  );

  React.useEffect(() => {
    setVisibleRegion(region);
  }, [region.latitude, region.latitudeDelta, region.longitude, region.longitudeDelta]);

  const renderSearchControls = (overlay: boolean) => (
    <View
      style={[
        overlay ? st.storeMapControlsOverlay : st.storeMapControlsList,
        { paddingTop: topInset + 10, paddingHorizontal: horizontalPad },
      ]}
    >
      <View style={st.storeMapSearchRow}>
        <View style={st.storeMapSearchBox}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Circle cx={10.8} cy={10.8} r={6.8} stroke={C.textMuted} strokeWidth={2} />
            <Line x1={16} y1={16} x2={21} y2={21} stroke={C.textMuted} strokeWidth={2} strokeLinecap="round" />
          </Svg>
          <TextInput
            value={query}
            onChangeText={onChangeQuery}
            placeholder="Search stores or addresses"
            placeholderTextColor={C.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            style={st.storeMapSearchInput}
          />
          {query ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear store search"
              hitSlop={8}
              onPress={() => onChangeQuery("")}
              style={st.storeMapClearButton}
            >
              <Text style={st.storeMapClearText}>×</Text>
            </Pressable>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Center map on my current location"
          disabled={locatingUser}
          onPress={onUseCurrentLocation}
          style={[st.storeMapLocationButton, userLocation && st.storeMapLocationButtonActive]}
        >
          {locatingUser ? (
            <ActivityIndicator color={C.primaryDeep} size="small" />
          ) : (
            <Svg width={25} height={25} viewBox="0 0 24 24" fill="none">
              <Circle cx={12} cy={10} r={4} stroke={C.primaryDeep} strokeWidth={2} />
              <Path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z" stroke={C.primaryDeep} strokeWidth={2} strokeLinejoin="round" />
            </Svg>
          )}
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={st.storeMapFilterRow}
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => onChangeQuery("")}
          style={[st.storeMapFilterButton, !query && st.storeMapFilterButtonActive]}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path d="M4 7h10M18 7h2M4 17h2M10 17h10" stroke={C.primaryDeep} strokeWidth={2} strokeLinecap="round" />
            <Circle cx={16} cy={7} r={2} stroke={C.primaryDeep} strokeWidth={2} />
            <Circle cx={8} cy={17} r={2} stroke={C.primaryDeep} strokeWidth={2} />
          </Svg>
          <Text style={st.storeMapFilterText}>All stores</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onUseCurrentLocation}
          style={[st.storeMapFilterButton, userLocation && st.storeMapFilterButtonActive]}
        >
          <Text style={st.storeMapFilterText}>Nearest</Text>
        </Pressable>
        <View style={st.storeMapFilterButton}>
          <Text style={st.storeMapFilterText}>
            {stores.length} {stores.length === 1 ? "store" : "stores"}
          </Text>
        </View>
      </ScrollView>
    </View>
  );

  if (viewMode === "list") {
    return (
      <View style={st.storeListScreen}>
        {renderSearchControls(false)}
        <FlatList
          data={stores}
          keyExtractor={(store) => store.id}
          style={st.storeListScroll}
          contentContainerStyle={{
            paddingHorizontal: horizontalPad,
            paddingBottom: 104 + Math.max(bottomInset, 10),
          }}
          nestedScrollEnabled
          scrollEnabled
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={(
            <>
              <View style={st.storeListHeaderRow}>
                <View>
                  <Text style={st.storeListTitle}>Nearby stores</Text>
                  <Text style={st.storeListSubtitle}>
                    {loading ? "Updating results…" : `${stores.length} places with current price data`}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setViewMode("map")}
                  style={st.storeMapModeButton}
                >
                  <MapIcon />
                  <Text style={st.storeMapModeButtonText}>Map</Text>
                </Pressable>
              </View>
              {message ? <Text style={st.storeMapMessage}>{message}</Text> : null}
            </>
          )}
          ListEmptyComponent={!loading ? (
            <View style={st.storeMapEmptyCard}>
              <Text style={st.storeMapEmptyTitle}>No stores found</Text>
              <Text style={st.storeMapEmptyText}>Try a different store name or address.</Text>
            </View>
          ) : null}
          ItemSeparatorComponent={() => <View style={st.storeListCardSeparator} />}
          renderItem={({ item: store }) => (
            <StoreResultCard
              store={store}
              active={store.id === focusedStoreId}
              onFocus={() => {
                onFocusStore(store);
                setViewMode("map");
              }}
              onViewDeals={() => onViewStoreInHome(store.id, getStoreDisplayName(store))}
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
        {storeClusters.map((cluster) => {
          if (cluster.stores.length > 1) {
            return (
              <Marker
                key={cluster.key}
                coordinate={{ latitude: cluster.latitude, longitude: cluster.longitude }}
                accessibilityLabel={`${cluster.stores.length} stores in this area`}
                onPress={() => {
                  mapRef.current?.animateToRegion(
                    {
                      latitude: cluster.latitude,
                      longitude: cluster.longitude,
                      latitudeDelta: Math.max(visibleRegion.latitudeDelta * 0.48, 0.008),
                      longitudeDelta: Math.max(visibleRegion.longitudeDelta * 0.48, 0.008),
                    },
                    240,
                  );
                }}
              >
                <View style={st.storeMapClusterMarker}>
                  <Text style={st.storeMapClusterMarkerText}>{cluster.stores.length}</Text>
                </View>
              </Marker>
            );
          }

          const store = cluster.stores[0];
          const active = store.id === focusedStoreId;
          const logo = getStoreLogo(store);
          return (
            <Marker
              key={cluster.key}
              coordinate={{ latitude: store.latitude, longitude: store.longitude }}
              accessibilityLabel={getStoreDisplayName(store)}
              onPress={() => onFocusStoreId(store.id)}
              zIndex={active ? 2 : 1}
            >
              <View style={[
                st.storeMapMarker,
                logo && st.storeMapMarkerWithLogo,
                active && st.storeMapMarkerActive,
              ]}>
                {logo ? (
                  <Image source={logo} resizeMode="contain" style={st.storeMapMarkerImage} />
                ) : (
                  <Text style={[st.storeMapMarkerText, active && st.storeMapMarkerTextActive]}>
                    {getStoreInitials(store)}
                  </Text>
                )}
              </View>
            </Marker>
          );
        })}
      </MapView>

      {renderSearchControls(true)}

      <View
        style={[
          st.storeMapBottomSheet,
          { bottom: 80 + Math.max(bottomInset, 10) },
        ]}
      >
        <View style={st.storeMapSheetHandle} />
        <View style={st.storeMapSheetHeader}>
          <View>
            <Text style={st.storeMapSheetTitle}>
              {stores.length} nearby {stores.length === 1 ? "store" : "stores"}
            </Text>
            <Text style={st.storeMapSheetSubtitle}>
              {loading ? "Updating map…" : "Tap a marker to explore current prices"}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => setViewMode("list")}
            style={st.storeMapModeButton}
          >
            <ListIcon />
            <Text style={st.storeMapModeButtonText}>List</Text>
          </Pressable>
        </View>

        {message ? <Text style={st.storeMapMessage}>{message}</Text> : null}
        {activeStore ? (
          <StoreResultCard
            store={activeStore}
            active
            compact
            onFocus={() => onFocusStore(activeStore)}
            onViewDeals={() => onViewStoreInHome(activeStore.id, getStoreDisplayName(activeStore))}
          />
        ) : !loading ? (
          <Text style={st.storeMapEmptyText}>No matches. Try another store or address.</Text>
        ) : null}
      </View>
    </View>
  );
}

function StoreResultCard({
  store,
  active,
  compact = false,
  onFocus,
  onViewDeals,
}: {
  store: MarketStore;
  active: boolean;
  compact?: boolean;
  onFocus: () => void;
  onViewDeals: () => void;
}) {
  const distance = formatDistance(store.distance_km);
  const logo = getStoreLogo(store);
  return (
    <View style={[st.storeResultCard, active && st.storeResultCardActive, compact && st.storeResultCardCompact]}>
      <Pressable accessibilityRole="button" onPress={onFocus} style={st.storeResultMain}>
        <View style={[st.storeResultBadge, logo && st.storeResultBadgeWithLogo]}>
          {logo ? (
            <Image source={logo} resizeMode="contain" style={st.storeResultLogo} />
          ) : (
            <Text style={st.storeResultBadgeText}>{getStoreInitials(store)}</Text>
          )}
        </View>
        <View style={st.storeResultCopy}>
          <Text style={st.storeResultName} numberOfLines={1}>{getStoreDisplayName(store)}</Text>
          <Text style={st.storeResultAddress} numberOfLines={1}>
            {store.address || store.area || "Address unavailable"}
          </Text>
          <View style={st.storeResultMetaRow}>
            {distance ? <Text style={st.storeResultDistance}>{distance}</Text> : null}
            {distance && store.price_note ? <View style={st.storeResultDivider} /> : null}
            {store.price_note ? (
              <Text style={st.storeResultPrice} numberOfLines={1}>{store.price_note}</Text>
            ) : null}
          </View>
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View deals at ${getStoreDisplayName(store)}`}
        onPress={onViewDeals}
        style={st.storeResultDealsButton}
      >
        <Text style={st.storeResultDealsText}>View deals</Text>
        <Text style={st.storeResultDealsArrow}>›</Text>
      </Pressable>
    </View>
  );
}

function ListIcon() {
  return (
    <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
      <Path d="M7 6h12M7 12h12M7 18h12M4 6h.01M4 12h.01M4 18h.01" stroke={C.white} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}

function MapIcon() {
  return (
    <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
      <Path d="m4 6 5-2 6 2 5-2v14l-5 2-6-2-5 2V6Z" stroke={C.white} strokeWidth={2} strokeLinejoin="round" />
      <Path d="M9 4v14M15 6v14" stroke={C.white} strokeWidth={2} />
    </Svg>
  );
}
