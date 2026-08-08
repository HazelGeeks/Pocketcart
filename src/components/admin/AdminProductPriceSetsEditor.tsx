import React from "react";
import { Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { marketingPalette as C } from "../../shared/design/palette";
import type { AdminStore } from "../../services/adminBackoffice";
import {
  WEB_FILTER_SELECT_STYLE,
  type StorePriceSetInput,
} from "../../utils/adminScreenHelpers";

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

const storeBrandLabel = (store: AdminStore) => store.brand?.trim() || "Other";
const storeDisplayName = (store: AdminStore) => {
  const brand = store.brand?.trim();
  return brand ? `${brand} - ${store.name.trim()}` : store.name.trim();
};
const webDateInputStyle: React.CSSProperties = {
  ...WEB_FILTER_SELECT_STYLE,
  flex: 1,
  minWidth: 180,
  height: 44,
  fontSize: 13,
};

export default function AdminProductPriceSetsEditor({
  visible,
  submitting,
  sets,
  stores,
  styles: st,
  onAdd,
  onRemove,
  onUpdate,
}: Props) {
  const [openSetId, setOpenSetId] = React.useState<string | null>(null);
  const storeById = React.useMemo(() => new Map(stores.map((store) => [store.id, store])), [stores]);
  const storeBrands = React.useMemo(
    () => [...new Set(stores.map(storeBrandLabel))].sort((a, b) => a.localeCompare(b)),
    [stores],
  );

  React.useEffect(() => {
    if (!visible) setOpenSetId(null);
  }, [visible]);

  return (
    <>
      <View style={st.storePriceHeaderRow}>
        <View>
          <Text style={st.fieldLabel}>Sale Price Rows</Text>
          <Text style={st.dataMuted}>Each row saves one store price with its own sale period.</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={onAdd} style={[st.btn, st.btnGhost]} disabled={submitting}>
          <Text style={st.btnGhostText}>Add Set</Text>
        </Pressable>
      </View>

      <View style={st.storePriceGrid}>
        {sets.map((set, index) => {
          const selectedStore = storeById.get(set.storeId);
          const selectedBrand = selectedStore ? storeBrandLabel(selectedStore) : set.brand.trim();
          const visibleStores = selectedBrand
            ? stores.filter((store) => storeBrandLabel(store) === selectedBrand)
            : [];
          const isOpen = openSetId === set.id;
          return (
            <View key={set.id} style={[st.storePriceCard, st.storePriceCardTwoCol]}>
              <View style={st.storePriceCardHeader}>
                <Text style={st.storePriceCardTitle}>Price Set {index + 1}</Text>
                <Pressable accessibilityRole="button" onPress={() => onRemove(set.id)} style={[st.btn, st.btnDangerSoft]} disabled={submitting}>
                  <Text style={st.btnDangerSoftText}>{sets.length === 1 ? "Clear" : "Remove"}</Text>
                </Pressable>
              </View>

              <View style={st.storePriceFieldGroup}>
                <Text style={st.fieldLabel}>Store Brand</Text>
                <View style={st.choiceRow}>
                  {storeBrands.length === 0 ? <Text style={st.dataMuted}>No store brands loaded</Text> :
                    storeBrands.map((brand) => {
                      const active = selectedBrand === brand;
                      return (
                        <Pressable
                          key={`${set.id}-brand-${brand}`}
                          accessibilityRole="button"
                          onPress={() => {
                            onUpdate(set.id, "brand", brand);
                            if (set.storeId) onUpdate(set.id, "storeId", "");
                            setOpenSetId(set.id);
                          }}
                          style={[st.choiceChip, active && st.choiceChipActive]}
                          disabled={submitting}
                        >
                          <Text style={[st.choiceChipText, active && st.choiceChipTextActive]}>{brand}</Text>
                        </Pressable>
                      );
                    })}
                </View>

                <Text style={st.fieldLabel}>Branch</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setOpenSetId(isOpen ? null : set.id)}
                  style={st.storeDropdownButton}
                  disabled={submitting || stores.length === 0 || !selectedBrand}
                >
                  <View style={st.storeDropdownTextWrap}>
                    <Text style={selectedStore ? st.storeDropdownSelectedText : st.storeDropdownPlaceholderText} numberOfLines={1}>
                      {selectedStore ? storeDisplayName(selectedStore) : stores.length === 0
                        ? "No stores loaded" : selectedBrand ? "All branches included" : "Select brand first"}
                    </Text>
                    {selectedStore && (selectedStore.address || selectedStore.area) ? (
                      <Text style={st.storeDropdownMetaText} numberOfLines={1}>{selectedStore.address || selectedStore.area}</Text>
                    ) : selectedBrand ? (
                      <Text style={st.storeDropdownMetaText} numberOfLines={1}>{visibleStores.length} branches will be included</Text>
                    ) : null}
                  </View>
                  <Text style={st.storeDropdownChevron}>{isOpen ? "Hide" : "Show"}</Text>
                </Pressable>

                {isOpen ? (
                  <View style={st.storeDropdownMenu}>
                    <ScrollView style={st.storeDropdownScroll} nestedScrollEnabled>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => {
                          onUpdate(set.id, "storeId", "");
                          setOpenSetId(null);
                        }}
                        style={[st.storeDropdownOption, !set.storeId && st.storeDropdownOptionActive]}
                      >
                        <Text style={[st.storeDropdownOptionText, !set.storeId && st.storeDropdownOptionTextActive]}>All branches</Text>
                        <Text style={st.storeDropdownOptionMeta}>Apply this price to every {selectedBrand} branch</Text>
                      </Pressable>
                      {visibleStores.map((store) => {
                        const active = set.storeId === store.id;
                        return (
                          <Pressable
                            key={`${set.id}-${store.id}`}
                            accessibilityRole="button"
                            onPress={() => {
                              onUpdate(set.id, "storeId", store.id);
                              setOpenSetId(null);
                            }}
                            style={[st.storeDropdownOption, active && st.storeDropdownOptionActive]}
                          >
                            <Text style={[st.storeDropdownOptionText, active && st.storeDropdownOptionTextActive]} numberOfLines={1}>{store.name}</Text>
                            <Text style={st.storeDropdownOptionMeta} numberOfLines={1}>{store.address || store.area}</Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </View>
                ) : null}
              </View>

              <View style={st.storePriceFieldGroup}>
                <Text style={st.fieldLabel}>Sale Period</Text>
                <View style={st.formRow}>
                  {Platform.OS === "web" ? (
                    <>
                      <input aria-label={`Sale period start date for price set ${index + 1}`} type="date" value={set.periodStartDate} onChange={(event) => onUpdate(set.id, "periodStartDate", (event.target as HTMLInputElement).value)} style={webDateInputStyle} />
                      <input aria-label={`Sale period end date for price set ${index + 1}`} type="date" value={set.periodEndDate} onChange={(event) => onUpdate(set.id, "periodEndDate", (event.target as HTMLInputElement).value)} style={webDateInputStyle} />
                    </>
                  ) : (
                    <>
                      <TextInput value={set.periodStartDate} onChangeText={(value) => onUpdate(set.id, "periodStartDate", value)} placeholder="Start date (YYYY-MM-DD)" placeholderTextColor={C.textMuted} autoCapitalize="none" autoCorrect={false} style={[st.input, st.inputNarrow]} />
                      <TextInput value={set.periodEndDate} onChangeText={(value) => onUpdate(set.id, "periodEndDate", value)} placeholder="End date (YYYY-MM-DD)" placeholderTextColor={C.textMuted} autoCapitalize="none" autoCorrect={false} style={[st.input, st.inputNarrow]} />
                    </>
                  )}
                </View>
              </View>

              <View style={st.storePriceFieldGroup}>
                <Text style={st.fieldLabel}>Current Sale Price</Text>
                <TextInput value={set.price} onChangeText={(value) => onUpdate(set.id, "price", value)} placeholder="0.00" placeholderTextColor={C.textMuted} keyboardType="decimal-pad" style={st.input} />
              </View>
            </View>
          );
        })}
      </View>
      <Text style={st.dataMuted}>Leave a row blank to save only the product catalog item. Add another set for next week&apos;s different price.</Text>
    </>
  );
}
