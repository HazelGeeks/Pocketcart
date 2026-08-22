import React from "react";
import { Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import type { AdminStore } from "../../services/adminBackoffice";
import { marketingPalette as C } from "../../shared/design/palette";
import type { StorePriceSetInput } from "../../utils/adminScreenHelpers";
import {
  storeBrandLabel,
  webDateInputStyle,
  webTableSelectStyle,
} from "./adminProductPriceEditorData";

type Props = {
  visible: boolean;
  submitting: boolean;
  sets: StorePriceSetInput[];
  stores: AdminStore[];
  styles: any;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (
    id: string,
    field: "brand" | "storeId" | "price" | "periodStartDate" | "periodEndDate",
    value: string,
  ) => void;
};

export default function AdminProductPriceSetsEditor({
  submitting,
  sets,
  stores,
  styles: st,
  onAdd,
  onRemove,
  onUpdate,
}: Props) {
  const storeBrands = React.useMemo(
    () => [...new Set(stores.map(storeBrandLabel))].sort((a, b) => a.localeCompare(b)),
    [stores],
  );

  return (
    <>
      <View style={st.storePriceHeaderRow}>
        <View>
          <Text style={st.fieldLabel}>Sale Price Rows</Text>
          <Text style={st.dataMuted}>Each row saves one retailer price and sale period.</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={onAdd}
          style={[st.btn, st.btnGhost]}
          disabled={submitting}
        >
          <Text style={st.btnGhostText}>Add row</Text>
        </Pressable>
      </View>

      <ScrollView horizontal style={st.storePriceTableScroll}>
        <View style={st.storePriceTable}>
          <View style={st.storePriceTableHeaderRow}>
            <TableHeader label="#" styles={[st.storePriceTableCell, st.storePriceIndexCell]} />
            <TableHeader
              label="Retailer"
              styles={[st.storePriceTableCell, st.storePriceRetailerCell]}
            />
            <TableHeader
              label="Branch"
              styles={[st.storePriceTableCell, st.storePriceBranchCell]}
            />
            <TableHeader
              label="Sale start"
              styles={[st.storePriceTableCell, st.storePriceDateCell]}
            />
            <TableHeader
              label="Sale end"
              styles={[st.storePriceTableCell, st.storePriceDateCell]}
            />
            <TableHeader label="Price" styles={[st.storePriceTableCell, st.storePriceAmountCell]} />
            <TableHeader
              label="Action"
              styles={[st.storePriceTableCell, st.storePriceActionCell, st.storePriceLastCell]}
            />
          </View>

          {sets.map((set, index) => {
            const selectedStore = stores.find((store) => store.id === set.storeId);
            const selectedBrand = selectedStore ? storeBrandLabel(selectedStore) : set.brand.trim();
            const visibleStores = selectedBrand
              ? stores.filter((store) => storeBrandLabel(store) === selectedBrand)
              : [];

            return (
              <View
                key={set.id}
                style={[
                  st.storePriceTableRow,
                  index === sets.length - 1 && st.storePriceTableRowLast,
                ]}
              >
                <View style={[st.storePriceTableCell, st.storePriceIndexCell]}>
                  <Text style={st.storePriceRowNumber}>{index + 1}</Text>
                </View>
                <View style={[st.storePriceTableCell, st.storePriceRetailerCell]}>
                  {Platform.OS === "web" ? (
                    <select
                      aria-label={`Retailer for sale row ${index + 1}`}
                      value={selectedBrand}
                      onChange={(event) => {
                        onUpdate(set.id, "brand", (event.target as HTMLSelectElement).value);
                        if (set.storeId) onUpdate(set.id, "storeId", "");
                      }}
                      disabled={submitting || storeBrands.length === 0}
                      style={webTableSelectStyle}
                    >
                      <option value="">Select retailer</option>
                      {storeBrands.map((brand) => (
                        <option key={`${set.id}-${brand}`} value={brand}>
                          {brand}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Text style={st.dataMuted}>{selectedBrand || "Select retailer"}</Text>
                  )}
                </View>
                <View style={[st.storePriceTableCell, st.storePriceBranchCell]}>
                  {Platform.OS === "web" ? (
                    <select
                      aria-label={`Branch for sale row ${index + 1}`}
                      value={set.storeId}
                      onChange={(event) =>
                        onUpdate(set.id, "storeId", (event.target as HTMLSelectElement).value)
                      }
                      disabled={submitting || !selectedBrand}
                      style={webTableSelectStyle}
                    >
                      <option value="">
                        {selectedBrand
                          ? `All branches (${visibleStores.length})`
                          : "Select retailer first"}
                      </option>
                      {visibleStores.map((store) => (
                        <option key={`${set.id}-${store.id}`} value={store.id}>
                          {store.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Text style={st.dataMuted}>{selectedStore?.name || "All branches"}</Text>
                  )}
                </View>
                <View style={[st.storePriceTableCell, st.storePriceDateCell]}>
                  <SaleDateInput
                    index={index}
                    kind="start"
                    value={set.periodStartDate}
                    styles={st}
                    onChange={(value) => onUpdate(set.id, "periodStartDate", value)}
                  />
                </View>
                <View style={[st.storePriceTableCell, st.storePriceDateCell]}>
                  <SaleDateInput
                    index={index}
                    kind="end"
                    value={set.periodEndDate}
                    styles={st}
                    onChange={(value) => onUpdate(set.id, "periodEndDate", value)}
                  />
                </View>
                <View style={[st.storePriceTableCell, st.storePriceAmountCell]}>
                  <TextInput
                    value={set.price}
                    onChangeText={(value) => onUpdate(set.id, "price", value)}
                    placeholder="0.00"
                    placeholderTextColor={C.textMuted}
                    keyboardType="decimal-pad"
                    style={[st.input, st.storePriceTableInput]}
                  />
                </View>
                <View
                  style={[st.storePriceTableCell, st.storePriceActionCell, st.storePriceLastCell]}
                >
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => onRemove(set.id)}
                    style={[st.btn, st.btnDangerSoft, st.storePriceRemoveBtn]}
                    disabled={submitting}
                  >
                    <Text style={st.btnDangerSoftText}>
                      {sets.length === 1 ? "Clear" : "Remove"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
      <Text style={st.dataMuted}>
        Leave a row blank to save only the product. Add another row for a different sale period.
      </Text>
    </>
  );
}

function TableHeader({ label, styles }: { label: string; styles: any }) {
  return (
    <View style={styles}>
      <Text style={{ color: "#53617a", fontSize: 11, fontWeight: "800" }}>{label}</Text>
    </View>
  );
}

function SaleDateInput({
  index,
  kind,
  value,
  styles: st,
  onChange,
}: {
  index: number;
  kind: "start" | "end";
  value: string;
  styles: any;
  onChange: (value: string) => void;
}) {
  return Platform.OS === "web" ? (
    <input
      aria-label={`Sale period ${kind} date for sale row ${index + 1}`}
      type="date"
      value={value}
      onChange={(event) => onChange((event.target as HTMLInputElement).value)}
      style={webDateInputStyle}
    />
  ) : (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={kind === "start" ? "Start date" : "End date"}
      placeholderTextColor={C.textMuted}
      autoCapitalize="none"
      autoCorrect={false}
      style={[st.input, st.storePriceTableInput]}
    />
  );
}
