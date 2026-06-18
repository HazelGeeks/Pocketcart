import React from "react";
import { Pressable, Text, View } from "react-native";
import type { AdminAuditLog, AdminStore } from "../../services/adminBackoffice";
import { storeMapUrl, toDateOnlyLabel, type StorePriceStats } from "../../utils/adminScreenHelpers";
import AdminStoreFilters from "./AdminStoreFilters";
import AdminStoreList from "./AdminStoreList";
import StoreMapPanel from "./StoreMapPanel";

type Props = {
  stores: AdminStore[];
  filteredStores: AdminStore[];
  selectedStore: AdminStore | null;
  storePriceStats: Map<string, StorePriceStats>;
  storeAuditLogs: AdminAuditLog[];
  storeSearchQuery: string;
  storeAreaFilter: string;
  storeStatusFilter: string;
  storeTypeFilter: string;
  storeAreaOptions: string[];
  storeTypeOptions: string[];
  storeActiveFilterCount: number;
  deletingKey: string | null;
  submitting: boolean;
  styles: any;
  onOpenAddStore: () => void;
  onImportStoresCsv: () => void;
  onExportStoresCsv: () => void;
  onStoreSearchChange: (value: string) => void;
  onStoreAreaChange: (value: string) => void;
  onStoreStatusChange: (value: string) => void;
  onStoreTypeChange: (value: string) => void;
  onResetStoreFilters: () => void;
  onOpenMapUrl: (url: string) => void;
  onSelectStore: (storeId: string) => void;
  onEditStore: (store: AdminStore) => void;
  onRequestDeleteStore: (store: AdminStore) => void;
};

export default function AdminStoresPanel({
  stores,
  filteredStores,
  selectedStore,
  storePriceStats,
  storeAuditLogs,
  storeSearchQuery,
  storeAreaFilter,
  storeStatusFilter,
  storeTypeFilter,
  storeAreaOptions,
  storeTypeOptions,
  storeActiveFilterCount,
  deletingKey,
  submitting,
  styles: st,
  onOpenAddStore,
  onImportStoresCsv,
  onExportStoresCsv,
  onStoreSearchChange,
  onStoreAreaChange,
  onStoreStatusChange,
  onStoreTypeChange,
  onResetStoreFilters,
  onOpenMapUrl,
  onSelectStore,
  onEditStore,
  onRequestDeleteStore,
}: Props) {
  return (
    <View style={st.dataCard}>
      <View style={st.dataCardHeader}>
        <Text style={st.dataCardTitle}>Store Management</Text>
        <View style={st.inlineRow}>
          <Pressable accessibilityRole="button" onPress={onOpenAddStore} style={[st.btn, st.btnPrimary]} disabled={submitting}>
            <Text style={st.btnPrimaryText}>Add Store</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onImportStoresCsv} style={[st.btn, st.btnGhost]} disabled={submitting}>
            <Text style={st.btnGhostText}>Import Stores CSV</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onExportStoresCsv} style={[st.btn, st.btnGhost, stores.length === 0 && st.btnDisabled]} disabled={stores.length === 0 || submitting}>
            <Text style={st.btnGhostText}>Export Stores CSV</Text>
          </Pressable>
        </View>
      </View>

      <AdminStoreFilters
        searchQuery={storeSearchQuery}
        areaFilter={storeAreaFilter}
        statusFilter={storeStatusFilter}
        typeFilter={storeTypeFilter}
        areaOptions={storeAreaOptions}
        typeOptions={storeTypeOptions}
        filteredCount={filteredStores.length}
        totalCount={stores.length}
        activeFilterCount={storeActiveFilterCount}
        styles={st}
        onSearchChange={onStoreSearchChange}
        onAreaChange={onStoreAreaChange}
        onStatusChange={onStoreStatusChange}
        onTypeChange={onStoreTypeChange}
        onReset={onResetStoreFilters}
      />

      <StoreMapPanel stores={filteredStores} selectedStore={selectedStore} styles={st} onOpenMap={(store) => onOpenMapUrl(storeMapUrl(store))} />

      <AdminStoreList
        stores={filteredStores}
        totalStores={stores.length}
        selectedStoreId={selectedStore?.id ?? null}
        priceStats={storePriceStats}
        deletingKey={deletingKey}
        submitting={submitting}
        styles={st}
        onSelectStore={onSelectStore}
        onOpenMap={(store) => onOpenMapUrl(storeMapUrl(store))}
        onEditStore={onEditStore}
        onRequestDeleteStore={onRequestDeleteStore}
      />

      <View style={st.auditCard}>
        <Text style={st.fieldLabel}>Recent Store Audit Log</Text>
        {storeAuditLogs.length === 0 ? (
          <Text style={st.dataMuted}>No store audit log entries yet.</Text>
        ) : (
          storeAuditLogs.map((log) => (
            <View key={log.id} style={st.auditRow}>
              <View style={st.listMain}>
                <Text style={st.listTitle}>{log.summary}</Text>
                <Text style={st.dataMuted}>{log.action} | {log.actor_email ?? log.actor_user_id ?? "unknown"}</Text>
              </View>
              <Text style={st.listDate}>{toDateOnlyLabel(log.created_at)}</Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
}
