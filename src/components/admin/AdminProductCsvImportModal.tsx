import React from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import type {
  ProductCsvImportProgress,
  ProductCsvImportReport,
} from "../../utils/productCsvImportExecutor";
import type { ProductCsvImportPreview } from "../../utils/productCsvImportPlan";

type Props = {
  preview: ProductCsvImportPreview | null;
  report: ProductCsvImportReport | null;
  progress: ProductCsvImportProgress | null;
  styles: any;
  onClosePreview: () => void;
  onCloseReport: () => void;
  onConfirm: () => void;
  onDownloadReviewRows: () => void;
  onDownloadReport: () => void;
};

function Stat({ label, value, styles: st }: { label: string; value: number; styles: any }) {
  return (
    <View style={st.productMetaChip}>
      <Text style={st.productMetaChipText}>{label} {value}</Text>
    </View>
  );
}

function PreviewBody({ preview, styles: st }: { preview: ProductCsvImportPreview; styles: any }) {
  const { summary } = preview;
  return (
    <>
      <View style={st.productChipRow}>
        <Stat label="Rows" value={summary.totalRows} styles={st} />
        <Stat label="Create" value={summary.productsToCreate} styles={st} />
        <Stat label="Existing" value={summary.existingMatches} styles={st} />
        <Stat label="Review" value={summary.rowsForReview} styles={st} />
        <Stat label="Invalid" value={summary.invalidRows} styles={st} />
        <Stat label="Prices" value={summary.priceEntriesToImport} styles={st} />
      </View>
      {preview.rows.slice(0, 100).map((row) => (
        <View key={`product-import-${row.rowNumber}`} style={st.dataRow}>
          <View style={st.dataRowMain}>
            <Text style={st.dataRowTitle}>
              Row {row.rowNumber}: {row.input.englishName || row.input.koreanName || "Unnamed product"}
            </Text>
            <Text style={st.dataMuted}>
              {[row.input.koreanName, row.input.category, row.input.unit].filter(Boolean).join(" · ")}
            </Text>
            {row.message || row.price.message ? (
              <Text style={st.productReviewReason}>{row.message ?? row.price.message}</Text>
            ) : null}
          </View>
          <Text style={row.productAction === "create" || row.productAction === "reuse"
            ? st.importStatusReady
            : st.importStatusMuted}
          >
            {row.productAction.replace("_", " ")} · price {row.price.status}
          </Text>
        </View>
      ))}
      {preview.rows.length > 100 ? (
        <Text style={st.dataMuted}>Showing the first 100 of {preview.rows.length} rows.</Text>
      ) : null}
    </>
  );
}

function ReportBody({ report, styles: st }: { report: ProductCsvImportReport; styles: any }) {
  return (
    <>
      <View style={st.productChipRow}>
        <Stat label="Created" value={report.createdProducts} styles={st} />
        <Stat label="Reused" value={report.reusedRows} styles={st} />
        <Stat label="Review" value={report.reviewRows} styles={st} />
        <Stat label="Prices" value={report.importedPrices} styles={st} />
        <Stat label="Price failures" value={report.failedPrices} styles={st} />
      </View>
      {report.globalErrors.map((error) => (
        <Text key={error} style={st.productReviewReason}>{error}</Text>
      ))}
      {report.rows.slice(0, 100).map((row) => (
        <View key={`product-report-${row.rowNumber}`} style={st.dataRow}>
          <View style={st.dataRowMain}>
            <Text style={st.dataRowTitle}>Row {row.rowNumber}: {row.productResult}</Text>
            <Text style={st.dataMuted}>{row.priceResult}</Text>
            {row.detail ? <Text style={st.productReviewReason}>{row.detail}</Text> : null}
          </View>
          <Text style={row.status === "imported" ? st.importStatusReady : st.importStatusMuted}>
            {row.status}
          </Text>
        </View>
      ))}
      {report.rows.length > 100 ? (
        <Text style={st.dataMuted}>Showing the first 100 rows. Download the full report for all results.</Text>
      ) : null}
    </>
  );
}

export default function AdminProductCsvImportModal({
  preview,
  report,
  progress,
  styles: st,
  onClosePreview,
  onCloseReport,
  onConfirm,
  onDownloadReviewRows,
  onDownloadReport,
}: Props) {
  const visible = Boolean(preview || report);
  const busy = Boolean(progress);
  const close = report ? onCloseReport : onClosePreview;
  const progressPercent = progress?.total
    ? Math.round((progress.completed / progress.total) * 100)
    : 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={busy ? () => undefined : close}>
      <View style={st.modalBackdrop}>
        <View style={st.modalCard}>
          <View style={st.modalHeader}>
            <View>
              <Text style={st.modalTitle}>{report ? "Product Import Report" : "Review Product CSV"}</Text>
              <Text style={st.modalSub}>
                {report
                  ? `${report.fileName} · completed ${new Date(report.completedAt).toLocaleString()}`
                  : `${preview?.fileName ?? ""} · no database changes have been made yet.`}
              </Text>
            </View>
            <Pressable accessibilityRole="button" onPress={close} style={[st.btn, st.btnGhost]} disabled={busy}>
              <Text style={st.btnGhostText}>Close</Text>
            </Pressable>
          </View>

          <ScrollView style={st.modalBody} contentContainerStyle={st.modalBodyContent}>
            {progress ? (
              <View style={st.dataRow}>
                <Text style={st.dataRowTitle}>Importing {progress.phase}…</Text>
                <Text style={st.dataMuted}>{progress.completed} / {progress.total} · {progressPercent}%</Text>
              </View>
            ) : null}
            {preview ? <PreviewBody preview={preview} styles={st} /> : null}
            {report ? <ReportBody report={report} styles={st} /> : null}
          </ScrollView>

          <View style={st.modalActionRow}>
            {preview && preview.summary.rowsForReview + preview.summary.invalidRows > 0 ? (
              <Pressable accessibilityRole="button" onPress={onDownloadReviewRows} style={[st.btn, st.btnGhost]} disabled={busy}>
                <Text style={st.btnGhostText}>Download Review Rows</Text>
              </Pressable>
            ) : null}
            {report ? (
              <Pressable accessibilityRole="button" onPress={onDownloadReport} style={[st.btn, st.btnPrimary]}>
                <Text style={st.btnPrimaryText}>Download Full Report</Text>
              </Pressable>
            ) : (
              <Pressable accessibilityRole="button" onPress={onConfirm} style={[st.btn, st.btnPrimary]} disabled={busy}>
                <Text style={st.btnPrimaryText}>{busy ? "Importing…" : "Import Safe Rows"}</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
