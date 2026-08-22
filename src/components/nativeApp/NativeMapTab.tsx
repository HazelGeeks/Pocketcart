import type useFavoriteStores from "../../hooks/useFavoriteStores";
import type useNativePermissions from "../../hooks/useNativePermissions";
import type useNativeStoreMap from "../../hooks/useNativeStoreMap";
import { StoreMapPanel } from "./StoreMapPanel";

type Props = {
  bottomInset: number;
  favoriteStores: ReturnType<typeof useFavoriteStores>;
  horizontalPad: number;
  map: ReturnType<typeof useNativeStoreMap>;
  onViewStoreInHome: (storeId: string, storeName: string) => void;
  permissions: ReturnType<typeof useNativePermissions>;
  topInset: number;
};

export function NativeMapTab({
  bottomInset,
  favoriteStores,
  horizontalPad,
  map,
  onViewStoreInHome,
  permissions,
  topInset,
}: Props) {
  return (
    <StoreMapPanel
      mapRef={map.mapRef}
      query={map.query}
      message={map.message ?? favoriteStores.syncMessage}
      loading={map.loading}
      stores={map.filteredStores}
      favoriteStoreIds={favoriteStores.storeIds}
      favoriteStoresLoading={!favoriteStores.loaded}
      favoriteFilterActive={map.favoriteFilterActive}
      focusedStoreId={map.focusedStoreId}
      region={map.region}
      distanceScope={map.distanceScope}
      userLocation={map.userLocation}
      locatingUser={permissions.requesting}
      topInset={topInset}
      bottomInset={bottomInset}
      horizontalPad={horizontalPad}
      onChangeQuery={map.setQuery}
      onSetFavoriteFilter={map.setFavoriteFilterActive}
      onToggleFavoriteStore={favoriteStores.toggleStore}
      onFocusStoreId={(storeId) => {
        map.setFocusMode("store");
        map.setFocusedStoreId(storeId);
      }}
      onFocusStore={map.focusStore}
      onUseCurrentLocation={() => {
        void permissions.shareLocation("map");
      }}
      onViewStoreInHome={onViewStoreInHome}
    />
  );
}
