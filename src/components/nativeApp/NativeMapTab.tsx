import React from "react";
import type useNativePermissions from "../../hooks/useNativePermissions";
import type useNativeStoreMap from "../../hooks/useNativeStoreMap";
import { StoreMapPanel } from "./StoreMapPanel";

type Props = {
  bottomInset: number;
  horizontalPad: number;
  map: ReturnType<typeof useNativeStoreMap>;
  onViewStoreInHome: (storeId: string, storeName: string) => void;
  permissions: ReturnType<typeof useNativePermissions>;
  topInset: number;
};

export function NativeMapTab({
  bottomInset,
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
      message={map.message}
      loading={map.loading}
      stores={map.filteredStores}
      focusedStoreId={map.focusedStoreId}
      region={map.region}
      userLocation={map.userLocation}
      locatingUser={permissions.requesting}
      topInset={topInset}
      bottomInset={bottomInset}
      horizontalPad={horizontalPad}
      onChangeQuery={map.setQuery}
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
