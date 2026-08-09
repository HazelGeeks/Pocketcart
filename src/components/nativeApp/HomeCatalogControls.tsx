import React from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { st } from "../../screens/nativeAppStyles";
import { marketingPalette as C } from "../../shared/design/palette";
import { categoryImageKey, type CategoryImageUrls } from "../../utils/categoryImages";
import { CategoryFilterTile } from "./CategoryFilterTile";
import { SORT_OPTIONS, type HomeSortMode } from "./homeCatalogUtils";

type Props = {
  query: string;
  category: string;
  categories: string[];
  categoryImageUrls: CategoryImageUrls;
  sortMode: HomeSortMode;
  storeFilterName: string | null;
  onClearStoreFilter: () => void;
  onChangeQuery: (value: string) => void;
  onChangeCategory: (value: string) => void;
  onChangeSort: (mode: HomeSortMode) => void;
};

export function HomeCatalogControls({
  query,
  category,
  categories,
  categoryImageUrls,
  sortMode,
  storeFilterName,
  onClearStoreFilter,
  onChangeQuery,
  onChangeCategory,
  onChangeSort,
}: Props) {
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
        <View style={st.sortSegmentedControl}>
          {SORT_OPTIONS.map((option, index) => {
            const active = sortMode === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => onChangeSort(option.value)}
                style={[
                  st.sortSegment,
                  index > 0 && st.sortSegmentDivider,
                  active && st.sortSegmentActive,
                ]}
              >
                <Text style={[st.sortSegmentText, active && st.sortSegmentTextActive]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.categoryRow}>
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
