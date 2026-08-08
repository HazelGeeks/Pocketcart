import React from "react";
import { Pressable, Text, View } from "react-native";
import useLayout from "../../hooks/useLayout";
import type { AdminStore } from "../../services/adminBackoffice";
import {
  toDateOnlyLabel,
  type StorePriceStats,
} from "../../utils/adminScreenHelpers";
import { AdminTechnicalDetailsPanel } from "./AdminTechnicalDetails";

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
  const { isXl } = useLayout();
  const [expandedStoreIds, setExpandedStoreIds] = React.useState<Set<string>>(
    new Set(),
  );

  if (totalStores === 0) {
    return <Text style={st.dataMuted}>No stores yet.</Text>;
  }

  if (stores.length === 0) {
    return <Text style={st.dataMuted}>No stores match current filters.</Text>;
  }

  return (
    <View style={st.storeListTable}>
      {isXl ? (
        <View style={st.storeListColumnHeader}>
          <Text style={[st.storeListColumnLabel, st.storeListStoreColumn]}>Store</Text>
          <Text style={[st.storeListColumnLabel, st.storeListStatusColumn]}>Status · Type</Text>
          <Text style={[st.storeListColumnLabel, st.storeListCoverageColumn]}>Coverage</Text>
          <Text style={[st.storeListColumnLabel, st.storeListLatestColumn]}>Latest · Created</Text>
          <Text style={[st.storeListColumnLabel, st.storeListActionsColumn]}>Actions</Text>
        </View>
      ) : null}
      {stores.map((store) => {
        const deleteKey = `store:${store.id}`;
        const deleting = deletingKey === deleteKey;
        const stats = priceStats.get(store.id);
        const selectedOnMap = selectedStoreId === store.id;
        const priceCount = stats?.priceCount ?? 0;
        const productCount = stats?.productIds.size ?? 0;
        const detailsExpanded = expandedStoreIds.has(store.id);
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
            style={[st.storeListRow, selectedOnMap && st.storeListRowActive]}
            disabled={deleting || submitting}
          >
            <View style={[st.storeListRowMain, !isXl && st.storeListRowMainCompact]}>
              <View style={[st.storeListStoreColumn, !isXl && st.storeListStoreColumnCompact]}>
                <Text numberOfLines={1} style={st.listTitle}>{store.brand ?? store.name}</Text>
                {store.brand ? <Text numberOfLines={1} style={st.dataMuted}>{store.name}</Text> : null}
                <Text numberOfLines={2} style={st.dataMuted}>
                  {store.address || store.area || "Address unavailable"}
                </Text>
                {store.phone || store.website || store.hours ? (
                  <Text numberOfLines={2} style={st.storeListSupportingText}>
                    {[store.phone, store.website, store.hours].filter(Boolean).join(" | ")}
                  </Text>
                ) : null}
                {store.price_note ? (
                  <Text numberOfLines={2} style={st.storeListSupportingText}>{store.price_note}</Text>
                ) : null}
              </View>

              <View style={[st.storeListStatusColumn, !isXl && st.storeListMetricCompact]}>
                <View style={[st.storeMetaChip, !store.is_active && st.storeInactiveChip]}>
                  <Text style={[st.storeMetaChipText, !store.is_active && st.storeInactiveChipText]}>
                    {store.is_active ? "Active" : "Inactive"}
                  </Text>
                </View>
                <View style={st.storeMetaChip}>
                  <Text style={st.storeMetaChipText}>{store.store_type}</Text>
                </View>
              </View>

              <View style={[st.storeListCoverageColumn, !isXl && st.storeListMetricCompact]}>
                <View style={st.storeListLabelValue}>
                  <Text style={st.storeListMetricLabel}>Prices</Text>
                  <Text style={st.storeListMetricValue}>{priceCount}</Text>
                </View>
                <View style={st.storeListLabelValue}>
                  <Text style={st.storeListMetricLabel}>Products</Text>
                  <Text style={st.storeListMetricValue}>{productCount}</Text>
                </View>
              </View>

              <View style={[st.storeListLatestColumn, !isXl && st.storeListMetricCompact]}>
                <View style={st.storeListLabelValue}>
                  <Text style={st.storeListMetricLabel}>Latest price</Text>
                  <Text style={st.storeListMetricValue}>{latestObserved}</Text>
                </View>
                <View style={st.storeListLabelValue}>
                  <Text style={st.storeListMetricLabel}>Created</Text>
                  <Text style={st.storeListMetricSecondary}>{toDateOnlyLabel(store.created_at)}</Text>
                </View>
              </View>

              <View style={[st.storeListActionsColumn, !isXl && st.storeListActionsCompact]}>
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
                    accessibilityLabel={`${detailsExpanded ? "Hide" : "Show"} technical details for ${
                      store.brand ? `${store.brand} ` : ""
                    }${store.name}`}
                    accessibilityState={{ expanded: detailsExpanded }}
                    onPress={(event) => {
                      event.stopPropagation();
                      setExpandedStoreIds((current) => {
                        const next = new Set(current);
                        if (next.has(store.id)) next.delete(store.id);
                        else next.add(store.id);
                        return next;
                      });
                    }}
                    style={[st.btn, st.btnGhost, st.storeActionBtn]}
                    disabled={deleting || submitting}
                  >
                    <Text style={st.btnGhostText}>
                      {detailsExpanded ? "Hide" : "Details"}
                    </Text>
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
                    <Text style={st.btnDangerText}>{deleting ? "Deleting…" : "Delete"}</Text>
                  </Pressable>
                </View>
              </View>
            </View>
            {detailsExpanded ? (
              <View style={st.storeListDetailsPanel}>
                <AdminTechnicalDetailsPanel
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
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
