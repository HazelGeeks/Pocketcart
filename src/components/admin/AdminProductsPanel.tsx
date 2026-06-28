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
  productPriceMin: string;
  productPriceMax: string;
  productCategoryFilter: string;
  productStoreFilter: string;
  productSaleDateFilter: string;
  productSort: ProductSortKey;
  productCategoryOptions: string[];
  productStoreOptions: StoreFilterOption[];
  productSortOptions: SortOption[];
  productActiveFilterCount: number;
  productPriceStats: Map<string, ProductPriceStats>;
  styles: any;
  onImportProductsCsv: () => void;
  onExportProductsCsv: () => void;
  onOpenAddProduct: () => void;
  onProductSearchChange: (value: string) => void;
  onProductPriceMinChange: (value: string) => void;
  onProductPriceMaxChange: (value: string) => void;
  onProductCategoryChange: (value: string) => void;
  onProductStoreChange: (value: string) => void;
  onProductSaleDateChange: (value: string) => void;
  onProductSortChange: (value: ProductSortKey) => void;
  onResetProductFilters: () => void;
  onEditProduct: (product: AdminProduct) => void;
  onDeleteProduct: (productId: string) => void;
};

export default function AdminProductsPanel({
  products,
  filteredProducts,
  loading,
  submitting,
  deletingKey,
  productSearchQuery,
  productPriceMin,
  productPriceMax,
  productCategoryFilter,
  productStoreFilter,
  productSaleDateFilter,
  productSort,
  productCategoryOptions,
  productStoreOptions,
  productSortOptions,
  productActiveFilterCount,
  productPriceStats,
  styles: st,
  onImportProductsCsv,
  onExportProductsCsv,
  onOpenAddProduct,
  onProductSearchChange,
  onProductPriceMinChange,
  onProductPriceMaxChange,
  onProductCategoryChange,
  onProductStoreChange,
  onProductSaleDateChange,
  onProductSortChange,
  onResetProductFilters,
  onEditProduct,
  onDeleteProduct,
}: Props) {
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
            <Pressable accessibilityRole="button" onPress={onOpenAddProduct} style={[st.btn, st.btnPrimary]} disabled={submitting}>
              <Text style={st.btnPrimaryText}>Add Product</Text>
            </Pressable>
          </View>
        </View>

        <AdminProductFilters
          searchQuery={productSearchQuery}
          priceMin={productPriceMin}
          priceMax={productPriceMax}
          categoryFilter={productCategoryFilter}
          storeFilter={productStoreFilter}
          saleDateFilter={productSaleDateFilter}
          sort={productSort}
          categoryOptions={productCategoryOptions}
          storeOptions={productStoreOptions}
          sortOptions={productSortOptions}
          filteredCount={filteredProducts.length}
          totalCount={products.length}
          activeFilterCount={productActiveFilterCount}
          styles={st}
          onSearchChange={onProductSearchChange}
          onPriceMinChange={onProductPriceMinChange}
          onPriceMaxChange={onProductPriceMaxChange}
          onCategoryChange={onProductCategoryChange}
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
          styles={st}
          onEditProduct={onEditProduct}
          onDeleteProduct={onDeleteProduct}
        />
      </View>
    </View>
  );
}
