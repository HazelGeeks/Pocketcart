import React from "react";
import { Pressable, Text, View } from "react-native";
import useAdminProductSelection from "../../hooks/useAdminProductSelection";
import type { AdminProduct } from "../../services/adminBackoffice";
import type { ProductSortKey } from "../../state/adminStore";
import type { ProductPriceStats } from "../../utils/adminScreenHelpers";
import {
  buildAdminProductPagination,
  type AdminProductPageSize,
} from "../../utils/adminProductPagination";
import AdminProductDeleteModal from "./AdminProductDeleteModal";
import AdminProductFilters from "./AdminProductFilters";
import AdminProductList from "./AdminProductList";
import AdminProductManagementHeader from "./AdminProductManagementHeader";
import AdminProductPagination from "./AdminProductPagination";

type StoreFilterOption = {
  id: string;
  name: string;
};

type SortOption = {
  key: ProductSortKey;
  label: string;
};

type Props = {
  products: AdminProduct[];
  filteredProducts: AdminProduct[];
  loading: boolean;
  submitting: boolean;
  deletingKey: string | null;
  productSearchQuery: string;
  productCategoryFilter: string;
  productBrandFilter: string;
  productStoreFilter: string;
  productSaleDateFilter: string;
  productSort: ProductSortKey;
  productCategoryOptions: string[];
  productBrandOptions: string[];
  productStoreOptions: StoreFilterOption[];
  productSortOptions: SortOption[];
  productActiveFilterCount: number;
  productPriceStats: Map<string, ProductPriceStats>;
  styles: any;
  onImportProductsCsv: () => void;
  onDownloadProductCsvTemplate: () => void;
  onExportProductsCsv: (selectedProducts: AdminProduct[]) => void;
  onOpenAddProduct: () => void;
  onProductSearchChange: (value: string) => void;
  onProductCategoryChange: (value: string) => void;
  onProductBrandChange: (value: string) => void;
  onProductStoreChange: (value: string) => void;
  onProductSaleDateChange: (value: string) => void;
  onProductSortChange: (value: ProductSortKey) => void;
  onResetProductFilters: () => void;
  onEditProduct: (product: AdminProduct) => void;
  onDeleteProduct: (productId: string) => Promise<boolean>;
  onDeleteProducts: (productIds: string[]) => Promise<string[]>;
};

export default function AdminProductsPanel({
  products,
  filteredProducts,
  loading,
  submitting,
  deletingKey,
  productSearchQuery,
  productCategoryFilter,
  productBrandFilter,
  productStoreFilter,
  productSaleDateFilter,
  productSort,
  productCategoryOptions,
  productBrandOptions,
  productStoreOptions,
  productSortOptions,
  productActiveFilterCount,
  productPriceStats,
  styles: st,
  onImportProductsCsv,
  onDownloadProductCsvTemplate,
  onExportProductsCsv,
  onOpenAddProduct,
  onProductSearchChange,
  onProductCategoryChange,
  onProductBrandChange,
  onProductStoreChange,
  onProductSaleDateChange,
  onProductSortChange,
  onResetProductFilters,
  onEditProduct,
  onDeleteProduct,
  onDeleteProducts,
}: Props) {
  const [pageSize, setPageSize] = React.useState<AdminProductPageSize>(20);
  const [requestedPage, setRequestedPage] = React.useState(1);
  const pagination = React.useMemo(
    () => buildAdminProductPagination(filteredProducts.length, requestedPage, pageSize),
    [filteredProducts.length, pageSize, requestedPage],
  );
  const pageProducts = React.useMemo(
    () => filteredProducts.slice(pagination.startIndex, pagination.endIndex),
    [filteredProducts, pagination.endIndex, pagination.startIndex],
  );
  const {
    allVisibleSelected,
    deleteConfirmation,
    deleteConfirming,
    selectedProductIds,
    selectedVisibleCount,
    clearSelection,
    dismissDeleteConfirmation,
    handleConfirmDelete,
    handleRequestDeleteProduct,
    handleRequestDeleteSelected,
    handleToggleAllVisible,
    handleToggleProduct,
  } = useAdminProductSelection({
    products,
    filteredProducts,
    visibleProducts: pageProducts,
    onDeleteProduct,
    onDeleteProducts,
  });
  const bulkDeleting = deletingKey === "products:bulk";
  const selectedProducts = React.useMemo(
    () => products.filter((product) => selectedProductIds.has(product.id)),
    [products, selectedProductIds],
  );
  const handleExportSelectedProducts = React.useCallback(
    () => onExportProductsCsv(selectedProducts),
    [onExportProductsCsv, selectedProducts],
  );

  React.useEffect(() => {
    setRequestedPage(1);
  }, [
    productBrandFilter,
    productCategoryFilter,
    productSaleDateFilter,
    productSearchQuery,
    productSort,
    productStoreFilter,
  ]);

  React.useEffect(() => {
    if (requestedPage !== pagination.page) setRequestedPage(pagination.page);
  }, [pagination.page, requestedPage]);

  const handlePageSizeChange = React.useCallback((nextPageSize: AdminProductPageSize) => {
    setPageSize(nextPageSize);
    setRequestedPage(1);
  }, []);

  return (
    <View style={st.productAdminStack}>
      <View style={st.dataCard}>
        <AdminProductManagementHeader
          selectedProductCount={selectedProducts.length}
          submitting={submitting}
          styles={st}
          onImportProductsCsv={onImportProductsCsv}
          onDownloadProductCsvTemplate={onDownloadProductCsvTemplate}
          onExportProductsCsv={handleExportSelectedProducts}
          onOpenAddProduct={onOpenAddProduct}
        />

        <AdminProductFilters
          searchQuery={productSearchQuery}
          categoryFilter={productCategoryFilter}
          brandFilter={productBrandFilter}
          storeFilter={productStoreFilter}
          saleDateFilter={productSaleDateFilter}
          sort={productSort}
          categoryOptions={productCategoryOptions}
          brandOptions={productBrandOptions}
          storeOptions={productStoreOptions}
          sortOptions={productSortOptions}
          filteredCount={filteredProducts.length}
          totalCount={products.length}
          activeFilterCount={productActiveFilterCount}
          styles={st}
          onSearchChange={onProductSearchChange}
          onCategoryChange={onProductCategoryChange}
          onBrandChange={onProductBrandChange}
          onStoreChange={onProductStoreChange}
          onSaleDateChange={onProductSaleDateChange}
          onSortChange={onProductSortChange}
          onReset={onResetProductFilters}
        />

        <AdminProductPagination
          page={pagination.page}
          pageCount={pagination.pageCount}
          pageSize={pageSize}
          rangeStart={pagination.rangeStart}
          rangeEnd={pagination.rangeEnd}
          totalItems={filteredProducts.length}
          styles={st}
          onPageChange={setRequestedPage}
          onPageSizeChange={handlePageSizeChange}
        />

        {selectedProductIds.size > 0 ? (
          <View style={st.productSelectionToolbar}>
            <Text accessibilityLiveRegion="polite" style={st.productSelectionCount}>
              {selectedProductIds.size} selected
            </Text>
            <View style={st.productSelectionActions}>
              <Pressable
                accessibilityRole="button"
                onPress={clearSelection}
                style={[st.btn, st.btnGhost]}
                disabled={submitting || bulkDeleting}
              >
                <Text style={st.btnGhostText}>Clear</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={handleRequestDeleteSelected}
                style={[st.btn, st.btnDanger]}
                disabled={submitting || bulkDeleting}
              >
                <Text style={st.btnDangerText}>
                  {bulkDeleting ? "Deleting…" : `Delete ${selectedProductIds.size}`}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <AdminProductList
          products={pageProducts}
          totalProducts={products.length}
          loading={loading}
          priceStats={productPriceStats}
          deletingKey={deletingKey}
          submitting={submitting}
          selectedProductIds={selectedProductIds}
          allVisibleSelected={allVisibleSelected}
          selectedVisibleCount={selectedVisibleCount}
          styles={st}
          onAddProduct={onOpenAddProduct}
          onImportProductsCsv={onImportProductsCsv}
          onToggleAllVisible={handleToggleAllVisible}
          onToggleProduct={handleToggleProduct}
          onEditProduct={onEditProduct}
          onDeleteProduct={handleRequestDeleteProduct}
        />

        {filteredProducts.length > 0 ? (
          <AdminProductPagination
            compact
            page={pagination.page}
            pageCount={pagination.pageCount}
            pageSize={pageSize}
            rangeStart={pagination.rangeStart}
            rangeEnd={pagination.rangeEnd}
            totalItems={filteredProducts.length}
            styles={st}
            onPageChange={setRequestedPage}
            onPageSizeChange={handlePageSizeChange}
          />
        ) : null}
      </View>

      <AdminProductDeleteModal
        confirmation={deleteConfirmation}
        deleting={deleteConfirming}
        styles={st}
        onClose={dismissDeleteConfirmation}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
      />
    </View>
  );
}
