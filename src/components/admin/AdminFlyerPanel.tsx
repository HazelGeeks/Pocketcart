import React from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
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
  onClear: () => void;
  onUpdateRow: (id: string, field: FlyerEditableField, value: string | boolean) => void;
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
  onClear,
  onUpdateRow,
}: AdminFlyerPanelProps) {
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
            <Text style={[st.flyerHeaderCell, st.flyerCellMart]}>Store</Text>
            <Text style={[st.flyerHeaderCell, st.flyerCellBranch]}>Area / Branch</Text>
            <Text style={[st.flyerHeaderCell, st.flyerCellDate]}>Sale Start</Text>
            <Text style={[st.flyerHeaderCell, st.flyerCellDate]}>Sale End</Text>
            <Text style={[st.flyerHeaderCell, st.flyerCellName]}>Product Name</Text>
            <Text style={[st.flyerHeaderCell, st.flyerCellCategory]}>Main Category</Text>
            <Text style={[st.flyerHeaderCell, st.flyerCellCategory]}>Subcategory</Text>
            <Text style={[st.flyerHeaderCell, st.flyerCellBrand]}>Brand</Text>
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
                <TextInput
                  value={row.martName}
                  onChangeText={(value) => onUpdateRow(row.id, "martName", value)}
                  placeholder="Store"
                  placeholderTextColor={C.textMuted}
                  style={[st.flyerInputCell, st.flyerCellMart, row.selected && st.flyerInputCellSelected]}
                />
                <TextInput
                  value={row.regionBranch}
                  onChangeText={(value) => onUpdateRow(row.id, "regionBranch", value)}
                  placeholder="Area / Branch"
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
                  placeholder="Product name"
                  placeholderTextColor={C.textMuted}
                  style={[st.flyerInputCell, st.flyerCellName, row.selected && st.flyerInputCellSelected]}
                />
                <TextInput
                  value={row.mainCategory}
                  onChangeText={(value) => onUpdateRow(row.id, "mainCategory", value)}
                  placeholder="Main category"
                  placeholderTextColor={C.textMuted}
                  style={[st.flyerInputCell, st.flyerCellCategory, row.selected && st.flyerInputCellSelected]}
                />
                <TextInput
                  value={row.subCategory}
                  onChangeText={(value) => onUpdateRow(row.id, "subCategory", value)}
                  placeholder="Subcategory"
                  placeholderTextColor={C.textMuted}
                  style={[st.flyerInputCell, st.flyerCellCategory, row.selected && st.flyerInputCellSelected]}
                />
                <TextInput
                  value={row.brand}
                  onChangeText={(value) => onUpdateRow(row.id, "brand", value)}
                  placeholder="Brand"
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
