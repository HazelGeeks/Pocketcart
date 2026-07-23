import React from "react";
import { Pressable, Text, View } from "react-native";
import type { AdminProduct } from "../../services/adminBackoffice";
import type { ProductSortKey } from "../../state/adminStore";
import type { ProductPriceStats } from "../../utils/adminScreenHelpers";
import {
  buildProductDeleteConfirmation,
  removeDeletedProductIds,
  type ProductDeleteConfirmation,
} from "../../utils/productDeleteConfirmation";
import AdminProductDeleteModal from "./AdminProductDeleteModal";
import AdminProductFilters from "./AdminProductFilters";
import AdminProductList from "./AdminProductList";

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
  onExportProductsCsv: () => void;
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
  const [selectedProductIds, setSelectedProductIds] = React.useState<Set<string>>(new Set());
  const [csvActionsOpen, setCsvActionsOpen] = React.useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = React.useState<ProductDeleteConfirmation | null>(null);
  const [deleteConfirming, setDeleteConfirming] = React.useState(false);
  const deleteConfirmingRef = React.useRef(false);
  const filteredProductIds = React.useMemo(() => filteredProducts.map((product) => product.id), [filteredProducts]);
  const selectedVisibleCount = filteredProductIds.filter((id) => selectedProductIds.has(id)).length;
  const allVisibleSelected = filteredProductIds.length > 0 && selectedVisibleCount === filteredProductIds.length;
  const bulkDeleting = deletingKey === "products:bulk";

  React.useEffect(() => {
    setSelectedProductIds((current) => {
      const visible = new Set(filteredProductIds);
      const next = new Set(Array.from(current).filter((id) => visible.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [filteredProductIds]);

  const handleToggleProduct = React.useCallback((productId: string) => {
    setSelectedProductIds((current) => {
      const next = new Set(current);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  }, []);

  const handleToggleAllVisible = React.useCallback(() => {
    setSelectedProductIds((current) => {
      const next = new Set(current);
      if (allVisibleSelected) {
        filteredProductIds.forEach((id) => next.delete(id));
      } else {
        filteredProductIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, [allVisibleSelected, filteredProductIds]);

  const handleClearSelection = React.useCallback(() => {
    setSelectedProductIds(new Set());
  }, []);

  const handleRequestDeleteProduct = React.useCallback((productId: string) => {
    const product = products.find((item) => item.id === productId);
    if (!product) return;
    setDeleteConfirmation(buildProductDeleteConfirmation([product], "single"));
  }, [products]);

  const handleRequestDeleteSelected = React.useCallback(() => {
    const selectedProducts = products.filter((product) => selectedProductIds.has(product.id));
    setDeleteConfirmation(buildProductDeleteConfirmation(selectedProducts, "bulk"));
  }, [products, selectedProductIds]);

  const handleConfirmDelete = React.useCallback(async () => {
    if (!deleteConfirmation || deleteConfirmingRef.current) return;
    deleteConfirmingRef.current = true;
    setDeleteConfirming(true);

    try {
      let deletedIds: string[] = [];
      if (deleteConfirmation.mode === "single") {
        const deleted = await onDeleteProduct(deleteConfirmation.ids[0]);
        if (deleted) deletedIds = deleteConfirmation.ids;
      } else {
        deletedIds = await onDeleteProducts(deleteConfirmation.ids);
      }

      if (deletedIds.length > 0) {
        setSelectedProductIds((current) => removeDeletedProductIds(current, deletedIds));
      }
    } finally {
      deleteConfirmingRef.current = false;
      setDeleteConfirming(false);
      setDeleteConfirmation(null);
    }
  }, [deleteConfirmation, onDeleteProduct, onDeleteProducts]);

  const runCsvAction = React.useCallback((action: () => void) => {
    setCsvActionsOpen(false);
    action();
  }, []);

  return (
    <View style={st.productAdminStack}>
      <View style={st.dataCard}>
        <View style={st.dataCardHeader}>
          <View style={st.productHeaderCopy}>
            <Text style={st.dataCardTitle}>Product Management</Text>
            <Text style={st.dataMuted}>Create and remove catalog products.</Text>
          </View>
          <View style={st.productHeaderActions}>
            <View style={st.csvActionsMenu}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="CSV actions"
                accessibilityState={{ expanded: csvActionsOpen }}
                onPress={() => setCsvActionsOpen((open) => !open)}
                style={[st.btn, st.btnGhost, st.csvActionsTrigger, submitting && st.btnDisabled]}
                disabled={submitting}
              >
                <Text style={st.btnGhostText}>CSV Actions {csvActionsOpen ? "▴" : "▾"}</Text>
              </Pressable>
              {csvActionsOpen ? (
                <View style={st.csvActionsMenuPanel}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => runCsvAction(onImportProductsCsv)}
                    style={st.csvActionsMenuItem}
                  >
                    <Text style={st.csvActionsMenuItemText}>Import CSV</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => runCsvAction(onDownloadProductCsvTemplate)}
                    style={st.csvActionsMenuItem}
                  >
                    <Text style={st.csvActionsMenuItemText}>Download Template</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => runCsvAction(onExportProductsCsv)}
                    style={[st.csvActionsMenuItem, filteredProducts.length === 0 && st.btnDisabled]}
                    disabled={filteredProducts.length === 0}
                  >
                    <Text style={st.csvActionsMenuItemText}>Export Filtered CSV</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
            <Pressable accessibilityRole="button" onPress={onOpenAddProduct} style={[st.btn, st.btnPrimary]} disabled={submitting}>
              <Text style={st.btnPrimaryText}>Add Product</Text>
            </Pressable>
          </View>
        </View>

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

        {selectedProductIds.size > 0 ? (
          <View style={st.productSelectionToolbar}>
            <Text accessibilityLiveRegion="polite" style={st.productSelectionCount}>
              {selectedProductIds.size} selected
            </Text>
            <View style={st.productSelectionActions}>
              <Pressable
                accessibilityRole="button"
                onPress={handleClearSelection}
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
          products={filteredProducts}
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
      </View>

      <AdminProductDeleteModal
        confirmation={deleteConfirmation}
        deleting={deleteConfirming}
        styles={st}
        onClose={() => setDeleteConfirmation(null)}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
      />
    </View>
  );
}
