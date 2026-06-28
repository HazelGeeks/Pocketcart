import React from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import type { StoreImportPreviewRow } from "../../utils/adminValidation";

type Props = {
  visible: boolean;
  rows: StoreImportPreviewRow[];
  submitting: boolean;
  styles: any;
  onClose: () => void;
  onConfirm: () => void;
};

export default function AdminStoreImportPreviewModal({
  visible,
  rows,
  submitting,
  styles: st,
  onClose,
  onConfirm,
}: Props) {
  const readyCount = rows.filter((row) => row.status === "ready").length;
  const duplicateCount = rows.filter((row) => row.status === "duplicate").length;
  const invalidCount = rows.filter((row) => row.status === "invalid").length;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={st.modalBackdrop}>
        <View style={st.modalCard}>
          <View style={st.modalHeader}>
            <View>
              <Text style={st.modalTitle}>Import Stores CSV</Text>
              <Text style={st.modalSub}>Review the CSV rows before importing. Only ready rows will be created.</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={onClose} style={[st.btn, st.btnGhost]}>
              <Text style={st.btnGhostText}>Close</Text>
            </Pressable>
          </View>

          <ScrollView style={st.modalBody} contentContainerStyle={st.modalBodyContent}>
            <View style={st.productChipRow}>
              <View style={st.productMetaChip}>
                <Text style={st.productMetaChipText}>Ready {readyCount}</Text>
              </View>
              <View style={st.productMetaChip}>
                <Text style={st.productMetaChipText}>Duplicates {duplicateCount}</Text>
              </View>
              <View style={st.productMetaChip}>
                <Text style={st.productMetaChipText}>Invalid {invalidCount}</Text>
              </View>
            </View>
            {rows.map((row) => (
              <View key={`store-import-${row.rowNumber}`} style={st.dataRow}>
                <View style={st.dataRowMain}>
	                  <Text style={st.dataRowTitle}>
	                    Row {row.rowNumber}: {row.brand ? `${row.brand} - ` : ""}{row.name || "Unnamed store"}
	                  </Text>
                  <Text style={st.dataMuted}>
                    {row.area || "No area"} | {row.latitude || "No lat"}, {row.longitude || "No lng"}
                  </Text>
                </View>
                <Text style={row.status === "ready" ? st.importStatusReady : st.importStatusMuted}>{row.reason}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={st.modalActionRow}>
            <Pressable accessibilityRole="button" onPress={onClose} style={[st.btn, st.btnGhost]} disabled={submitting}>
              <Text style={st.btnGhostText}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onConfirm}
              style={[st.btn, st.btnPrimary]}
              disabled={submitting || readyCount === 0}
            >
              <Text style={st.btnPrimaryText}>{submitting ? "Importing..." : "Import Ready Rows"}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
