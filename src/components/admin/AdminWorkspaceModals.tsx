import type { AdminWorkspaceActions } from "../../hooks/useAdminWorkspaceActions";
import type { AdminWorkspaceData } from "../../hooks/useAdminWorkspaceData";
import { st } from "../../screens/adminScreenStyles";
import AdminProductCsvImportModal from "./AdminProductCsvImportModal";
import AdminProductFormModal from "./AdminProductFormModal";
import AdminStoreDeleteModal from "./AdminStoreDeleteModal";
import AdminStoreFormModal from "./AdminStoreFormModal";
import AdminStoreImportPreviewModal from "./AdminStoreImportPreviewModal";

type Props = { data: AdminWorkspaceData; actions: AdminWorkspaceActions };

export default function AdminWorkspaceModals({ data, actions }: Props) {
  const { state, dashboard } = data;
  const { product, store, status } = state;
  return (
    <>
      <AdminProductCsvImportModal
        preview={actions.productActions.productCsvPreview}
        report={actions.productActions.productCsvReport}
        progress={actions.productActions.productCsvProgress}
        styles={st}
        onClosePreview={() => actions.productActions.setProductCsvPreview(null)}
        onCloseReport={() => actions.productActions.setProductCsvReport(null)}
        onConfirm={() => void actions.productActions.handleConfirmProductCsvImport()}
        onDownloadReviewRows={actions.productActions.handleDownloadProductCsvReviewRows}
        onDownloadReport={actions.productActions.handleDownloadProductCsvReport}
      />
      <AdminStoreImportPreviewModal
        visible={store.storeImportPreviewOpen}
        rows={store.storeImportPreviewRows}
        submitting={status.submitting}
        styles={st}
        onClose={() => store.setStoreImportPreviewOpen(false)}
        onConfirm={() => void actions.storeActions.handleConfirmStoreImport()}
      />
      <AdminStoreDeleteModal
        store={store.storeDeleteCandidate}
        priceStats={dashboard.storePriceStats}
        submitting={status.submitting}
        styles={st}
        onClose={() => store.setStoreDeleteCandidate(null)}
        onConfirm={() => void actions.storeActions.handleConfirmDeleteStore()}
      />
      <AdminStoreFormModal
        visible={store.storeModalOpen}
        isLg={data.isLg}
        editingStoreId={store.editingStoreId}
        submitting={status.submitting}
        brand={store.storeBrand}
        name={store.storeName}
        latitude={store.storeLatitude}
        longitude={store.storeLongitude}
        priceNote={store.storePriceNote}
        address={store.storeAddress}
        placeId={store.storePlaceId}
        phone={store.storePhone}
        website={store.storeWebsite}
        hours={store.storeHours}
        storeType={store.storeType}
        isActive={store.storeIsActive}
        styles={st}
        onBrandChange={store.setStoreBrand}
        onNameChange={store.setStoreName}
        onLatitudeChange={store.setStoreLatitude}
        onLongitudeChange={store.setStoreLongitude}
        onPriceNoteChange={store.setStorePriceNote}
        onAddressChange={store.setStoreAddress}
        onPlaceIdChange={store.setStorePlaceId}
        onPhoneChange={store.setStorePhone}
        onWebsiteChange={store.setStoreWebsite}
        onHoursChange={store.setStoreHours}
        onStoreTypeChange={store.setStoreType}
        onActiveChange={store.setStoreIsActive}
        onClose={() => {
          store.setStoreModalOpen(false);
          actions.storeActions.resetStoreForm();
        }}
        onOpenMapUrl={actions.handleOpenMapUrl}
        onSave={() => void actions.storeActions.handleSaveStore()}
      />
      <AdminProductFormModal
        visible={product.productModalOpen}
        editingProductId={product.editingProductId}
        submitting={status.submitting}
        imageUploading={product.productImageUploading}
        productKoreanName={product.productKoreanName}
        productEnglishName={product.productEnglishName}
        productUnit={product.productUnit}
        productCategory={product.productCategory}
        productCategoryCustom={product.productCategoryCustom}
        productThumb={product.productThumb}
        storePriceSets={product.productStorePriceSets}
        categoryOptions={dashboard.categoryOptions}
        storeOptions={dashboard.productFormStoreOptions}
        styles={st}
        onKoreanNameChange={product.setProductKoreanName}
        onEnglishNameChange={product.setProductEnglishName}
        onUnitChange={product.setProductUnit}
        onCategoryChange={product.setProductCategory}
        onCategoryCustomChange={product.setProductCategoryCustom}
        onThumbChange={product.setProductThumb}
        onUploadImage={() => void actions.productActions.handleUploadProductImage()}
        onPasteImage={() => void actions.productActions.handlePasteProductImage()}
        onPasteImageEvent={actions.productActions.handleProductImagePasteEvent}
        onAddStorePriceSet={actions.productActions.addStorePriceSet}
        onRemoveStorePriceSet={actions.productActions.removeStorePriceSet}
        onUpdateStorePriceSet={actions.productActions.updateStorePriceSet}
        onClose={() => {
          product.setProductModalOpen(false);
          actions.productActions.resetProductForm();
        }}
        onSave={actions.productActions.handleCreateProduct}
      />
    </>
  );
}
