import React from "react";
import { Pressable, Text, View } from "react-native";
import type { AdminStore } from "../../services/adminBackoffice";
import {
  toDateOnlyLabel,
  type StorePriceStats,
} from "../../utils/adminScreenHelpers";
import AdminTechnicalDetails from "./AdminTechnicalDetails";

type AdminStoreListProps = {
  stores: AdminStore[];
  totalStores: number;
  selectedStoreId: string | null;
  priceStats: Map<string, StorePriceStats>;
  deletingKey: string | null;
  submitting: boolean;
  styles: Record<string, any>;
  onSelectStore: (storeId: string) => void;
  onOpenMap: (store: AdminStore) => void;
  onEditStore: (store: AdminStore) => void;
  onRequestDeleteStore: (store: AdminStore) => void;
};

export default function AdminStoreList({
  stores,
  totalStores,
  selectedStoreId,
  priceStats,
  deletingKey,
  submitting,
  styles: st,
  onSelectStore,
  onOpenMap,
  onEditStore,
  onRequestDeleteStore,
}: AdminStoreListProps) {
  if (totalStores === 0) {
    return <Text style={st.dataMuted}>No stores yet.</Text>;
  }

  if (stores.length === 0) {
    return <Text style={st.dataMuted}>No stores match current filters.</Text>;
  }

  return (
    <View style={st.storeGrid}>
      {stores.map((store) => {
        const deleteKey = `store:${store.id}`;
        const deleting = deletingKey === deleteKey;
        const stats = priceStats.get(store.id);
        const selectedOnMap = selectedStoreId === store.id;
        const priceCount = stats?.priceCount ?? 0;
        const productCount = stats?.productIds.size ?? 0;
        const latestObserved =
          stats && stats.latestObservedAtMs >= 0
            ? toDateOnlyLabel(new Date(stats.latestObservedAtMs).toISOString())
            : "No prices";

        return (
          <Pressable
            key={store.id}
            accessibilityRole="button"
            accessibilityLabel={`Select ${store.brand ? `${store.brand} ` : ""}${store.name} on map`}
            onPress={() => onSelectStore(store.id)}
            style={[st.storeGridCard, selectedOnMap && st.storeListRowActive]}
            disabled={deleting || submitting}
          >
            <View style={st.listMain}>
              <Text style={st.listTitle}>{store.brand ?? store.name}</Text>
              <Text style={st.dataMuted}>
                {store.brand ? store.name : store.address || store.area || "Address unavailable"}
              </Text>
              <View style={st.storeInlineChipRow}>
                {store.brand ? (
                  <View style={st.storeMetaChip}>
                    <Text style={st.storeMetaChipText}>Brand {store.brand}</Text>
                  </View>
                ) : null}
                <View style={[st.storeMetaChip, !store.is_active && st.storeInactiveChip]}>
                  <Text style={[st.storeMetaChipText, !store.is_active && st.storeInactiveChipText]}>
                    {store.is_active ? "Active" : "Inactive"}
                  </Text>
                </View>
                <View style={st.storeMetaChip}>
                  <Text style={st.storeMetaChipText}>{store.store_type}</Text>
                </View>
                <View style={st.storeMetaChip}>
                  <Text style={st.storeMetaChipText}>Prices {priceCount}</Text>
                </View>
                <View style={st.storeMetaChip}>
                  <Text style={st.storeMetaChipText}>Products {productCount}</Text>
                </View>
                <View style={st.storeMetaChip}>
                  <Text style={st.storeMetaChipText}>Latest {latestObserved}</Text>
                </View>
              </View>
              {store.address && store.brand ? (
                <Text style={st.dataMuted}>{store.address}</Text>
              ) : null}
              {store.phone || store.website || store.hours ? (
                <Text style={st.dataMuted}>
                  {[store.phone, store.website, store.hours].filter(Boolean).join(" | ")}
                </Text>
              ) : null}
              {store.price_note ? (
                <Text style={st.dataMuted}>{store.price_note}</Text>
              ) : null}
              <AdminTechnicalDetails
                accessibilityContext={`${store.brand ? `${store.brand} ` : ""}${store.name}`}
                items={[
                  { key: "store-id", label: "Store ID", value: store.id },
                  ...(store.place_id
                    ? [{ key: "place-id", label: "Google Place ID", value: store.place_id }]
                    : []),
                  {
                    key: "coordinates",
                    label: "Coordinates",
                    value: `${store.latitude}, ${store.longitude}`,
                  },
                ]}
                styles={st}
              />
            </View>
            <View style={st.storeListRight}>
              <Text style={st.listDate}>{toDateOnlyLabel(store.created_at)}</Text>
              <View style={st.storeActionRow}>
                <Pressable
                  accessibilityRole="button"
                  onPress={(event) => {
                    event.stopPropagation();
                    onOpenMap(store);
                  }}
                  style={[st.btn, st.btnGhost, st.storeActionBtn]}
                  disabled={deleting || submitting}
                >
                  <Text style={st.btnGhostText}>Map</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={(event) => {
                    event.stopPropagation();
                    onEditStore(store);
                  }}
                  style={[st.btn, st.btnGhost, st.storeActionBtn]}
                  disabled={deleting || submitting}
                >
                  <Text style={st.btnGhostText}>Edit</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={(event) => {
                    event.stopPropagation();
                    onRequestDeleteStore(store);
                  }}
                  style={[st.btn, st.btnDanger, st.storeActionBtn, deleting && st.btnDisabled]}
                  disabled={deleting || submitting}
                >
                  <Text style={st.btnDangerText}>{deleting ? "..." : "Delete"}</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
