import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { AdminNoAccessPanel, AdminSignInPanel } from "../components/admin/AdminAuthPanels";
import AdminSidebar from "../components/admin/AdminSidebar";
import AdminOverviewPanel from "../components/admin/AdminOverviewPanel";
import AdminFlyerPanel from "../components/admin/AdminFlyerPanel";
import AdminProductFormModal from "../components/admin/AdminProductFormModal";
import AdminProductsPanel from "../components/admin/AdminProductsPanel";
import AdminStoreDeleteModal from "../components/admin/AdminStoreDeleteModal";
import AdminStoreFormModal from "../components/admin/AdminStoreFormModal";
import AdminStoreImportPreviewModal from "../components/admin/AdminStoreImportPreviewModal";
import AdminStoresPanel from "../components/admin/AdminStoresPanel";
import { AdminNoticePanel, AdminSupabaseSetupNotice } from "../components/admin/AdminStatusPanels";
import { AdminHeader, AdminMobileMenu } from "../components/admin/AdminWorkspaceChrome";
import useAdminDashboardData from "../hooks/useAdminDashboardData";
import useAdminFlyerImport from "../hooks/useAdminFlyerImport";
import useAdminProductActions from "../hooks/useAdminProductActions";
import useAdminStoreActions from "../hooks/useAdminStoreActions";
import useLayout from "../hooks/useLayout";
import { hasSupabaseEnv } from "../services/supabaseClient";
import {
  type AdminAuditLog,
  type AdminPriceEntry,
  type AdminProduct,
  type AdminStore,
} from "../services/adminBackoffice";
import {
  useAdminAuditLogsQuery,
  useAdminPricesQuery,
  useAdminProductsQuery,
  useAdminSignInMutation,
  useAdminSignOutMutation,
  useAdminStoresQuery,
  useAdminUserQuery,
  useCreateAdminPriceEntryMutation,
  useCreateAdminAuditLogMutation,
  useCreateAdminProductMutation,
  useCreateAdminStoreMutation,
  useDeleteAdminPriceEntryMutation,
  useDeleteAdminProductMutation,
  useDeleteAdminStoreMutation,
  useUpdateAdminProductMutation,
  useUpdateAdminStoreMutation,
  useUpdateAdminPriceEntryMutation,
  useUploadAdminProductImageMutation,
} from "../hooks/useAdminBackofficeQueries";
import {
  useAdminStore,
  type AdminMenuKey,
} from "../state/adminStore";
import { type StoreImportPreviewRow } from "../utils/adminValidation";
import {
  ADMIN_EMAIL_ALLOWLIST,
  createStorePriceSet,
  toNonNegativeCount,
  type StorePriceSetInput,
} from "../utils/adminScreenHelpers";
import { st } from "./adminScreenStyles";

export default function AdminScreen({ onBack }: { onBack: () => void }) {
  const { isLg } = useLayout();
  const allowlistEnabled = ADMIN_EMAIL_ALLOWLIST.length > 0;

  const [authEmail, setAuthEmail] = React.useState("");
  const [authPassword, setAuthPassword] = React.useState("");

  const [notice, setNotice] = React.useState<string | null>(null);

  const [productName, setProductName] = React.useState("");
  const [productCategory, setProductCategory] = React.useState("");
  const [productCategoryCustom, setProductCategoryCustom] = React.useState("");
  const [productThumb, setProductThumb] = React.useState("");
  const [productStorePriceSets, setProductStorePriceSets] = React.useState<StorePriceSetInput[]>([
    createStorePriceSet(),
  ]);
  const [productPeriodStartDate, setProductPeriodStartDate] = React.useState("");
  const [productPeriodEndDate, setProductPeriodEndDate] = React.useState("");
  const [productModalOpen, setProductModalOpen] = React.useState(false);
  const [editingProductId, setEditingProductId] = React.useState<string | null>(null);
  const [productImageUploading, setProductImageUploading] = React.useState(false);
  const [editingPriceId, setEditingPriceId] = React.useState<string | null>(null);
  const [priceProductId, setPriceProductId] = React.useState("");
  const [priceStoreId, setPriceStoreId] = React.useState("");
  const [priceValue, setPriceValue] = React.useState("");
  const [priceStartDate, setPriceStartDate] = React.useState("");
  const [priceEndDate, setPriceEndDate] = React.useState("");
  const [editingStoreId, setEditingStoreId] = React.useState<string | null>(null);
  const [storeModalOpen, setStoreModalOpen] = React.useState(false);
  const [storeName, setStoreName] = React.useState("");
  const [storeArea, setStoreArea] = React.useState("");
  const [storeLatitude, setStoreLatitude] = React.useState("");
  const [storeLongitude, setStoreLongitude] = React.useState("");
  const [storePriceNote, setStorePriceNote] = React.useState("");
  const [storeAddress, setStoreAddress] = React.useState("");
  const [storePlaceId, setStorePlaceId] = React.useState("");
  const [storePhone, setStorePhone] = React.useState("");
  const [storeWebsite, setStoreWebsite] = React.useState("");
  const [storeHours, setStoreHours] = React.useState("");
  const [storeType, setStoreType] = React.useState("grocery");
  const [storeIsActive, setStoreIsActive] = React.useState(true);
  const [storeSearchQuery, setStoreSearchQuery] = React.useState("");
  const [storeAreaFilter, setStoreAreaFilter] = React.useState("all");
  const [storeStatusFilter, setStoreStatusFilter] = React.useState("all");
  const [storeTypeFilter, setStoreTypeFilter] = React.useState("all");
  const [selectedStoreMapId, setSelectedStoreMapId] = React.useState<string | null>(null);
  const [storeImportPreviewRows, setStoreImportPreviewRows] = React.useState<StoreImportPreviewRow[]>([]);
  const [storeImportPreviewOpen, setStoreImportPreviewOpen] = React.useState(false);
  const [storeDeleteCandidate, setStoreDeleteCandidate] = React.useState<AdminStore | null>(null);

  const [submitting, setSubmitting] = React.useState(false);
  const [deletingKey, setDeletingKey] = React.useState<string | null>(null);

  const activeMenu = useAdminStore((state) => state.activeMenu);
  const setActiveMenu = useAdminStore((state) => state.setActiveMenu);
  const sidebarCollapsed = useAdminStore((state) => state.sidebarCollapsed);
  const setSidebarCollapsed = useAdminStore((state) => state.setSidebarCollapsed);
  const productSearchQuery = useAdminStore((state) => state.productSearchQuery);
  const setProductSearchQuery = useAdminStore((state) => state.setProductSearchQuery);
  const productCategoryFilter = useAdminStore((state) => state.productCategoryFilter);
  const setProductCategoryFilter = useAdminStore((state) => state.setProductCategoryFilter);
  const productStoreFilter = useAdminStore((state) => state.productStoreFilter);
  const setProductStoreFilter = useAdminStore((state) => state.setProductStoreFilter);
  const productPriceMin = useAdminStore((state) => state.productPriceMin);
  const setProductPriceMin = useAdminStore((state) => state.setProductPriceMin);
  const productPriceMax = useAdminStore((state) => state.productPriceMax);
  const setProductPriceMax = useAdminStore((state) => state.setProductPriceMax);
  const productSort = useAdminStore((state) => state.productSort);
  const setProductSort = useAdminStore((state) => state.setProductSort);
  const resetProductFilters = useAdminStore((state) => state.resetProductFilters);
  const flyerRows = useAdminStore((state) => state.flyerRows);
  const setFlyerRows = useAdminStore((state) => state.setFlyerRows);
  const flyerProcessing = useAdminStore((state) => state.flyerProcessing);
  const setFlyerProcessing = useAdminStore((state) => state.setFlyerProcessing);
  const flyerProgress = useAdminStore((state) => state.flyerProgress);
  const setFlyerProgress = useAdminStore((state) => state.setFlyerProgress);
  const updateFlyerRow = useAdminStore((state) => state.updateFlyerRow);
  const addFlyerRow = useAdminStore((state) => state.addFlyerRow);
  const removeSelectedFlyerRows = useAdminStore((state) => state.removeSelectedFlyerRows);
  const clearFlyerImport = useAdminStore((state) => state.clearFlyerImport);
  const resetAdminUi = useAdminStore((state) => state.resetAdminUi);

  const adminUserQuery = useAdminUserQuery();
  const authUser = adminUserQuery.data ?? null;

  const hasAdminAccess = authUser
    ? !allowlistEnabled ||
      ADMIN_EMAIL_ALLOWLIST.includes(authUser.email.trim().toLowerCase())
    : false;
  const dataQueriesEnabled = Boolean(authUser && hasAdminAccess);
  const productsQuery = useAdminProductsQuery(dataQueriesEnabled);
  const storesQuery = useAdminStoresQuery(dataQueriesEnabled);
  const pricesQuery = useAdminPricesQuery(dataQueriesEnabled);
  const auditLogsQuery = useAdminAuditLogsQuery(dataQueriesEnabled);
  const signInMutation = useAdminSignInMutation();
  const signOutMutation = useAdminSignOutMutation();
  const createProductMutation = useCreateAdminProductMutation();
  const updateProductMutation = useUpdateAdminProductMutation();
  const createPriceEntryMutation = useCreateAdminPriceEntryMutation();
  const createAuditLogMutation = useCreateAdminAuditLogMutation();
  const updatePriceEntryMutation = useUpdateAdminPriceEntryMutation();
  const deletePriceEntryMutation = useDeleteAdminPriceEntryMutation();
  const createStoreMutation = useCreateAdminStoreMutation();
  const deleteStoreMutation = useDeleteAdminStoreMutation();
  const updateStoreMutation = useUpdateAdminStoreMutation();
  const deleteProductMutation = useDeleteAdminProductMutation();
  const uploadProductImageMutation = useUploadAdminProductImageMutation();

  const products = React.useMemo<AdminProduct[]>(() => productsQuery.data ?? [], [productsQuery.data]);
  const stores = React.useMemo<AdminStore[]>(() => storesQuery.data ?? [], [storesQuery.data]);
  const prices = React.useMemo<AdminPriceEntry[]>(() => pricesQuery.data ?? [], [pricesQuery.data]);
  const auditLogs = React.useMemo<AdminAuditLog[]>(
    () => auditLogsQuery.data ?? [],
    [auditLogsQuery.data],
  );
  const productsLoading = productsQuery.isLoading || productsQuery.isFetching;
  const authLoading =
    adminUserQuery.isLoading || signInMutation.isPending || signOutMutation.isPending;

  const {
    categoryOptions,
    displayStores,
    filteredProducts,
    filteredStores,
    flyerSelectedCount,
    overviewCards,
    priceRowsMissingLink,
    productActiveFilterCount,
    productFilterCategoryOptions,
    productNameById,
    productPriceStats,
    productSortOptions,
    productStoreFilterOptions,
    recentStoreOptions,
    selectedStoreForMap,
    stalePriceRows,
    storeActiveFilterCount,
    storeAreaOptions,
    storeAuditLogs,
    storeNameById,
    storePriceStats,
    storeTypeOptions,
  } = useAdminDashboardData({
    products,
    stores,
    prices,
    auditLogs,
    storeSearchQuery,
    storeAreaFilter,
    storeStatusFilter,
    storeTypeFilter,
    selectedStoreMapId,
    productSearchQuery,
    productCategoryFilter,
    productStoreFilter,
    productPriceMin,
    productPriceMax,
    productSort,
    flyerSelectedRows: flyerRows.filter((row) => row.selected).length,
  });
  const loadAll = React.useCallback(
    async (keepNotice = false) => {
      const results = await Promise.all([
        productsQuery.refetch(),
        storesQuery.refetch(),
        pricesQuery.refetch(),
        auditLogsQuery.refetch(),
      ]);
      const errors = results
        .map((item) => (item.error instanceof Error ? item.error.message : null))
        .filter((item): item is string => Boolean(item));
      if (errors.length > 0) {
        setNotice(errors.join(" | "));
        return;
      }
      if (!keepNotice) {
        setNotice(null);
      }
    },
    [auditLogsQuery, pricesQuery, productsQuery, storesQuery],
  );

  React.useEffect(() => {
    const errors = [
      adminUserQuery.error,
      productsQuery.error,
      storesQuery.error,
      pricesQuery.error,
      auditLogsQuery.error,
    ]
      .map((error) => (error instanceof Error ? error.message : null))
      .filter((item): item is string => Boolean(item));
    if (errors.length > 0) {
      setNotice(errors.join(" | "));
    }
  }, [
    adminUserQuery.error,
    auditLogsQuery.error,
    pricesQuery.error,
    productsQuery.error,
    storesQuery.error,
  ]);

  const {
    addStorePriceSet,
    handleCreateProduct,
    handleDeletePriceEntry,
    handleDeleteProduct,
    handleExportProductsCsv,
    handleImportProductsCsv,
    handleOpenAddProduct,
    handleOpenEditPrice,
    handleOpenEditProduct,
    handlePickPeriodDate,
    handleResetProductFilters,
    handleSavePriceEntry,
    handleUploadProductImage,
    removeStorePriceSet,
    resetPriceForm,
    resetProductForm,
    updateStorePriceSet,
  } = useAdminProductActions({
    productName,
    productCategory,
    productCategoryCustom,
    productThumb,
    productStorePriceSets,
    productPeriodStartDate,
    productPeriodEndDate,
    productImageUploading,
    editingProductId,
    editingPriceId,
    priceProductId,
    priceStoreId,
    priceValue,
    priceStartDate,
    priceEndDate,
    filteredProducts,
    productPriceStats,
    setProductName,
    setProductCategory,
    setProductCategoryCustom,
    setProductThumb,
    setProductStorePriceSets,
    setProductPeriodStartDate,
    setProductPeriodEndDate,
    setProductModalOpen,
    setEditingProductId,
    setProductImageUploading,
    setEditingPriceId,
    setPriceProductId,
    setPriceStoreId,
    setPriceValue,
    setPriceStartDate,
    setPriceEndDate,
    setSubmitting,
    setDeletingKey,
    setNotice,
    resetProductFilters,
    loadAll,
    createProductMutation,
    updateProductMutation,
    deleteProductMutation,
    createPriceEntryMutation,
    updatePriceEntryMutation,
    deletePriceEntryMutation,
    uploadProductImageMutation,
  });
  const {
    handleConfirmDeleteStore,
    handleConfirmStoreImport,
    handleExportStoresCsv,
    handleImportStoresCsv,
    handleOpenAddStore,
    handleOpenEditStore,
    handleRequestDeleteStore,
    handleSaveStore,
    resetStoreForm,
  } = useAdminStoreActions({
    displayStores,
    stores,
    editingStoreId,
    storeName,
    storeArea,
    storeLatitude,
    storeLongitude,
    storePriceNote,
    storeAddress,
    storePlaceId,
    storePhone,
    storeWebsite,
    storeHours,
    storeType,
    storeIsActive,
    storeImportPreviewRows,
    storeDeleteCandidate,
    storePriceStats,
    setEditingStoreId,
    setStoreModalOpen,
    setStoreName,
    setStoreArea,
    setStoreLatitude,
    setStoreLongitude,
    setStorePriceNote,
    setStoreAddress,
    setStorePlaceId,
    setStorePhone,
    setStoreWebsite,
    setStoreHours,
    setStoreType,
    setStoreIsActive,
    setStoreImportPreviewRows,
    setStoreImportPreviewOpen,
    setStoreDeleteCandidate,
    setSubmitting,
    setDeletingKey,
    setNotice,
    loadAll,
    createStoreMutation,
    updateStoreMutation,
    deleteStoreMutation,
    createAuditLogMutation,
  });
  const {
    handleAddFlyerRow,
    handleClearFlyerImport,
    handleExportFlyerCsv,
    handleExportFlyerProductCsv,
    handlePickFlyerFile,
    handleRemoveSelectedFlyerRows,
  } = useAdminFlyerImport({
    flyerRows,
    setFlyerRows,
    setFlyerProcessing,
    setFlyerProgress,
    addFlyerRow,
    removeSelectedFlyerRows,
    clearFlyerImport,
    setNotice,
  });

  const handleOpenMapUrl = React.useCallback((url: string) => {
    if (Platform.OS !== "web") {
      setNotice("Map helper is currently available on web admin.");
      return;
    }
    const opener = (globalThis as { open?: (url: string, target?: string, features?: string) => Window | null }).open;
    if (typeof opener !== "function") {
      setNotice("Map helper is not available in this browser.");
      return;
    }
    opener(url, "_blank", "noopener,noreferrer");
  }, []);

  const handleSignIn = React.useCallback(async () => {
    const email = authEmail.trim();
    const password = authPassword;

    if (!email || !password) {
      setNotice("Email and password are required.");
      return;
    }

    try {
      await signInMutation.mutateAsync({ email, password });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Sign in failed.");
      return;
    }

    setAuthPassword("");
    setActiveMenu("overview");
    setNotice("Signed in to admin.");
  }, [authEmail, authPassword, setActiveMenu, signInMutation]);

  const handleSignOut = React.useCallback(async () => {
    try {
      await signOutMutation.mutateAsync();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Sign out failed.");
      return;
    }

    resetAdminUi();
    setNotice("Signed out.");
  }, [resetAdminUi, signOutMutation]);

  const sectionMenu = [
    {
      key: "overview" as const,
      label: "Dashboard",
      badge: toNonNegativeCount(priceRowsMissingLink + stalePriceRows),
    },
    {
      key: "products" as const,
      label: "Products",
      badge: products.length,
    },
    {
      key: "stores" as const,
      label: "Stores",
      badge: displayStores.length,
    },
    {
      key: "flyer" as const,
      label: "Flyer",
      badge: 0,
    },
  ];
  const panelTitle =
    activeMenu === "overview"
      ? "Dashboard"
      : activeMenu === "products"
        ? "Products"
        : activeMenu === "stores"
          ? "Stores"
          : "Flyer";

  return (
    <View style={st.root}>
      <View
        style={[
          st.workspace,
          !isLg && st.workspaceStack,
          { paddingHorizontal: isLg ? 0 : 10, paddingVertical: isLg ? 0 : 12 },
        ]}
      >
        {authUser && hasAdminAccess ? (
          <>
            {(!isLg || !sidebarCollapsed) ? (
              <AdminSidebar
                isLg={isLg}
                sectionMenu={sectionMenu}
                activeMenu={activeMenu}
                authUserLabel={authUser.email || authUser.id}
                authLoading={authLoading}
                styles={st}
                onSelectMenu={setActiveMenu}
                onSignOut={() => {
                  void handleSignOut();
                }}
                onCollapse={() => setSidebarCollapsed(true)}
              />
            ) : null}

            {isLg && sidebarCollapsed ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setSidebarCollapsed(false)}
                style={st.sidebarCollapsedToggle}
              >
                <Text style={st.sidebarCollapsedToggleIcon}>›</Text>
              </Pressable>
            ) : null}
          </>
        ) : null}

        <View style={st.mainPanel}>
          <ScrollView
            role="main"
            style={st.scroll}
            contentContainerStyle={st.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <AdminHeader
              hasAdminAccess={Boolean(authUser && hasAdminAccess)}
              styles={st}
              onBack={onBack}
              onRefresh={() => {
                void loadAll(true);
              }}
            />

            {!hasSupabaseEnv ? (
              <AdminSupabaseSetupNotice styles={st} />
            ) : null}

            {notice ? (
              <AdminNoticePanel notice={notice} styles={st} />
            ) : null}

            {!authUser ? (
              <AdminSignInPanel
                email={authEmail}
                password={authPassword}
                loading={authLoading}
                styles={st}
                onEmailChange={setAuthEmail}
                onPasswordChange={setAuthPassword}
                onSignIn={handleSignIn}
              />
            ) : !hasAdminAccess ? (
              <AdminNoAccessPanel
                styles={st}
                onBack={onBack}
                onSignOut={() => {
                  void handleSignOut();
                }}
              />
            ) : (
              <>
                {!isLg ? (
                  <AdminMobileMenu
                    activeMenu={activeMenu}
                    sectionMenu={sectionMenu}
                    styles={st}
                    onSelectMenu={setActiveMenu}
                  />
                ) : null}

                <Text style={st.panelTitle}>{panelTitle}</Text>

                {activeMenu === "overview" ? (
                  <AdminOverviewPanel
                    cards={overviewCards}
                    products={products}
                    productsLoading={productsLoading}
                    styles={st}
                    onManageProducts={() => setActiveMenu("products")}
                  />
                ) : null}

                {activeMenu === "products" ? (
                  <AdminProductsPanel
                    products={products}
                    filteredProducts={filteredProducts}
                    prices={prices}
                    loading={productsLoading}
                    submitting={submitting}
                    deletingKey={deletingKey}
                    productSearchQuery={productSearchQuery}
                    productPriceMin={productPriceMin}
                    productPriceMax={productPriceMax}
                    productCategoryFilter={productCategoryFilter}
                    productStoreFilter={productStoreFilter}
                    productSort={productSort}
                    productCategoryOptions={productFilterCategoryOptions}
                    productStoreOptions={productStoreFilterOptions}
                    productSortOptions={productSortOptions}
                    productActiveFilterCount={productActiveFilterCount}
                    productPriceStats={productPriceStats}
                    productNameById={productNameById}
                    storeNameById={storeNameById}
                    editingPriceId={editingPriceId}
                    priceProductId={priceProductId}
                    priceStoreId={priceStoreId}
                    priceValue={priceValue}
                    priceStartDate={priceStartDate}
                    priceEndDate={priceEndDate}
                    styles={st}
                    onImportProductsCsv={handleImportProductsCsv}
                    onExportProductsCsv={handleExportProductsCsv}
                    onOpenAddProduct={handleOpenAddProduct}
                    onProductSearchChange={setProductSearchQuery}
                    onProductPriceMinChange={setProductPriceMin}
                    onProductPriceMaxChange={setProductPriceMax}
                    onProductCategoryChange={setProductCategoryFilter}
                    onProductStoreChange={setProductStoreFilter}
                    onProductSortChange={setProductSort}
                    onResetProductFilters={handleResetProductFilters}
                    onEditProduct={handleOpenEditProduct}
                    onDeleteProduct={(productId) => {
                      void handleDeleteProduct(productId);
                    }}
                    onPriceProductIdChange={setPriceProductId}
                    onPriceStoreIdChange={setPriceStoreId}
                    onPriceChange={setPriceValue}
                    onPriceStartDateChange={setPriceStartDate}
                    onPriceEndDateChange={setPriceEndDate}
                    onSavePrice={() => {
                      void handleSavePriceEntry();
                    }}
                    onResetPriceForm={resetPriceForm}
                    onEditPrice={handleOpenEditPrice}
                    onDeletePrice={(priceId) => {
                      void handleDeletePriceEntry(priceId);
                    }}
                  />
                ) : null}

                {activeMenu === "stores" ? (
                  <AdminStoresPanel
                    stores={displayStores}
                    filteredStores={filteredStores}
                    selectedStore={selectedStoreForMap}
                    storePriceStats={storePriceStats}
                    storeAuditLogs={storeAuditLogs}
                    storeSearchQuery={storeSearchQuery}
                    storeAreaFilter={storeAreaFilter}
                    storeStatusFilter={storeStatusFilter}
                    storeTypeFilter={storeTypeFilter}
                    storeAreaOptions={storeAreaOptions}
                    storeTypeOptions={storeTypeOptions}
                    storeActiveFilterCount={storeActiveFilterCount}
                    deletingKey={deletingKey}
                    submitting={submitting}
                    styles={st}
                    onOpenAddStore={handleOpenAddStore}
                    onImportStoresCsv={handleImportStoresCsv}
                    onExportStoresCsv={handleExportStoresCsv}
                    onStoreSearchChange={setStoreSearchQuery}
                    onStoreAreaChange={setStoreAreaFilter}
                    onStoreStatusChange={setStoreStatusFilter}
                    onStoreTypeChange={setStoreTypeFilter}
                    onResetStoreFilters={() => {
                      setStoreSearchQuery("");
                      setStoreAreaFilter("all");
                      setStoreStatusFilter("all");
                      setStoreTypeFilter("all");
                    }}
                    onOpenMapUrl={handleOpenMapUrl}
                    onSelectStore={(storeId) =>
                      setSelectedStoreMapId((current) => (current === storeId ? null : storeId))
                    }
                    onEditStore={handleOpenEditStore}
                    onRequestDeleteStore={handleRequestDeleteStore}
                  />
                ) : null}

                {activeMenu === "flyer" ? (
                  <AdminFlyerPanel
                    rows={flyerRows}
                    processing={flyerProcessing}
                    progress={flyerProgress}
                    selectedCount={flyerSelectedCount}
                    styles={st}
                    onPickFile={handlePickFlyerFile}
                    onAddRow={handleAddFlyerRow}
                    onRemoveSelected={handleRemoveSelectedFlyerRows}
                    onExportCsv={handleExportFlyerCsv}
                    onExportProductCsv={handleExportFlyerProductCsv}
                    onClear={handleClearFlyerImport}
                    onUpdateRow={updateFlyerRow}
                  />
                ) : null}

              </>
            )}
          </ScrollView>
        </View>
      </View>

      <AdminStoreImportPreviewModal
        visible={storeImportPreviewOpen}
        rows={storeImportPreviewRows}
        submitting={submitting}
        styles={st}
        onClose={() => setStoreImportPreviewOpen(false)}
        onConfirm={() => {
          void handleConfirmStoreImport();
        }}
      />

      <AdminStoreDeleteModal
        store={storeDeleteCandidate}
        priceStats={storePriceStats}
        submitting={submitting}
        styles={st}
        onClose={() => setStoreDeleteCandidate(null)}
        onConfirm={() => {
          void handleConfirmDeleteStore();
        }}
      />

      <AdminStoreFormModal
        visible={storeModalOpen}
        isLg={isLg}
        editingStoreId={editingStoreId}
        submitting={submitting}
        name={storeName}
        area={storeArea}
        latitude={storeLatitude}
        longitude={storeLongitude}
        priceNote={storePriceNote}
        address={storeAddress}
        placeId={storePlaceId}
        phone={storePhone}
        website={storeWebsite}
        hours={storeHours}
        storeType={storeType}
        isActive={storeIsActive}
        styles={st}
        onNameChange={setStoreName}
        onAreaChange={setStoreArea}
        onLatitudeChange={setStoreLatitude}
        onLongitudeChange={setStoreLongitude}
        onPriceNoteChange={setStorePriceNote}
        onAddressChange={setStoreAddress}
        onPlaceIdChange={setStorePlaceId}
        onPhoneChange={setStorePhone}
        onWebsiteChange={setStoreWebsite}
        onHoursChange={setStoreHours}
        onStoreTypeChange={setStoreType}
        onActiveChange={setStoreIsActive}
        onClose={() => {
          setStoreModalOpen(false);
          resetStoreForm();
        }}
        onOpenMapUrl={handleOpenMapUrl}
        onSave={() => {
          void handleSaveStore();
        }}
      />

      <AdminProductFormModal
        visible={productModalOpen}
        isLg={isLg}
        editingProductId={editingProductId}
        submitting={submitting}
        imageUploading={productImageUploading}
        productName={productName}
        productCategory={productCategory}
        productCategoryCustom={productCategoryCustom}
        productThumb={productThumb}
        storePriceSets={productStorePriceSets}
        periodStartDate={productPeriodStartDate}
        periodEndDate={productPeriodEndDate}
        categoryOptions={categoryOptions}
        recentStoreOptions={recentStoreOptions}
        styles={st}
        onNameChange={setProductName}
        onCategoryChange={setProductCategory}
        onCategoryCustomChange={setProductCategoryCustom}
        onUploadImage={() => {
          void handleUploadProductImage();
        }}
        onAddStorePriceSet={addStorePriceSet}
        onRemoveStorePriceSet={removeStorePriceSet}
        onUpdateStorePriceSet={updateStorePriceSet}
        onPickPeriodDate={handlePickPeriodDate}
        onPeriodStartChange={setProductPeriodStartDate}
        onPeriodEndChange={setProductPeriodEndDate}
        onClose={() => {
          setProductModalOpen(false);
          resetProductForm();
        }}
        onSave={handleCreateProduct}
      />
    </View>
  );
}
