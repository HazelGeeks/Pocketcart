import React from "react";
import type { CatalogStoreFilter } from "../../services/catalogStoreFilters";
import { HomeStoreFilterChecklist } from "./HomeStoreFilterChecklist";
import { Pressable, Switch, Text, View } from "react-native";
import { st } from "../../screens/nativeAppStyles";
import { marketingPalette as C } from "../../shared/design/palette";
import { AppIcon } from "../icons/AppIcon";
import { AppSheet } from "./AppSheet";
import { type HomeSortMode, SORT_OPTIONS } from "./homeCatalogUtils";

type Props = {
  storeFilter: CatalogStoreFilter;
  onSaleOnly: boolean;
  sortMode: HomeSortMode;
  onClose: () => void;
  onApply: (onSaleOnly: boolean, sortMode: HomeSortMode, stores: CatalogStoreFilter) => void;
};

export function HomeCatalogFilterSheet({ storeFilter, onSaleOnly, sortMode, onClose, onApply }: Props) {
  const [draftStores, setDraftStores] = React.useState(storeFilter);
  const [draftOnSaleOnly, setDraftOnSaleOnly] = React.useState(onSaleOnly);
  const [draftSortMode, setDraftSortMode] = React.useState(sortMode);

  return (
    <AppSheet title="Sort & filters" visible onClose={onClose}>
      <View style={st.homeFilterToggleRow}>
        <View style={st.homeFilterToggleCopy}>
          <Text style={st.homeSortOptionText}>On sale</Text>
          <Text style={st.homeFilterToggleHelp}>Show only products with an active sale</Text>
        </View>
        <Switch accessibilityLabel="Show only products currently on sale"
          value={draftOnSaleOnly} onValueChange={setDraftOnSaleOnly}
          trackColor={{ false: C.line, true: C.primary }} thumbColor={C.white} />
      </View>
      <View>
        <Text accessibilityRole="header" style={st.homeSortMenuTitle}>Sort by</Text>
        {SORT_OPTIONS.map((option, index) => {
          const active = draftSortMode === option.value;
          return (
            <Pressable key={option.value} accessibilityRole="radio" accessibilityState={{ checked: active }}
              onPress={() => setDraftSortMode(option.value)}
              style={[st.homeSortOption, index > 0 && st.homeSortOptionDivider, active && st.homeSortOptionActive]}>
              <Text style={[st.homeSortOptionText, active && st.homeSortOptionTextActive]}>{option.label}</Text>
              {active ? <AppIcon name="check" color={C.primaryDeep} size={18} strokeWidth={2.4} /> : null}
            </Pressable>
          );
        })}
      </View>
      <HomeStoreFilterChecklist value={draftStores} onChange={setDraftStores} />
      <Pressable accessibilityRole="button" onPress={() => onApply(draftOnSaleOnly, draftSortMode, draftStores)} style={st.shoppingEmptyAction}>
        <Text style={st.shoppingEmptyActionText}>Apply filters</Text>
      </Pressable>
    </AppSheet>
  );
}
