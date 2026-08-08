import React from "react";
import { Pressable, Text, View } from "react-native";
import useLayout from "../../hooks/useLayout";
import type { AdminProduct } from "../../services/adminBackoffice";
import type { ProductPriceStats } from "../../utils/adminScreenHelpers";
import AdminProductRow from "./AdminProductRow";

type AdminProductListProps = {
  products: AdminProduct[];
  totalProducts: number;
  loading: boolean;
  priceStats: Map<string, ProductPriceStats>;
  deletingKey: string | null;
  submitting: boolean;
  selectedProductIds: Set<string>;
  allVisibleSelected: boolean;
  selectedVisibleCount: number;
  styles: Record<string, any>;
  onAddProduct: () => void;
  onImportProductsCsv: () => void;
  onToggleAllVisible: () => void;
  onToggleProduct: (productId: string) => void;
  onEditProduct: (product: AdminProduct) => void;
  onDeleteProduct: (productId: string) => void;
};

export default function AdminProductList({
  products,
  totalProducts,
  loading,
  priceStats,
  deletingKey,
  submitting,
  selectedProductIds,
  allVisibleSelected,
  selectedVisibleCount,
  styles: st,
  onAddProduct,
  onImportProductsCsv,
  onToggleAllVisible,
  onToggleProduct,
  onEditProduct,
  onDeleteProduct,
}: AdminProductListProps) {
  const { isXl } = useLayout();

  if (loading) {
    return <Text style={st.dataMuted}>Loading products...</Text>;
  }

  if (products.length === 0) {
    if (totalProducts === 0) {
      return (
        <View style={st.emptyStateCard}>
          <Text style={st.emptyStateTitle}>No products yet</Text>
          <Text style={st.dataMuted}>Add your first product or import a catalog from CSV.</Text>
          <View style={st.emptyStateActions}>
            <Pressable
              accessibilityRole="button"
              onPress={onAddProduct}
              style={[st.btn, st.btnPrimary, st.emptyStateAction]}
              disabled={submitting}
            >
              <Text style={st.btnPrimaryText}>Add Product</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onImportProductsCsv}
              style={[st.btn, st.btnGhost, st.emptyStateAction]}
              disabled={submitting}
            >
              <Text style={st.btnGhostText}>Import CSV</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return (
      <Text style={st.dataMuted}>No products match current filters.</Text>
    );
  }

  return (
    <>
      <View style={st.productListHeader}>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityLabel={allVisibleSelected ? "Clear all visible products" : "Select all visible products"}
          accessibilityState={{
            checked: allVisibleSelected ? true : selectedVisibleCount > 0 ? "mixed" : false,
          }}
          onPress={onToggleAllVisible}
          style={st.productListHeaderSelect}
          disabled={submitting || deletingKey === "products:bulk"}
        >
          <View style={[st.productCheckboxBox, (allVisibleSelected || selectedVisibleCount > 0) && st.productCheckboxBoxChecked]}>
            {allVisibleSelected ? (
              <View style={st.productCheckboxMark} />
            ) : selectedVisibleCount > 0 ? (
              <View style={st.productCheckboxMixedMark} />
            ) : null}
          </View>
          <Text style={st.productListHeaderText}>Select all visible</Text>
        </Pressable>
        <Text style={st.dataMuted}>{products.length} on this page</Text>
      </View>

      <View style={st.productListTable}>
        {isXl ? (
          <View style={st.productListColumnHeader}>
            <View style={st.productListSelectColumn} />
            <Text style={[st.productListColumnLabel, st.productListProductColumn]}>Product</Text>
            <Text style={[st.productListColumnLabel, st.productListLatestColumn]}>Latest</Text>
            <Text style={[st.productListColumnLabel, st.productListHistoryColumn]}>History</Text>
            <Text style={[st.productListColumnLabel, st.productListRangeColumn]}>Stores · Range</Text>
            <Text style={[st.productListColumnLabel, st.productListSaleColumn]}>Sale period · Current stores</Text>
            <Text style={[st.productListColumnLabel, st.productListActionsColumn]}>Actions</Text>
          </View>
        ) : null}
        {products.map((item) => {
          const deleting = deletingKey === `product:${item.id}`;
          const bulkDeleting = deletingKey === "products:bulk";
          return (
            <AdminProductRow
              key={item.id}
              product={item}
              stats={priceStats.get(item.id)}
              compact={!isXl}
              selected={selectedProductIds.has(item.id)}
              deleting={deleting}
              bulkDeleting={bulkDeleting}
              submitting={submitting}
              styles={st}
              onToggle={() => onToggleProduct(item.id)}
              onEdit={() => onEditProduct(item)}
              onDelete={() => onDeleteProduct(item.id)}
            />
          );
        })}
      </View>
    </>
  );
}
