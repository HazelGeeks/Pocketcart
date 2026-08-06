import React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import type { AdminProduct } from "../../services/adminBackoffice";
import { productDisplayName } from "../../utils/productNames";

type Props = {
  products: AdminProduct[];
  merging: boolean;
  styles: any;
  onClose: () => void;
  onMerge: (targetProductId: string) => void;
};

export default function AdminProductMergeModal({
  products,
  merging,
  styles: st,
  onClose,
  onMerge,
}: Props) {
  return (
    <Modal
      visible={products.length > 1}
      transparent
      animationType="fade"
      onRequestClose={merging ? () => undefined : onClose}
    >
      <View style={st.modalBackdrop}>
        <View style={st.confirmCard} accessibilityRole="alert">
          <Text style={st.modalTitle}>Merge Products</Text>
          <Text style={st.modalSub}>
            Choose the product to keep. Prices, shopping lists, watchlists, and sale alerts
            from the other {products.length - 1} product{products.length === 2 ? "" : "s"} will move to it.
          </Text>

          <View style={st.productDeleteSummary}>
            {products.map((product) => (
              <Pressable
                key={product.id}
                accessibilityRole="button"
                onPress={() => onMerge(product.id)}
                style={[st.btn, st.btnGhost, merging && st.btnDisabled]}
                disabled={merging}
              >
                <Text style={st.btnGhostText} numberOfLines={2}>
                  Keep {productDisplayName(product)}
                  {product.unit ? ` · ${product.unit}` : ""}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={st.infoBody}>
            If duplicate prices exist for the same store and sale period, the lower price is preserved.
            This action is recorded in the admin audit log.
          </Text>

          <View style={st.modalActionRow}>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={[st.btn, st.btnGhost, st.confirmActionButton]}
              disabled={merging}
            >
              <Text style={st.btnGhostText}>{merging ? "Merging…" : "Cancel"}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
