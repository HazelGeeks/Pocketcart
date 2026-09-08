import { flyerCategory } from "../../utils/flyerCategory";
import { flyerProductIssues } from "../../utils/flyerProductReview";
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { marketingPalette as C } from "../../shared/design/palette";
import type { FlyerEditableField, FlyerRow } from "../../state/adminStore";
import { WEB_FLYER_ACTION_BAR_STYLE } from "../../utils/adminScreenHelpers";
import WebLink from "../WebLink";

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

const STORE_FLYER_LINKS = [
  { name: "Hmart", url: "https://hmart.ca/" },
  { name: "PriceSmart", url: "https://www.pricesmartfoods.com" },
  { name: "Hannan", url: "https://hannamsm.com/weekly-special/7days" },
  { name: "MarketRibbon", url: "https://marketribbon.ca/" },
  { name: "T&T", url: "https://www.tntsupermarket.com/eng/store-flyer" },
] as const;

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
            {processing ? "Processing..." : "Upload Images/PDFs"}
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

      <Text style={st.dataMuted}>
        Select multiple images or PDFs. Files are processed in order and added to the current rows. Text-only extraction. Categories are English; Korean names are optional and copied only when printed. Product export uses the Product template. Review flagged rows, then correct or deselect them.
        {" "}A blank branch applies the price to all active stores of that retailer. Confirm this scope before export.
        {" "}Retailer, branch and sale dates may be blank for export; complete the required sale details before importing prices. Memo and offer conditions are kept in Export CSV only.
      </Text>
      {processing && <Text accessibilityLiveRegion="polite" style={st.dataMuted}>{progress || "Processing files..."}</Text>}
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View style={st.flyerTable}>
          <View style={[st.flyerTableRow, st.flyerTableHeader]}>
            <Text style={[st.flyerHeaderCell, st.flyerCellSelect]}>Use</Text>
            <Text style={[st.flyerHeaderCell, st.flyerCellMart]}>Retailer</Text>
            <Text style={[st.flyerHeaderCell, st.flyerCellBranch]}>Branch / Store Name</Text>
            <Text style={[st.flyerHeaderCell, st.flyerCellDate]}>Sale Start</Text>
            <Text style={[st.flyerHeaderCell, st.flyerCellDate]}>Sale End</Text>
            <Text style={[st.flyerHeaderCell, st.flyerCellName]}>English Name</Text>
            <Text style={[st.flyerHeaderCell, st.flyerCellName]}>Korean Name (optional)</Text>
            <Text style={[st.flyerHeaderCell, st.flyerCellCategory]}>Category</Text>
            <Text style={[st.flyerHeaderCell, st.flyerCellPrice]}>Price</Text>
            <Text style={[st.flyerHeaderCell, st.flyerCellUnit]}>Unit</Text>
            <Text style={[st.flyerHeaderCell, st.flyerCellMemo]}>Memo</Text>
          </View>
          {rows.length === 0 ? (
            <View style={st.flyerTableEmptyRow}>
              <Text style={st.dataMuted}>
                {processing
                  ? progress || "Processing file..."
                  : "Upload an image/PDF or add a row."}
              </Text>
            </View>
          ) : (
            rows.map((row) => (
              <View
                key={row.id}
                style={[st.flyerTableRow, row.selected && st.flyerTableRowSelected]}
              >
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
                  placeholder="Retailer"
                  placeholderTextColor={C.textMuted}
                  style={[
                    st.flyerInputCell,
                    st.flyerCellMart,
                    row.selected && st.flyerInputCellSelected,
                  ]}
                />
                <TextInput
                  value={row.regionBranch}
                  onChangeText={(value) => onUpdateRow(row.id, "regionBranch", value)}
                  placeholder="Branch"
                  placeholderTextColor={C.textMuted}
                  style={[
                    st.flyerInputCell,
                    st.flyerCellBranch,
                    row.selected && st.flyerInputCellSelected,
                  ]}
                />
                <TextInput
                  value={row.saleStartDate}
                  onChangeText={(value) => onUpdateRow(row.id, "saleStartDate", value)}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={C.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[
                    st.flyerInputCell,
                    st.flyerCellDate,
                    row.selected && st.flyerInputCellSelected,
                  ]}
                />
                <TextInput
                  value={row.saleEndDate}
                  onChangeText={(value) => onUpdateRow(row.id, "saleEndDate", value)}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={C.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[
                    st.flyerInputCell,
                    st.flyerCellDate,
                    row.selected && st.flyerInputCellSelected,
                  ]}
                />
                <TextInput
                  value={row.englishName}
                  onChangeText={(value) => onUpdateRow(row.id, "englishName", value)}
                  placeholder="English name"
                  placeholderTextColor={C.textMuted}
                  style={[
                    st.flyerInputCell,
                    st.flyerCellName,
                    row.selected && st.flyerInputCellSelected,
                  ]}
                />
                <TextInput
                  value={row.koreanName}
                  onChangeText={(value) => onUpdateRow(row.id, "koreanName", value)}
                  placeholder="Korean name"
                  placeholderTextColor={C.textMuted}
                  style={[
                    st.flyerInputCell,
                    st.flyerCellName,
                    row.selected && st.flyerInputCellSelected,
                  ]}
                />
                <TextInput
                  value={row.mainCategory || flyerCategory("", row.englishName)}
                  onChangeText={(value) => onUpdateRow(row.id, "mainCategory", value)}
                  placeholder="Category"
                  placeholderTextColor={C.textMuted}
                  style={[
                    st.flyerInputCell,
                    st.flyerCellCategory,
                    row.selected && st.flyerInputCellSelected,
                  ]}
                />
                <TextInput
                  value={row.price}
                  onChangeText={(value) => onUpdateRow(row.id, "price", value)}
                  placeholder="0.00"
                  placeholderTextColor={C.textMuted}
                  keyboardType="decimal-pad"
                  style={[
                    st.flyerInputCell,
                    st.flyerCellPrice,
                    row.selected && st.flyerInputCellSelected,
                  ]}
                />
                <TextInput
                  value={row.unit}
                  onChangeText={(value) => onUpdateRow(row.id, "unit", value)}
                  placeholder="Unit"
                  placeholderTextColor={C.textMuted}
                  style={[
                    st.flyerInputCell,
                    st.flyerCellUnit,
                    row.selected && st.flyerInputCellSelected,
                  ]}
                />
                <View style={st.flyerCellMemo}>
                  <TextInput
                    value={row.memo}
                    onChangeText={(value) => onUpdateRow(row.id, "memo", value)}
                    placeholder="Source notes / offer conditions"
                    placeholderTextColor={C.textMuted}
                    multiline
                    style={[st.flyerInputCell, row.selected && st.flyerInputCellSelected]}
                  />
                  {flyerProductIssues(row).length > 0 && (
                    <Text style={[st.dataMuted, { padding: 8 }]}>
                      Review: {flyerProductIssues(row).join(" · ")}
                    </Text>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <View style={st.flyerStoreLinksSection}>
        <View style={st.flyerStoreLinksHeader}>
          <Text style={st.flyerStoreLinksTitle}>Store Flyer Links</Text>
          <Text style={st.dataMuted}>Open each store’s current flyer in a new tab.</Text>
        </View>
        <View style={st.flyerStoreLinksRow}>
          {STORE_FLYER_LINKS.map((store) => (
            <WebLink
              key={store.name}
              href={store.url}
              accessibilityLabel={`Open ${store.name} flyer in a new tab`}
              onPress={
                Platform.OS === "web"
                  ? undefined
                  : () => {
                      void Linking.openURL(store.url);
                    }
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              <View style={st.flyerStoreLink}>
                <Text style={st.flyerStoreLinkText}>{store.name}</Text>
                <Text style={st.flyerStoreLinkIcon}>↗</Text>
              </View>
            </WebLink>
          ))}
        </View>
      </View>
    </View>
  );
}
