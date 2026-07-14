import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import MapView, { Marker, type Region } from "react-native-maps";
import type { MarketStore } from "../../services/marketData";
import { marketingPalette as C } from "../../shared/design/palette";
import { st } from "../../screens/nativeAppStyles";

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
  onChangeQuery: (value: string) => void;
  onFocusStoreId: (storeId: string) => void;
  onFocusStore: (store: MarketStore) => void;
  onUseCurrentLocation: () => void;
  onViewStoreInHome: (storeId: string, storeName: string) => void;
};

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
  onChangeQuery,
  onFocusStoreId,
  onFocusStore,
  onUseCurrentLocation,
  onViewStoreInHome,
}: StoreMapPanelProps) {
  const getStoreDisplayName = (store: MarketStore) =>
    store.brand ? `${store.brand} - ${store.name}` : store.name;

  return (
    <View style={st.sectionStack}>
      <Text style={st.sectionTitle}>Map</Text>
      <Text style={st.sectionSub}>
        Find nearby stores from your location or search by store and address.
      </Text>

      <View style={st.storeActionRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Center map on my current location"
          disabled={locatingUser}
          onPress={onUseCurrentLocation}
          style={[st.authBtn, st.storeActionBtn, st.authBtnPrimary]}
        >
          <Text style={st.authBtnPrimaryText}>
            {locatingUser ? "Finding location..." : "My location"}
          </Text>
        </Pressable>
        <Text style={st.itemMeta}>
          {userLocation ? "Nearest stores are sorted by distance." : "Location is not set yet."}
        </Text>
      </View>

      <View style={st.searchCard}>
        <TextInput
          value={query}
          onChangeText={onChangeQuery}
          placeholder="Search store or address"
          placeholderTextColor={C.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          style={st.searchInput}
        />
      </View>

      {message ? (
        <View style={st.rowCard}>
          <Text style={st.itemMeta}>{message}</Text>
        </View>
      ) : null}

      <View style={st.mapCard}>
        <MapView
          ref={mapRef}
          initialRegion={region}
          showsUserLocation={Boolean(userLocation)}
          showsMyLocationButton={false}
          style={st.mapView}
        >
          {stores.map((store) => {
            const active = store.id === focusedStoreId;
            const displayName = getStoreDisplayName(store);
            return (
              <Marker
                key={store.id}
                coordinate={{
                  latitude: store.latitude,
                  longitude: store.longitude,
                }}
                title={displayName}
                description={`${store.address || store.area || "Address unavailable"} • ${store.price_note ?? ""}`}
                pinColor={active ? C.primaryDeep : C.primary}
                onPress={() => onFocusStoreId(store.id)}
              />
            );
          })}
        </MapView>
      </View>

      <Text style={st.resultMeta}>Search results: {stores.length}</Text>
      {loading ? (
        <View style={st.rowCard}>
          <Text style={st.itemMeta}>Loading stores...</Text>
        </View>
      ) : stores.length === 0 ? (
        <View style={st.rowCard}>
          <Text style={st.itemMeta}>No matches found. Try another store or address.</Text>
        </View>
      ) : (
        stores.map((store) => {
          const active = store.id === focusedStoreId;
          const displayName = getStoreDisplayName(store);
          return (
            <Pressable
              key={store.id}
              accessibilityRole="button"
              onPress={() => onFocusStore(store)}
              style={[st.rowCard, active && st.rowCardActive]}
            >
              <Text style={st.itemName}>{store.brand ?? store.name}</Text>
              <Text style={st.itemMeta}>
                {store.brand ? store.name : store.address || store.area || "Address unavailable"}
              </Text>
              {store.brand && (store.address || store.area) ? (
                <Text style={st.itemMeta}>{store.address || store.area}</Text>
              ) : null}
              {store.distance_km != null ? (
                <Text style={st.itemMeta}>
                  {store.distance_km < 1
                    ? `${Math.round(store.distance_km * 1000)} m away`
                    : `${store.distance_km.toFixed(1)} km away`}
                </Text>
              ) : null}
              <Text style={st.storePrice}>{store.price_note ?? "Price note unavailable"}</Text>
              <View style={st.storeActionRow}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => onViewStoreInHome(store.id, displayName)}
                  style={[st.authBtn, st.authBtnSecondary, st.storeActionBtn]}
                >
                  <Text style={st.authBtnSecondaryText}>View deals</Text>
                </Pressable>
              </View>
            </Pressable>
          );
        })
      )}
    </View>
  );
}
