import { Modal, Pressable, Text, View } from "react-native";
import type { ProductDeleteConfirmation } from "../../utils/productDeleteConfirmation";

type Props = {
  confirmation: ProductDeleteConfirmation | null;
  deleting: boolean;
  styles: any;
  onClose: () => void;
  onConfirm: () => void;
};

export default function AdminProductDeleteModal({
  confirmation,
  deleting,
  styles: st,
  onClose,
  onConfirm,
}: Props) {
  return (
    <Modal
      visible={Boolean(confirmation)}
      transparent
      animationType="fade"
      onRequestClose={deleting ? () => undefined : onClose}
    >
      <View style={st.modalBackdrop}>
        <View style={st.confirmCard} accessibilityRole="alert">
          <Text style={st.modalTitle}>
            {confirmation && confirmation.count > 1 ? "Delete Products" : "Delete Product"}
          </Text>
          <Text style={st.modalSub}>{confirmation?.prompt}</Text>

          {confirmation ? (
            <View style={st.productDeleteSummary}>
              <Text style={st.productDeleteCount}>
                {confirmation.mode === "bulk"
                  ? `${confirmation.count} ${confirmation.count === 1 ? "product" : "products"} selected`
                  : "1 product to delete"}
              </Text>
              {confirmation.visibleNames.map((name, index) => (
                <Text key={`${name}-${index}`} style={st.productDeleteName} numberOfLines={1}>
                  {name}
                </Text>
              ))}
              {confirmation.remainingCount > 0 ? (
                <Text style={st.dataMuted}>+{confirmation.remainingCount} more</Text>
              ) : null}
            </View>
          ) : null}

          <Text style={st.infoBody}>
            This permanently removes the {confirmation?.count === 1 ? "product" : "products"} and linked price entries.
          </Text>

          <View style={st.modalActionRow}>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={[st.btn, st.btnGhost, st.confirmActionButton]}
              disabled={deleting}
            >
              <Text style={st.btnGhostText}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onConfirm}
              style={[st.btn, st.btnDanger, st.confirmActionButton, deleting && st.btnDisabled]}
              disabled={deleting}
            >
              <Text style={st.btnDangerText}>
                {deleting ? "Deleting…" : confirmation?.confirmLabel ?? "Delete Product"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
