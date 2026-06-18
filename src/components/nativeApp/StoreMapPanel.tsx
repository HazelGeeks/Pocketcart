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
}: StoreMapPanelProps) {
  return (
    <View style={st.sectionStack}>
      <Text style={st.sectionTitle}>Map</Text>
      <Text style={st.sectionSub}>Search stores and jump directly to their location.</Text>

      <View style={st.searchCard}>
        <TextInput
          value={query}
          onChangeText={onChangeQuery}
          placeholder="Search store or area"
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
            return (
              <Marker
                key={store.id}
                coordinate={{
                  latitude: store.latitude,
                  longitude: store.longitude,
                }}
                title={store.name}
                description={`${store.area} • ${store.price_note ?? ""}`}
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
          <Text style={st.itemMeta}>No matches found. Try another store or area.</Text>
        </View>
      ) : (
        stores.map((store) => {
          const active = store.id === focusedStoreId;
          return (
            <Pressable
              key={store.id}
              accessibilityRole="button"
              onPress={() => onFocusStore(store)}
              style={[st.rowCard, active && st.rowCardActive]}
            >
              <Text style={st.itemName}>{store.name}</Text>
              <Text style={st.itemMeta}>{store.area}</Text>
              <Text style={st.storePrice}>{store.price_note ?? "Price note unavailable"}</Text>
            </Pressable>
          );
        })
      )}
    </View>
  );
}
