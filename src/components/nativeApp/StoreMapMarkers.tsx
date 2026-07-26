import React from "react";
import { Image, Text, View } from "react-native";
import type MapView from "react-native-maps";
import { Marker, type Region } from "react-native-maps";
import type { MarketStore } from "../../services/marketData";
import { st } from "../../screens/nativeAppStyles";
import { marketingPalette as C } from "../../shared/design/palette";
import {
  getStoreDisplayName,
  getStoreInitials,
  getStoreLogo,
  StoreStarIcon,
} from "./StoreMapResultCard";

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
    latitude:
      group.reduce((sum, store) => sum + store.latitude, 0) / group.length,
    longitude:
      group.reduce((sum, store) => sum + store.longitude, 0) / group.length,
  }));
}

type StoreMapMarkersProps = {
  mapRef: React.RefObject<MapView | null>;
  stores: MarketStore[];
  visibleRegion: Region;
  favoriteStoreIds: Set<string>;
  focusedStoreId: string;
  onFocusStoreId: (storeId: string) => void;
};

export function StoreMapMarkers({
  mapRef,
  stores,
  visibleRegion,
  favoriteStoreIds,
  focusedStoreId,
  onFocusStoreId,
}: StoreMapMarkersProps) {
  const clusters = React.useMemo(
    () => buildStoreClusters(stores, visibleRegion),
    [stores, visibleRegion],
  );

  return clusters.map((cluster) => {
    if (cluster.stores.length > 1) {
      const hasFavorite = cluster.stores.some((store) =>
        favoriteStoreIds.has(store.id),
      );
      return (
        <Marker
          key={cluster.key}
          coordinate={{
            latitude: cluster.latitude,
            longitude: cluster.longitude,
          }}
          accessibilityLabel={`${cluster.stores.length} stores in this area`}
          onPress={() => {
            mapRef.current?.animateToRegion(
              {
                latitude: cluster.latitude,
                longitude: cluster.longitude,
                latitudeDelta: Math.max(
                  visibleRegion.latitudeDelta * 0.48,
                  0.008,
                ),
                longitudeDelta: Math.max(
                  visibleRegion.longitudeDelta * 0.48,
                  0.008,
                ),
              },
              240,
            );
          }}
        >
          <View
            style={[
              st.storeMapClusterMarker,
              hasFavorite && st.storeMapClusterMarkerFavorite,
            ]}
          >
            <Text style={st.storeMapClusterMarkerText}>
              {cluster.stores.length}
            </Text>
            {hasFavorite ? (
              <View style={st.storeMapMarkerFavoriteBadge}>
                <StoreStarIcon size={11} filled color={C.white} />
              </View>
            ) : null}
          </View>
        </Marker>
      );
    }

    const store = cluster.stores[0];
    const active = store.id === focusedStoreId;
    const favorite = favoriteStoreIds.has(store.id);
    const logo = getStoreLogo(store);
    return (
      <Marker
        key={cluster.key}
        coordinate={{
          latitude: store.latitude,
          longitude: store.longitude,
        }}
        accessibilityLabel={getStoreDisplayName(store)}
        onPress={() => onFocusStoreId(store.id)}
        zIndex={active ? 2 : 1}
      >
        <View style={st.storeMapMarkerWrap}>
          <View
            style={[
              st.storeMapMarker,
              logo && st.storeMapMarkerWithLogo,
              active && st.storeMapMarkerActive,
            ]}
          >
            {logo ? (
              <Image
                source={logo}
                resizeMode="contain"
                style={st.storeMapMarkerImage}
              />
            ) : (
              <Text
                style={[
                  st.storeMapMarkerText,
                  active && st.storeMapMarkerTextActive,
                ]}
              >
                {getStoreInitials(store)}
              </Text>
            )}
          </View>
          {favorite ? (
            <View style={st.storeMapMarkerFavoriteBadge}>
              <StoreStarIcon size={11} filled color={C.white} />
            </View>
          ) : null}
        </View>
      </Marker>
    );
  });
}
