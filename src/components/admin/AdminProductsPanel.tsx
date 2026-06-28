import React from "react";
import { Pressable, Text, View } from "react-native";
import type { AdminProduct } from "../../services/adminBackoffice";
import type { ProductSortKey } from "../../state/adminStore";
import type { ProductPriceStats } from "../../utils/adminScreenHelpers";
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
  onDeleteProduct: (productId: string) => void;
  onDeleteProducts: (productIds: string[]) => void;
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

  const handleSelectAllVisible = React.useCallback(() => {
    setSelectedProductIds((current) => {
      return new Set([...Array.from(current), ...filteredProductIds]);
    });
  }, [filteredProductIds]);

  const handleClearSelection = React.useCallback(() => {
    setSelectedProductIds(new Set());
  }, []);

  const handleDeleteSelected = React.useCallback(() => {
    const ids = Array.from(selectedProductIds);
    if (ids.length === 0) return;
    onDeleteProducts(ids);
    setSelectedProductIds(new Set());
  }, [onDeleteProducts, selectedProductIds]);

  return (
    <View style={st.productAdminStack}>
      <View style={st.dataCard}>
        <View style={st.dataCardHeader}>
          <Text style={st.dataCardTitle}>Product Management</Text>
          <View style={st.inlineRow}>
            <Text style={st.dataMuted}>Create and remove catalog products.</Text>
            <Pressable accessibilityRole="button" onPress={onImportProductsCsv} style={[st.btn, st.btnGhost]} disabled={submitting}>
              <Text style={st.btnGhostText}>Import CSV</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={onExportProductsCsv} style={[st.btn, st.btnGhost, filteredProducts.length === 0 && st.btnDisabled]} disabled={filteredProducts.length === 0 || submitting}>
              <Text style={st.btnGhostText}>Export CSV</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={handleSelectAllVisible} style={[st.btn, st.btnGhost, (filteredProducts.length === 0 || allVisibleSelected) && st.btnDisabled]} disabled={filteredProducts.length === 0 || allVisibleSelected || submitting || bulkDeleting}>
              <Text style={st.btnGhostText}>Select all</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={handleDeleteSelected} style={[st.btn, st.btnDanger, selectedProductIds.size === 0 && st.btnDisabled]} disabled={selectedProductIds.size === 0 || submitting || bulkDeleting}>
              <Text style={st.btnDangerText}>{bulkDeleting ? "Deleting..." : `Delete selected ${selectedProductIds.size}`}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={handleClearSelection} style={[st.btn, st.btnGhost, selectedProductIds.size === 0 && st.btnDisabled]} disabled={selectedProductIds.size === 0 || submitting || bulkDeleting}>
              <Text style={st.btnGhostText}>Clear selection</Text>
            </Pressable>
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

        <AdminProductList
          products={filteredProducts}
          totalProducts={products.length}
          loading={loading}
          priceStats={productPriceStats}
          deletingKey={deletingKey}
          submitting={submitting}
          selectedProductIds={selectedProductIds}
          styles={st}
          onToggleProduct={handleToggleProduct}
          onEditProduct={onEditProduct}
          onDeleteProduct={onDeleteProduct}
        />
      </View>
    </View>
  );
}
