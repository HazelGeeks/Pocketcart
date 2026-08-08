import useAdminFlyerImport from "./useAdminFlyerImport";
import useAdminProductActions from "./useAdminProductActions";
import useAdminStoreActions from "./useAdminStoreActions";
import useAdminWorkspaceCommands from "./useAdminWorkspaceCommands";
import type { AdminWorkspaceData } from "./useAdminWorkspaceData";

export default function useAdminWorkspaceActions(data: AdminWorkspaceData) {
  const { state, backend, dashboard } = data;
  const product = state.product;
  const store = state.store;
  const status = state.status;
  const productActions = useAdminProductActions({
    productKoreanName: product.productKoreanName,
    productEnglishName: product.productEnglishName,
    productBrand: product.productBrand,
    productGtin: product.productGtin,
    productUnit: product.productUnit,
    productCategory: product.productCategory,
    productCategoryCustom: product.productCategoryCustom,
    productThumb: product.productThumb,
    productStorePriceSets: product.productStorePriceSets,
    editingProductId: product.editingProductId,
    products: backend.products,
    prices: backend.prices,
    stores: dashboard.displayStores,
    productPriceStats: dashboard.productPriceStats,
    setProductKoreanName: product.setProductKoreanName,
    setProductEnglishName: product.setProductEnglishName,
    setProductBrand: product.setProductBrand,
    setProductGtin: product.setProductGtin,
    setProductUnit: product.setProductUnit,
    setProductCategory: product.setProductCategory,
    setProductCategoryCustom: product.setProductCategoryCustom,
    setProductThumb: product.setProductThumb,
    setProductStorePriceSets: product.setProductStorePriceSets,
    setProductModalOpen: product.setProductModalOpen,
    setEditingProductId: product.setEditingProductId,
    setProductImageUploading: product.setProductImageUploading,
    setSubmitting: status.setSubmitting,
    setDeletingKey: status.setDeletingKey,
    setNotice: status.setNotice,
    resetProductFilters: state.adminUi.resetProductFilters,
    loadAll: backend.loadAll,
    createProductMutation: backend.mutations.createProduct,
    updateProductMutation: backend.mutations.updateProduct,
    deleteProductMutation: backend.mutations.deleteProduct,
    createPriceEntryMutation: backend.mutations.createPrice,
    updatePriceEntryMutation: backend.mutations.updatePrice,
    uploadProductImageMutation: backend.mutations.uploadProductImage,
    createIdentityReviewMutation: backend.mutations.createIdentityReview,
    createAuditLogMutation: backend.mutations.createAuditLog,
  });
  const storeActions = useAdminStoreActions({
    displayStores: dashboard.displayStores,
    stores: backend.stores,
    editingStoreId: store.editingStoreId,
    storeBrand: store.storeBrand,
    storeName: store.storeName,
    storeLatitude: store.storeLatitude,
    storeLongitude: store.storeLongitude,
    storePriceNote: store.storePriceNote,
    storeAddress: store.storeAddress,
    storePlaceId: store.storePlaceId,
    storePhone: store.storePhone,
    storeWebsite: store.storeWebsite,
    storeHours: store.storeHours,
    storeType: store.storeType,
    storeIsActive: store.storeIsActive,
    storeImportPreviewRows: store.storeImportPreviewRows,
    storeDeleteCandidate: store.storeDeleteCandidate,
    storePriceStats: dashboard.storePriceStats,
    setEditingStoreId: store.setEditingStoreId,
    setStoreModalOpen: store.setStoreModalOpen,
    setStoreBrand: store.setStoreBrand,
    setStoreName: store.setStoreName,
    setStoreLatitude: store.setStoreLatitude,
    setStoreLongitude: store.setStoreLongitude,
    setStorePriceNote: store.setStorePriceNote,
    setStoreAddress: store.setStoreAddress,
    setStorePlaceId: store.setStorePlaceId,
    setStorePhone: store.setStorePhone,
    setStoreWebsite: store.setStoreWebsite,
    setStoreHours: store.setStoreHours,
    setStoreType: store.setStoreType,
    setStoreIsActive: store.setStoreIsActive,
    setStoreImportPreviewRows: store.setStoreImportPreviewRows,
    setStoreImportPreviewOpen: store.setStoreImportPreviewOpen,
    setStoreDeleteCandidate: store.setStoreDeleteCandidate,
    setSubmitting: status.setSubmitting,
    setDeletingKey: status.setDeletingKey,
    setNotice: status.setNotice,
    loadAll: backend.loadAll,
    createStoreMutation: backend.mutations.createStore,
    updateStoreMutation: backend.mutations.updateStore,
    deleteStoreMutation: backend.mutations.deleteStore,
    createAuditLogMutation: backend.mutations.createAuditLog,
  });
  const flyerActions = useAdminFlyerImport({
    flyerRows: state.adminUi.flyerRows,
    setFlyerRows: state.adminUi.setFlyerRows,
    setFlyerProcessing: state.adminUi.setFlyerProcessing,
    setFlyerProgress: state.adminUi.setFlyerProgress,
    addFlyerRow: state.adminUi.addFlyerRow,
    removeSelectedFlyerRows: state.adminUi.removeSelectedFlyerRows,
    clearFlyerImport: state.adminUi.clearFlyerImport,
    setNotice: status.setNotice,
    uploadProductImageMutation: backend.mutations.uploadProductImage,
  });
  const commands = useAdminWorkspaceCommands(data);
  return { productActions, storeActions, flyerActions, ...commands };
}

export type AdminWorkspaceActions = ReturnType<typeof useAdminWorkspaceActions>;
