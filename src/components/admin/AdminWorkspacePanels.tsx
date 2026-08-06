import React from "react";
import { Text } from "react-native";
import type { AdminWorkspaceActions } from "../../hooks/useAdminWorkspaceActions";
import type { AdminWorkspaceData } from "../../hooks/useAdminWorkspaceData";
import { st } from "../../screens/adminScreenStyles";
import AdminFlyerPanel from "./AdminFlyerPanel";
import AdminOverviewPanel from "./AdminOverviewPanel";
import AdminProductsPanel from "./AdminProductsPanel";
import AdminStoresPanel from "./AdminStoresPanel";
import AdminUsersPanel from "./AdminUsersPanel";

type Props = { data: AdminWorkspaceData; actions: AdminWorkspaceActions };

export default function AdminWorkspacePanels({ data, actions }: Props) {
  const { state, backend, dashboard } = data;
  const { adminUi, status, store } = state;
  return (
    <>
      {adminUi.activeMenu !== "overview" ? <Text style={st.panelTitle}>{data.panelTitle}</Text> : null}
      {adminUi.activeMenu === "overview" ? (
        <AdminOverviewPanel
          cards={dashboard.overviewCards}
          products={backend.products}
          productsLoading={backend.loading.products}
          productDataHealth={dashboard.productDataHealth}
          schemaReadiness={backend.schemaReadiness}
          schemaReadinessLoading={backend.loading.schema}
          productIdentityReviews={backend.reviews}
          productIdentityReviewsLoading={backend.loading.reviews}
          resolvingReviewId={status.resolvingReviewId}
          styles={st}
          onManageProducts={() => adminUi.setActiveMenu("products")}
          onResolveReview={(id) => void actions.handleResolveIdentityReview(id)}
          onMergeReview={(id, candidates, target) => void actions.handleMergeProducts(candidates, target, id)}
        />
      ) : null}
      {adminUi.activeMenu === "users" ? (
        <AdminUsersPanel users={backend.users} loading={backend.loading.users} styles={st} />
      ) : null}
      {adminUi.activeMenu === "products" ? (
        <AdminProductsPanel
          products={backend.products}
          filteredProducts={dashboard.filteredProducts}
          loading={backend.loading.products}
          submitting={status.submitting}
          deletingKey={status.deletingKey}
          productSearchQuery={adminUi.productSearchQuery}
          productCategoryFilter={adminUi.productCategoryFilter}
          productBrandFilter={adminUi.productBrandFilter}
          productStoreFilter={adminUi.productStoreFilter}
          productSaleDateFilter={adminUi.productSaleDateFilter}
          productOnSaleOnly={adminUi.productOnSaleOnly}
          productSort={adminUi.productSort}
          productCategoryOptions={dashboard.productFilterCategoryOptions}
          productBrandOptions={dashboard.productBrandFilterOptions}
          productStoreOptions={dashboard.productStoreFilterOptions}
          productSortOptions={dashboard.productSortOptions}
          productActiveFilterCount={dashboard.productActiveFilterCount}
          productPriceStats={dashboard.productPriceStats}
          styles={st}
          onImportProductsCsv={actions.productActions.handleImportProductsCsv}
          onDownloadProductCsvTemplate={actions.productActions.handleDownloadProductCsvTemplate}
          onExportProductsCsv={actions.productActions.handleExportProductsCsv}
          onOpenAddProduct={actions.productActions.handleOpenAddProduct}
          onProductSearchChange={adminUi.setProductSearchQuery}
          onProductCategoryChange={adminUi.setProductCategoryFilter}
          onProductBrandChange={adminUi.setProductBrandFilter}
          onProductStoreChange={adminUi.setProductStoreFilter}
          onProductSaleDateChange={adminUi.setProductSaleDateFilter}
          onProductOnSaleOnlyChange={adminUi.setProductOnSaleOnly}
          onProductSortChange={adminUi.setProductSort}
          onResetProductFilters={actions.productActions.handleResetProductFilters}
          onEditProduct={actions.productActions.handleOpenEditProduct}
          onDeleteProduct={actions.productActions.handleDeleteProduct}
          onDeleteProducts={actions.productActions.handleDeleteProducts}
          onMergeProducts={actions.handleMergeProducts}
        />
      ) : null}
      {adminUi.activeMenu === "stores" ? (
        <AdminStoresPanel
          stores={dashboard.displayStores}
          filteredStores={dashboard.filteredStores}
          selectedStore={dashboard.selectedStoreForMap}
          storePriceStats={dashboard.storePriceStats}
          storeAuditLogs={dashboard.storeAuditLogs}
          storeSearchQuery={store.storeSearchQuery}
          storeBrandFilter={store.storeBrandFilter}
          storeStatusFilter={store.storeStatusFilter}
          storeTypeFilter={store.storeTypeFilter}
          storeBrandOptions={dashboard.storeBrandOptions}
          storeTypeOptions={dashboard.storeTypeOptions}
          storeActiveFilterCount={dashboard.storeActiveFilterCount}
          deletingKey={status.deletingKey}
          submitting={status.submitting}
          styles={st}
          onOpenAddStore={actions.storeActions.handleOpenAddStore}
          onImportStoresCsv={actions.storeActions.handleImportStoresCsv}
          onExportStoresCsv={actions.storeActions.handleExportStoresCsv}
          onStoreSearchChange={store.setStoreSearchQuery}
          onStoreBrandChange={store.setStoreBrandFilter}
          onStoreStatusChange={store.setStoreStatusFilter}
          onStoreTypeChange={store.setStoreTypeFilter}
          onResetStoreFilters={() => {
            store.setStoreSearchQuery("");
            store.setStoreBrandFilter("all");
            store.setStoreStatusFilter("all");
            store.setStoreTypeFilter("all");
          }}
          onOpenMapUrl={actions.handleOpenMapUrl}
          onSelectStore={(id) => store.setSelectedStoreMapId((current) => current === id ? null : id)}
          onEditStore={actions.storeActions.handleOpenEditStore}
          onRequestDeleteStore={actions.storeActions.handleRequestDeleteStore}
        />
      ) : null}
      {adminUi.activeMenu === "flyer" ? (
        <AdminFlyerPanel
          rows={adminUi.flyerRows}
          processing={adminUi.flyerProcessing}
          progress={adminUi.flyerProgress}
          selectedCount={dashboard.flyerSelectedCount}
          styles={st}
          onPickFile={actions.flyerActions.handlePickFlyerFile}
          onAddRow={actions.flyerActions.handleAddFlyerRow}
          onRemoveSelected={actions.flyerActions.handleRemoveSelectedFlyerRows}
          onExportCsv={actions.flyerActions.handleExportFlyerCsv}
          onExportProductCsv={actions.flyerActions.handleExportFlyerProductCsv}
          onSaveSelectedImages={actions.flyerActions.handleSaveSelectedFlyerImages}
          onClear={actions.flyerActions.handleClearFlyerImport}
          onUpdateRow={adminUi.updateFlyerRow}
        />
      ) : null}
    </>
  );
}
