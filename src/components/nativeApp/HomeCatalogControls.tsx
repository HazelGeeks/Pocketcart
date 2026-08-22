import React from "react";
import { Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { st } from "../../screens/nativeAppStyles";
import { marketingPalette as C } from "../../shared/design/palette";
import { type CategoryImageUrls, categoryImageKey } from "../../utils/categoryImages";
import { AppIcon } from "../icons/AppIcon";
import { CategoryFilterTile } from "./CategoryFilterTile";
import { type HomeSortMode, SORT_OPTIONS } from "./homeCatalogUtils";

type Props = {
  query: string;
  category: string;
  categories: string[];
  categoryImageUrls: CategoryImageUrls;
  sortMode: HomeSortMode;
  onSaleOnly: boolean;
  storeFilterName: string | null;
  onClearStoreFilter: () => void;
  onChangeQuery: (value: string) => void;
  onChangeCategory: (value: string) => void;
  onChangeOnSaleOnly: (value: boolean) => void;
  onChangeSort: (mode: HomeSortMode) => void;
};

export function HomeCatalogControls({
  query,
  category,
  categories,
  categoryImageUrls,
  sortMode,
  onSaleOnly,
  storeFilterName,
  onClearStoreFilter,
  onChangeQuery,
  onChangeCategory,
  onChangeOnSaleOnly,
  onChangeSort,
}: Props) {
  const [filterOpen, setFilterOpen] = React.useState(false);

  return (
    <>
      {storeFilterName ? (
        <View style={st.dealFilterRow}>
          <Text style={st.sectionSub}>Showing deals for {storeFilterName}</Text>
          <Pressable accessibilityRole="button" onPress={onClearStoreFilter} style={st.inlinePill}>
            <Text style={st.inlinePillText}>Clear</Text>
          </Pressable>
        </View>
      ) : null}
      <View style={st.dealSearchRow}>
        <View style={st.homeSearchToolbar}>
          <View style={st.searchCard}>
            <TextInput
              value={query}
              onChangeText={onChangeQuery}
              placeholder="Search products"
              placeholderTextColor={C.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              style={st.searchInput}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sort and filter products"
            accessibilityState={{ expanded: filterOpen }}
            onPress={() => setFilterOpen((current) => !current)}
            style={[st.homeFilterButton, filterOpen && st.homeFilterButtonActive]}
          >
            <AppIcon name="filter" color={C.primaryDeep} size={21} strokeWidth={2.2} />
          </Pressable>
        </View>
        {filterOpen ? (
          <View style={st.homeSortMenu}>
            <Text style={st.homeSortMenuTitle}>Filters</Text>
            <View style={st.homeFilterToggleRow}>
              <View style={st.homeFilterToggleCopy}>
                <Text style={st.homeSortOptionText}>On sale</Text>
                <Text style={st.homeFilterToggleHelp}>Show only products with an active sale</Text>
              </View>
              <Switch
                accessibilityLabel="Show only products currently on sale"
                value={onSaleOnly}
                onValueChange={onChangeOnSaleOnly}
                trackColor={{ false: C.line, true: C.primary }}
                thumbColor={C.white}
              />
            </View>
            <Text style={st.homeSortMenuTitle}>Sort by</Text>
            {SORT_OPTIONS.map((option, index) => {
              const active = sortMode === option.value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => {
                    onChangeSort(option.value);
                    setFilterOpen(false);
                  }}
                  style={[
                    st.homeSortOption,
                    index > 0 && st.homeSortOptionDivider,
                    active && st.homeSortOptionActive,
                  ]}
                >
                  <Text style={[st.homeSortOptionText, active && st.homeSortOptionTextActive]}>
                    {option.label}
                  </Text>
                  {active ? (
                    <AppIcon name="check" color={C.primaryDeep} size={18} strokeWidth={2.4} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ) : null}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={st.categoryRow}
        >
          {["All", ...categories].map((option) => {
            const active = category === option;
            return (
              <CategoryFilterTile
                key={option}
                active={active}
                imageUrl={categoryImageUrls[categoryImageKey(option)]}
                label={option}
                onPress={() => onChangeCategory(option)}
              />
            );
          })}
        </ScrollView>
      </View>
    </>
  );
}
