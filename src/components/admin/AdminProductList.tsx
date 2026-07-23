import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import type { AdminProduct } from "../../services/adminBackoffice";
import {
  dateInputValue,
  toDateOnlyLabel,
  type ProductPriceStats,
} from "../../utils/adminScreenHelpers";
import AdminTechnicalDetails from "./AdminTechnicalDetails";

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
        <Text style={st.dataMuted}>{products.length} products</Text>
      </View>

      {products.map((item) => {
        const deleteKey = `product:${item.id}`;
        const deleting = deletingKey === deleteKey;
        const bulkDeleting = deletingKey === "products:bulk";
        const selected = selectedProductIds.has(item.id);
        const stats = priceStats.get(item.id);
        const latestPrice = stats?.latestPrice ?? null;
        const storeCount = stats?.storeIds.size ?? 0;
        const priceRangeLabel =
          stats && stats.minPrice !== null && stats.maxPrice !== null
            ? `$${stats.minPrice.toFixed(2)} - $${stats.maxPrice.toFixed(2)}`
            : "N/A";
        const dateLabel = `Created: ${toDateOnlyLabel(item.created_at)}`;
        const salePeriodLabel = stats?.latestValidFrom
          ? `${dateInputValue(stats.latestValidFrom)} - ${stats.latestValidTo ? dateInputValue(stats.latestValidTo) : "No end date"}`
          : null;

        return (
          <View key={item.id} style={st.listRow}>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
              onPress={() => onToggleProduct(item.id)}
              style={[st.productCheckboxHitArea, (deleting || bulkDeleting || submitting) && st.btnDisabled]}
              disabled={deleting || bulkDeleting || submitting}
            >
              <View style={[st.productCheckboxBox, selected && st.productCheckboxBoxChecked]}>
                {selected ? <View style={st.productCheckboxMark} /> : null}
              </View>
            </Pressable>
            <View style={st.listMain}>
              <Text style={st.listTitle}>{item.name}</Text>
              {item.english_name ? <Text style={st.dataMuted}>{item.english_name}</Text> : null}
              <Text style={st.dataMuted}>{item.category}</Text>
              {item.unit ? <Text style={st.dataMuted}>Unit {item.unit}</Text> : null}
              <View style={st.productChipRow}>
                {latestPrice !== null ? (
                  <View style={st.productMetaChip}>
                    <Text style={st.productMetaChipText}>Latest ${latestPrice.toFixed(2)}</Text>
                  </View>
                ) : null}
                <View style={st.productMetaChip}>
                  <Text style={st.productMetaChipText}>Stores {storeCount}</Text>
                </View>
                <View style={st.productMetaChip}>
                  <Text style={st.productMetaChipText}>Range {priceRangeLabel}</Text>
                </View>
                {salePeriodLabel ? (
                  <View style={st.productMetaChip}>
                    <Text style={st.productMetaChipText}>Sale {salePeriodLabel}</Text>
                  </View>
                ) : null}
              </View>
              <AdminTechnicalDetails
                accessibilityContext={item.name}
                items={[{ key: "product-id", label: "Product ID", value: item.id }]}
                styles={st}
              />
            </View>
            <View style={st.listRight}>
              {item.thumbnail_url ? (
                <Image source={{ uri: item.thumbnail_url }} style={st.listThumb} resizeMode="cover" />
              ) : null}
              <Text style={st.listDate}>{dateLabel}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => onEditProduct(item)}
                style={[st.btn, st.btnGhost]}
                disabled={deleting || bulkDeleting || submitting}
              >
                <Text style={st.btnGhostText}>Edit</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => onDeleteProduct(item.id)}
                style={[st.btn, st.btnDanger, deleting && st.btnDisabled]}
                disabled={deleting || bulkDeleting}
              >
                <Text style={st.btnDangerText}>{deleting ? "Deleting…" : "Delete"}</Text>
              </Pressable>
            </View>
          </View>
        );
      })}
    </>
  );
}
