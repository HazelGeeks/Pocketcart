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
  onChangeQuery: (value: string) => void;
  onFocusStoreId: (storeId: string) => void;
  onFocusStore: (store: MarketStore) => void;
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
  onChangeQuery,
  onFocusStoreId,
  onFocusStore,
  onViewStoreInHome,
}: StoreMapPanelProps) {
  const getStoreDisplayName = (store: MarketStore) =>
    store.brand ? `${store.brand} - ${store.name}` : store.name;

  return (
    <View style={st.sectionStack}>
      <Text style={st.sectionTitle}>Map</Text>
      <Text style={st.sectionSub}>Search stores and jump directly to their location.</Text>

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
        <MapView ref={mapRef} initialRegion={region} style={st.mapView}>
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
