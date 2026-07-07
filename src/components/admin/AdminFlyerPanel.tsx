import React from "react";
import { Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { marketingPalette as C } from "../../shared/design/palette";
import type { FlyerEditableField, FlyerRow } from "../../state/adminStore";
import { WEB_FLYER_ACTION_BAR_STYLE } from "../../utils/adminScreenHelpers";

type AdminFlyerPanelProps = {
  rows: FlyerRow[];
  processing: boolean;
  progress: string;
  selectedCount: number;
  styles: Record<string, any>;
  onPickFile: () => void;
  onAddRow: () => void;
  onRemoveSelected: () => void;
  onExportCsv: () => void;
  onExportProductCsv: () => void;
  onSaveSelectedImages: () => void;
  onClear: () => void;
  onUpdateRow: (id: string, field: FlyerEditableField, value: string | boolean) => void;
};

const IMAGE_STATUS_LABELS: Record<FlyerRow["imageStatus"], string> = {
  none: "No image",
  candidate: "Candidate",
  ready: "Ready",
  saving: "Saving",
  saved: "Saved",
  error: "Error",
};

export default function AdminFlyerPanel({
  rows,
  processing,
  progress,
  selectedCount,
  styles: st,
  onPickFile,
  onAddRow,
  onRemoveSelected,
  onExportCsv,
  onExportProductCsv,
  onSaveSelectedImages,
  onClear,
  onUpdateRow,
}: AdminFlyerPanelProps) {
  const unsavedImageCount = rows.filter((row) => row.imageSelected && row.imagePreviewUrl && !row.thumbnailUrl).length;

  return (
    <View style={st.flyerPanel}>
      <div style={WEB_FLYER_ACTION_BAR_STYLE}>
        <Pressable
          accessibilityRole="button"
          onPress={onPickFile}
          style={[st.btn, st.flyerToolbarBtn, processing && st.btnDisabled]}
          disabled={processing}
        >
          <Text style={st.flyerToolbarBtnText}>
            {processing ? "Processing..." : "Upload Image/PDF"}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onAddRow}
          style={[st.btn, st.flyerToolbarBtn]}
          disabled={processing}
        >
          <Text style={st.flyerToolbarBtnText}>Add Row</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onRemoveSelected}
          style={[st.btn, st.flyerToolbarBtn, selectedCount === 0 && st.btnDisabled]}
          disabled={selectedCount === 0 || processing}
        >
          <Text style={st.flyerToolbarBtnText}>Remove Selected</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onExportCsv}
          style={[st.btn, st.flyerToolbarBtn, selectedCount === 0 && st.btnDisabled]}
          disabled={selectedCount === 0 || processing}
        >
          <Text style={st.flyerToolbarBtnText}>Export CSV</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onExportProductCsv}
          style={[st.btn, st.flyerToolbarBtn, selectedCount === 0 && st.btnDisabled]}
          disabled={selectedCount === 0 || processing}
        >
          <Text style={st.flyerToolbarBtnText}>Export Product CSV</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onSaveSelectedImages}
          style={[st.btn, st.flyerToolbarBtn, unsavedImageCount === 0 && st.btnDisabled]}
          disabled={unsavedImageCount === 0 || processing}
        >
          <Text style={st.flyerToolbarBtnText}>Save Selected Images</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onClear}
          style={[st.btn, st.flyerToolbarBtn]}
          disabled={processing}
        >
          <Text style={st.flyerToolbarBtnText}>Clear</Text>
        </Pressable>
      </div>

      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View style={st.flyerTable}>
          <View style={[st.flyerTableRow, st.flyerTableHeader]}>
            <Text style={[st.flyerHeaderCell, st.flyerCellSelect]}>Use</Text>
            <Text style={[st.flyerHeaderCell, st.flyerCellImage]}>Image</Text>
            <Text style={[st.flyerHeaderCell, st.flyerCellMart]}>Store Brand</Text>
            <Text style={[st.flyerHeaderCell, st.flyerCellBranch]}>Branch / Store Name</Text>
            <Text style={[st.flyerHeaderCell, st.flyerCellDate]}>Sale Start</Text>
            <Text style={[st.flyerHeaderCell, st.flyerCellDate]}>Sale End</Text>
            <Text style={[st.flyerHeaderCell, st.flyerCellName]}>Korean Name</Text>
            <Text style={[st.flyerHeaderCell, st.flyerCellName]}>English Name</Text>
            <Text style={[st.flyerHeaderCell, st.flyerCellCategory]}>Category</Text>
            <Text style={[st.flyerHeaderCell, st.flyerCellBrand]}>Product Brand</Text>
            <Text style={[st.flyerHeaderCell, st.flyerCellPrice]}>Price</Text>
            <Text style={[st.flyerHeaderCell, st.flyerCellUnit]}>Unit</Text>
            <Text style={[st.flyerHeaderCell, st.flyerCellMemo]}>Memo</Text>
          </View>
          {rows.length === 0 ? (
            <View style={st.flyerTableEmptyRow}>
              <Text style={st.dataMuted}>
                {processing ? progress || "Processing file..." : "Upload an image/PDF or add a row."}
              </Text>
            </View>
          ) : (
            rows.map((row) => (
              <View key={row.id} style={[st.flyerTableRow, row.selected && st.flyerTableRowSelected]}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => onUpdateRow(row.id, "selected", !row.selected)}
                  style={[st.flyerSelectCell, row.selected && st.flyerSelectCellActive]}
                >
                  <Text style={[st.flyerSelectText, row.selected && st.flyerSelectTextActive]}>
                    {row.selected ? "Yes" : "No"}
                  </Text>
                </Pressable>
                <View style={[st.flyerImageCell, row.selected && st.flyerInputCellSelected]}>
                  {row.imagePreviewUrl || row.thumbnailUrl ? (
                    <Image
                      source={{ uri: row.imagePreviewUrl || row.thumbnailUrl }}
                      style={st.flyerPreviewImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={st.flyerPreviewEmpty}>
                      <Text style={st.flyerImageStatusText}>No crop</Text>
                    </View>
                  )}
                  <View style={st.flyerImageMeta}>
                    <Text style={st.flyerImageStatusText} numberOfLines={1}>
                      {IMAGE_STATUS_LABELS[row.imageStatus] ?? "No image"}
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => onUpdateRow(row.id, "imageSelected", !row.imageSelected)}
                      style={[
                        st.flyerImageToggle,
                        row.imageSelected && st.flyerImageToggleActive,
                        !row.imagePreviewUrl && !row.thumbnailUrl && st.btnDisabled,
                      ]}
                      disabled={!row.imagePreviewUrl && !row.thumbnailUrl}
                    >
                      <Text style={[st.flyerImageToggleText, row.imageSelected && st.flyerImageToggleTextActive]}>
                        {row.imageSelected ? "Use image" : "Skip"}
                      </Text>
                    </Pressable>
                  </View>
                </View>
                <TextInput
                  value={row.martName}
                  onChangeText={(value) => onUpdateRow(row.id, "martName", value)}
                  placeholder="Store brand"
                  placeholderTextColor={C.textMuted}
                  style={[st.flyerInputCell, st.flyerCellMart, row.selected && st.flyerInputCellSelected]}
                />
                <TextInput
                  value={row.regionBranch}
                  onChangeText={(value) => onUpdateRow(row.id, "regionBranch", value)}
                  placeholder="Branch / store name"
                  placeholderTextColor={C.textMuted}
                  style={[st.flyerInputCell, st.flyerCellBranch, row.selected && st.flyerInputCellSelected]}
                />
                <TextInput
                  value={row.saleStartDate}
                  onChangeText={(value) => onUpdateRow(row.id, "saleStartDate", value)}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={C.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[st.flyerInputCell, st.flyerCellDate, row.selected && st.flyerInputCellSelected]}
                />
                <TextInput
                  value={row.saleEndDate}
                  onChangeText={(value) => onUpdateRow(row.id, "saleEndDate", value)}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={C.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[st.flyerInputCell, st.flyerCellDate, row.selected && st.flyerInputCellSelected]}
                />
                <TextInput
                  value={row.name}
                  onChangeText={(value) => onUpdateRow(row.id, "name", value)}
                  placeholder="Korean name"
                  placeholderTextColor={C.textMuted}
                  style={[st.flyerInputCell, st.flyerCellName, row.selected && st.flyerInputCellSelected]}
                />
                <TextInput
                  value={row.englishName}
                  onChangeText={(value) => onUpdateRow(row.id, "englishName", value)}
                  placeholder="English name"
                  placeholderTextColor={C.textMuted}
                  style={[st.flyerInputCell, st.flyerCellName, row.selected && st.flyerInputCellSelected]}
                />
                <TextInput
                  value={row.mainCategory}
                  onChangeText={(value) => onUpdateRow(row.id, "mainCategory", value)}
                  placeholder="Category"
                  placeholderTextColor={C.textMuted}
                  style={[st.flyerInputCell, st.flyerCellCategory, row.selected && st.flyerInputCellSelected]}
                />
                <TextInput
                  value={row.brand}
                  onChangeText={(value) => onUpdateRow(row.id, "brand", value)}
                  placeholder="Product brand"
                  placeholderTextColor={C.textMuted}
                  style={[st.flyerInputCell, st.flyerCellBrand, row.selected && st.flyerInputCellSelected]}
                />
                <TextInput
                  value={row.price}
                  onChangeText={(value) => onUpdateRow(row.id, "price", value)}
                  placeholder="0.00"
                  placeholderTextColor={C.textMuted}
                  keyboardType="decimal-pad"
                  style={[st.flyerInputCell, st.flyerCellPrice, row.selected && st.flyerInputCellSelected]}
                />
                <TextInput
                  value={row.unit}
                  onChangeText={(value) => onUpdateRow(row.id, "unit", value)}
                  placeholder="Unit"
                  placeholderTextColor={C.textMuted}
                  style={[st.flyerInputCell, st.flyerCellUnit, row.selected && st.flyerInputCellSelected]}
                />
                <TextInput
                  value={row.memo}
                  onChangeText={(value) => onUpdateRow(row.id, "memo", value)}
                  placeholder="Memo"
                  placeholderTextColor={C.textMuted}
                  style={[st.flyerInputCell, st.flyerCellMemo, row.selected && st.flyerInputCellSelected]}
                />
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
