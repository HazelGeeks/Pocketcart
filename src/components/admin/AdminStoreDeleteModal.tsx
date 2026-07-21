import React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import type { AdminStore } from "../../services/adminBackoffice";
import type { StorePriceStats } from "../../utils/adminScreenHelpers";

type Props = {
  store: AdminStore | null;
  priceStats: Map<string, StorePriceStats>;
  submitting: boolean;
  styles: any;
  onClose: () => void;
  onConfirm: () => void;
};

export default function AdminStoreDeleteModal({
  store,
  priceStats,
  submitting,
  styles: st,
  onClose,
  onConfirm,
}: Props) {
  return (
    <Modal visible={Boolean(store)} transparent animationType="fade" onRequestClose={onClose}>
      <View style={st.modalBackdrop}>
        <View style={st.confirmCard}>
          <Text style={st.modalTitle}>Delete Store</Text>
          <Text style={st.modalSub}>Delete {store?.name ?? "this store"}? This can also remove linked price rows.</Text>
          {store ? <Text style={st.infoBody}>Linked price rows: {priceStats.get(store.id)?.priceCount ?? 0}</Text> : null}
          <View style={st.modalActionRow}>
            <Pressable accessibilityRole="button" onPress={onClose} style={[st.btn, st.btnGhost]} disabled={submitting}>
              <Text style={st.btnGhostText}>Cancel</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={onConfirm} style={[st.btn, st.btnDanger]} disabled={submitting}>
              <Text style={st.btnDangerText}>{submitting ? "Deleting…" : "Delete Store"}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
