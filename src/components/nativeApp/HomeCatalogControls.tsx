import type { CatalogStoreFilter } from "../../services/catalogStoreFilters";
import React from "react";
import { Keyboard, Pressable, ScrollView, Text, View } from "react-native";
import { st } from "../../screens/nativeAppStyles";
import { marketingPalette as C } from "../../shared/design/palette";
import type { MarketProduct } from "../../services/marketData";
import { HomeSearchSheet } from "./HomeSearchSheet";
import { AppIcon } from "../icons/AppIcon";
import { CategoryFilterTile } from "./CategoryFilterTile";
import { HomeCatalogFilterSheet } from "./HomeCatalogFilterSheet";
import type { HomeSortMode } from "./homeCatalogUtils";

type Props = {
  storeFilterIds: string[] | null;
  storeFilterReady: boolean;
  onApplyStoreFilter: (value: CatalogStoreFilter) => void;
  profileId: string | null;
  products: MarketProduct[];
  favoriteStoreIds: string[];
  onSelectRetailer: (ids: string[], name: string) => void;
  query: string;
  category: string;
  categories: string[];
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
  profileId, products, favoriteStoreIds, onSelectRetailer, storeFilterIds, storeFilterReady, onApplyStoreFilter,
  query,
  category,
  categories,
  sortMode,
  onSaleOnly,
  storeFilterName,
  onClearStoreFilter,
  onChangeQuery,
  onChangeCategory,
  onChangeOnSaleOnly,
  onChangeSort,
}: Props) {
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [filterOpen, setFilterOpen] = React.useState(false);

  return (
    <>
      {searchOpen ? <HomeSearchSheet key={profileId ?? "guest"} query={query} profileId={profileId} products={products} favoriteStoreIds={favoriteStoreIds}
        onClose={() => setSearchOpen(false)}
        onSearch={(value) => {
          setSearchOpen(false);
          onChangeCategory("All");
          onChangeQuery(value);
        }}
        onStore={(ids, name) => { setSearchOpen(false); onSelectRetailer(ids, name); }} /> : null}
      {storeFilterName ? (
        <View style={st.dealFilterRow}>
          <Text style={st.sectionSub}>Stores: {storeFilterName}</Text>
          <Pressable accessibilityRole="button" onPress={onClearStoreFilter} style={st.inlinePill}>
            <Text style={st.inlinePillText}>Clear</Text>
          </Pressable>
        </View>
      ) : null}
      <View style={st.dealSearchRow}>
        <View style={st.homeSearchToolbar}>
          <Pressable accessibilityRole="button" accessibilityLabel="Search products and stores"
            onPress={() => setSearchOpen(true)} style={st.searchCard}>
            <Text numberOfLines={1} style={[st.searchInput, { paddingVertical: 10, color: query ? C.text : C.textMuted }]}>
              {query || "Search products and stores"}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sort and filter products"
            disabled={!storeFilterReady}
            accessibilityState={{ expanded: filterOpen }}
            onPress={() => { Keyboard.dismiss(); setFilterOpen(true); }}
            style={[st.homeFilterButton, (filterOpen || storeFilterIds) && st.homeFilterButtonActive]}
          >
            <AppIcon name="filter" color={C.primaryDeep} size={21} strokeWidth={2.2} />
          </Pressable>
        </View>
        {filterOpen ? (
          <HomeCatalogFilterSheet key={profileId ?? "guest"}
            storeFilter={storeFilterIds ? { ids: storeFilterIds, name: storeFilterName ?? "Selected stores" } : null} onSaleOnly={onSaleOnly} sortMode={sortMode}
            onClose={() => setFilterOpen(false)}
            onApply={(nextOnSaleOnly, nextSortMode, nextStores) => {
              onApplyStoreFilter(nextStores);
              setFilterOpen(false);
              onChangeOnSaleOnly(nextOnSaleOnly);
              onChangeSort(nextSortMode);
            }} />
        ) : null}
        {categories.length > 0 ? (
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
                  label={option}
                  onPress={() => onChangeCategory(option)}
                />
              );
            })}
          </ScrollView>
        ) : null}
      </View>
    </>
  );
}
