import React from "react";
import { Pressable, Text, View } from "react-native";

type Props = {
  selectedProductCount: number;
  submitting: boolean;
  styles: Record<string, any>;
  onImportProductsCsv: () => void;
  onDownloadProductCsvTemplate: () => void;
  onExportProductsCsv: () => void;
  onOpenAddProduct: () => void;
};

export default function AdminProductManagementHeader({
  selectedProductCount,
  submitting,
  styles: st,
  onImportProductsCsv,
  onDownloadProductCsvTemplate,
  onExportProductsCsv,
  onOpenAddProduct,
}: Props) {
  const [csvActionsOpen, setCsvActionsOpen] = React.useState(false);

  const runCsvAction = React.useCallback((action: () => void) => {
    setCsvActionsOpen(false);
    action();
  }, []);

  return (
    <View style={st.productHeaderStack}>
      <View style={st.dataCardHeader}>
        <View style={st.productHeaderCopy}>
          <Text style={st.dataCardTitle}>Product Management</Text>
          <Text style={st.dataMuted}>
            Create and remove catalog products. CSV rows with only store_brand apply to all active branches.
          </Text>
        </View>
        <View style={st.productHeaderActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="CSV actions"
            accessibilityState={{ expanded: csvActionsOpen }}
            onPress={() => setCsvActionsOpen((open) => !open)}
            style={[
              st.btn,
              st.btnGhost,
              st.csvActionsTrigger,
              submitting && st.btnDisabled,
            ]}
            disabled={submitting}
          >
            <Text style={st.btnGhostText}>
              CSV Actions {csvActionsOpen ? "▴" : "▾"}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onOpenAddProduct}
            style={[st.btn, st.btnPrimary]}
            disabled={submitting}
          >
            <Text style={st.btnPrimaryText}>Add Product</Text>
          </Pressable>
        </View>
      </View>

      {csvActionsOpen ? (
        <View style={st.csvActionsMenuPanelInline}>
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
            style={[
              st.csvActionsMenuItem,
              selectedProductCount === 0 && st.btnDisabled,
            ]}
            disabled={selectedProductCount === 0}
          >
            <Text style={st.csvActionsMenuItemText}>
              Export Selected CSV{selectedProductCount > 0 ? ` (${selectedProductCount})` : ""}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
