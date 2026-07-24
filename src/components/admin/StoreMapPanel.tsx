import React from "react";
import {
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import type { AdminStore } from "../../services/adminBackoffice";
import {
  getStoreBrandLogoKey,
  type StoreBrandLogoKey,
} from "../../utils/storeBrandLogo";

type StoreLogoAsset = number | string | { uri?: string };

const WEB_STORE_MAP_IFRAME_STYLE: React.CSSProperties = {
  width: "100%",
  height: "100%",
  minHeight: 280,
  border: 0,
  display: "block",
};

const STORE_LOGO_ASSETS: Record<StoreBrandLogoKey, StoreLogoAsset> = {
  hMart: require("../../../assets/store-logos/h-mart.png"),
  hannamMart: require("../../../assets/store-logos/hannam-mart.png"),
  priceSmart: require("../../../assets/store-logos/pricesmart-foods.png"),
  marketRibbon: require("../../../assets/store-logos/market-ribbon.png"),
  tAndT: require("../../../assets/store-logos/t-and-t.png"),
};

function getStoreLogoUrl(store: AdminStore): string | null {
  const logoKey = getStoreBrandLogoKey(store);
  if (!logoKey) return null;
  const asset = STORE_LOGO_ASSETS[logoKey];
  if (typeof asset === "string") return asset;
  if (typeof asset === "object" && typeof asset.uri === "string") {
    return asset.uri;
  }
  return null;
}

function safeScriptJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function storeLeafletMapSrcDoc(
  stores: AdminStore[],
  selectedStore: AdminStore | null,
): string {
  const points = stores
    .map((store) => ({
      id: store.id,
      name: store.brand ? `${store.brand} - ${store.name}` : store.name,
      address: store.address || store.area,
      storeType: store.store_type,
      isActive: store.is_active,
      logoUrl: getStoreLogoUrl(store),
      latitude: Number(store.latitude),
      longitude: Number(store.longitude),
      selected: selectedStore?.id === store.id,
    }))
    .filter((store) => Number.isFinite(store.latitude) && Number.isFinite(store.longitude))
    .slice(0, 200);

  if (points.length === 0) return "";

  const selectedPoint = points.find((store) => store.selected) ?? points[0];
  const hasSelectedPoint = points.some((store) => store.selected);

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    .leaflet-popup-content { margin: 8px 10px; color: #2f3748; font-size: 12px; }
    .store-logo-marker {
      box-sizing: border-box;
      overflow: hidden;
      border: 3px solid #fff;
      border-radius: 50%;
      background: #fff;
      box-shadow: 0 3px 8px rgba(0, 0, 0, 0.28);
    }
    .store-logo-marker.is-selected {
      border-color: #0b7d5a;
      box-shadow: 0 3px 10px rgba(11, 125, 90, 0.38);
    }
    .store-logo-marker img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"></script>
  <script>
    const points = ${safeScriptJson(points)};
    const selectedPoint = ${safeScriptJson(selectedPoint)};
    const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
    const map = L.map("map", { scrollWheelZoom: false }).setView(
      [selectedPoint.latitude, selectedPoint.longitude],
      points.length > 1 ? 11 : 14
    );
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    const bounds = [];
    const markerLayer = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 36
    });
    points.forEach((point) => {
      const markerSize = point.selected ? 54 : 46;
      const logoIcon = point.logoUrl
        ? L.divIcon({
            className: "store-logo-marker" + (point.selected ? " is-selected" : ""),
            html: '<img src="' + escapeHtml(point.logoUrl) + '" alt="" />',
            iconSize: [markerSize, markerSize],
            iconAnchor: [markerSize / 2, markerSize / 2],
            popupAnchor: [0, -(markerSize / 2)]
          })
        : null;
      const marker = L.marker(
        [point.latitude, point.longitude],
        logoIcon
          ? { icon: logoIcon, zIndexOffset: point.selected ? 1000 : 0 }
          : { zIndexOffset: point.selected ? 1000 : 0 }
      );
      marker.bindPopup(
        "<strong>" + escapeHtml(point.name) + "</strong><br />" +
        escapeHtml(point.address) + "<br />" +
        point.latitude.toFixed(6) + ", " + point.longitude.toFixed(6) + "<br />" +
        escapeHtml(point.storeType) + " · " + (point.isActive ? "Active" : "Inactive")
      );
      if (point.selected) marker.openPopup();
      markerLayer.addLayer(marker);
      bounds.push([point.latitude, point.longitude]);
    });
    map.addLayer(markerLayer);
    if (${hasSelectedPoint ? "true" : "false"}) {
      map.setView([selectedPoint.latitude, selectedPoint.longitude], 16);
    } else if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [28, 28], maxZoom: 14 });
    }
  </script>
</body>
</html>`;
}

type StoreMapPanelProps = {
  stores: AdminStore[];
  selectedStore: AdminStore | null;
  styles: Record<string, any>;
  onOpenMap: (store: AdminStore) => void;
};

export default function StoreMapPanel({
  stores,
  selectedStore,
  styles: st,
  onOpenMap,
}: StoreMapPanelProps) {
  const srcDoc = React.useMemo(
    () => storeLeafletMapSrcDoc(stores, selectedStore),
    [stores, selectedStore],
  );

  return (
    <View style={st.storeMapPanel}>
      <View style={st.storeMapHeader}>
        <View style={st.listMain}>
          <Text style={st.fieldLabel}>Store Map</Text>
          <Text style={st.dataMuted}>
            {selectedStore
              ? `${selectedStore.brand ? `${selectedStore.brand} - ` : ""}${selectedStore.name}${selectedStore.address || selectedStore.area ? ` | ${selectedStore.address || selectedStore.area}` : ""}`
              : "No store selected"}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => selectedStore && onOpenMap(selectedStore)}
          style={[st.btn, st.btnGhost, !selectedStore && st.btnDisabled]}
          disabled={!selectedStore}
        >
          <Text style={st.btnGhostText}>Open Map</Text>
        </Pressable>
      </View>
      {srcDoc && Platform.OS === "web" ? (
        <iframe
          title="Store map"
          srcDoc={srcDoc}
          style={WEB_STORE_MAP_IFRAME_STYLE}
          loading="lazy"
        />
      ) : (
        <View style={st.storeMapEmpty}>
          <Text style={st.dataMuted}>No valid coordinates to display.</Text>
        </View>
      )}
    </View>
  );
}
