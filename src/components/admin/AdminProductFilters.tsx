import React from "react";
import { Platform, Pressable, Text, TextInput, View } from "react-native";
import { marketingPalette as C } from "../../shared/design/palette";
import type { ProductSortKey } from "../../state/adminStore";
import { WEB_FILTER_SELECT_STYLE } from "../../utils/adminScreenHelpers";

type ProductStoreFilterOption = {
  id: string;
  name: string;
};

type ProductSortOption = {
  key: ProductSortKey;
  label: string;
};

type AdminProductFiltersProps = {
  searchQuery: string;
  categoryFilter: string;
  brandFilter: string;
  storeFilter: string;
  saleDateFilter: string;
  sort: ProductSortKey;
  categoryOptions: string[];
  brandOptions: string[];
  storeOptions: ProductStoreFilterOption[];
  sortOptions: ProductSortOption[];
  filteredCount: number;
  totalCount: number;
  activeFilterCount: number;
  styles: Record<string, any>;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onBrandChange: (value: string) => void;
  onStoreChange: (value: string) => void;
  onSaleDateChange: (value: string) => void;
  onSortChange: (value: ProductSortKey) => void;
  onReset: () => void;
};

export default function AdminProductFilters({
  searchQuery,
  categoryFilter,
  brandFilter,
  storeFilter,
  saleDateFilter,
  sort,
  categoryOptions,
  brandOptions,
  storeOptions,
  sortOptions,
  filteredCount,
  totalCount,
  activeFilterCount,
  styles: st,
  onSearchChange,
  onCategoryChange,
  onBrandChange,
  onStoreChange,
  onSaleDateChange,
  onSortChange,
  onReset,
}: AdminProductFiltersProps) {
  const [saleStartDate = "", saleEndDate = ""] = saleDateFilter.split("|");
  const updateSaleDateRange = React.useCallback(
    (nextStart: string, nextEnd: string) => {
      onSaleDateChange(nextStart || nextEnd ? `${nextStart}|${nextEnd}` : "");
    },
    [onSaleDateChange],
  );

  return (
    <View style={st.productFilterCard}>
      <View style={st.productFilterWrapRow}>
        <TextInput
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="Search product, category, store, or ID"
          placeholderTextColor={C.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          style={[st.input, st.productSearchInputInline]}
        />
        {Platform.OS === "web" ? (
          <>
            <select
              value={categoryFilter}
              onChange={(event) => onCategoryChange((event.target as HTMLSelectElement).value)}
              style={WEB_FILTER_SELECT_STYLE}
            >
              <option value="all">Category: All</option>
              {categoryOptions.map((category) => (
                <option key={`filter-category-${category}`} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              value={brandFilter}
              onChange={(event) => onBrandChange((event.target as HTMLSelectElement).value)}
              style={WEB_FILTER_SELECT_STYLE}
            >
              <option value="all">Brand: All</option>
              {brandOptions.map((brand) => (
                <option key={`filter-brand-${brand}`} value={brand}>
                  {brand}
                </option>
              ))}
            </select>

            <label style={{ ...WEB_FILTER_SELECT_STYLE, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ whiteSpace: "nowrap" }}>Sale from</span>
              <input
                aria-label="Sale start date filter"
                type="date"
                value={saleStartDate}
                onChange={(event) => updateSaleDateRange((event.target as HTMLInputElement).value, saleEndDate)}
                style={{ border: 0, outline: 0, background: "transparent", color: "inherit", font: "inherit", minWidth: 118 }}
              />
            </label>

            <label style={{ ...WEB_FILTER_SELECT_STYLE, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ whiteSpace: "nowrap" }}>Sale to</span>
              <input
                aria-label="Sale end date filter"
                type="date"
                value={saleEndDate}
                onChange={(event) => updateSaleDateRange(saleStartDate, (event.target as HTMLInputElement).value)}
                style={{ border: 0, outline: 0, background: "transparent", color: "inherit", font: "inherit", minWidth: 118 }}
              />
            </label>

            <select
              value={storeFilter}
              onChange={(event) => onStoreChange((event.target as HTMLSelectElement).value)}
              style={WEB_FILTER_SELECT_STYLE}
            >
              <option value="all">Store: All</option>
              {storeOptions.map((store) => (
                <option key={`filter-store-${store.id}`} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>

            <select
              value={sort}
              onChange={(event) => onSortChange((event.target as HTMLSelectElement).value as ProductSortKey)}
              style={WEB_FILTER_SELECT_STYLE}
            >
              {sortOptions.map((option) => (
                <option key={`product-sort-${option.key}`} value={option.key}>
                  Sort: {option.label}
                </option>
              ))}
            </select>
          </>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={onReset}
          style={[st.btn, st.btnGhost, activeFilterCount === 0 && st.btnDisabled]}
          disabled={activeFilterCount === 0}
        >
          <Text style={st.btnGhostText}>Reset</Text>
        </Pressable>
      </View>

      <Text style={st.dataMuted}>
        Showing {filteredCount} / {totalCount} products
        {activeFilterCount > 0 ? ` | Filters ${activeFilterCount}` : ""}
      </Text>
    </View>
  );
}
