import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import type { AdminProduct } from "../../services/adminBackoffice";
import {
  toDateOnlyLabel,
  type ProductPriceStats,
} from "../../utils/adminScreenHelpers";

type AdminProductListProps = {
  products: AdminProduct[];
  totalProducts: number;
  loading: boolean;
  priceStats: Map<string, ProductPriceStats>;
  deletingKey: string | null;
  submitting: boolean;
  styles: Record<string, any>;
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
  styles: st,
  onEditProduct,
  onDeleteProduct,
}: AdminProductListProps) {
  if (loading) {
    return <Text style={st.dataMuted}>Loading products...</Text>;
  }

  if (products.length === 0) {
    return (
      <Text style={st.dataMuted}>
        {totalProducts === 0 ? "No products yet." : "No products match current filters."}
      </Text>
    );
  }

  return (
    <>
      {products.map((item) => {
        const deleteKey = `product:${item.id}`;
        const deleting = deletingKey === deleteKey;
        const stats = priceStats.get(item.id);
        const latestPrice = stats?.latestPrice ?? null;
        const storeCount = stats?.storeIds.size ?? 0;
        const priceRangeLabel =
          stats && stats.minPrice !== null && stats.maxPrice !== null
            ? `$${stats.minPrice.toFixed(2)} - $${stats.maxPrice.toFixed(2)}`
            : "N/A";
        const latestObservedAt =
          stats && stats.latestObservedAtMs >= 0
            ? toDateOnlyLabel(new Date(stats.latestObservedAtMs).toISOString())
            : toDateOnlyLabel(item.created_at);

        return (
          <View key={item.id} style={st.listRow}>
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
              </View>
              <Text style={st.dataMuted}>{item.id}</Text>
            </View>
            <View style={st.listRight}>
              {item.thumbnail_url ? (
                <Image source={{ uri: item.thumbnail_url }} style={st.listThumb} resizeMode="cover" />
              ) : null}
              <Text style={st.listDate}>{latestObservedAt}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => onEditProduct(item)}
                style={[st.btn, st.btnGhost]}
                disabled={deleting || submitting}
              >
                <Text style={st.btnGhostText}>Edit</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => onDeleteProduct(item.id)}
                style={[st.btn, st.btnDanger, deleting && st.btnDisabled]}
                disabled={deleting}
              >
                <Text style={st.btnDangerText}>{deleting ? "..." : "Delete"}</Text>
              </Pressable>
            </View>
          </View>
        );
      })}
    </>
  );
}
