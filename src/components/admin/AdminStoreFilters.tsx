import React from "react";
import { Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { marketingPalette as C } from "../../shared/design/palette";
import { WEB_FILTER_SELECT_STYLE } from "../../utils/adminScreenHelpers";

type AdminStoreFiltersProps = {
  searchQuery: string;
  brandFilter: string;
  statusFilter: string;
  typeFilter: string;
  brandOptions: string[];
  typeOptions: string[];
  filteredCount: number;
  totalCount: number;
  activeFilterCount: number;
  styles: Record<string, any>;
  onSearchChange: (value: string) => void;
  onBrandChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onReset: () => void;
};

export default function AdminStoreFilters({
  searchQuery,
  brandFilter,
  statusFilter,
  typeFilter,
  brandOptions,
  typeOptions,
  filteredCount,
  totalCount,
  activeFilterCount,
  styles: st,
  onSearchChange,
  onBrandChange,
  onStatusChange,
  onTypeChange,
  onReset,
}: AdminStoreFiltersProps) {
  return (
    <View style={st.productFilterCard}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={st.productFilterInlineRow}
      >
        <TextInput
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="Search brand, branch, address, ID, note, or coordinates"
          placeholderTextColor={C.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          style={[st.input, st.productSearchInputInline]}
        />
        {Platform.OS === "web" ? (
          <select
            value={brandFilter}
            onChange={(event) => onBrandChange((event.target as HTMLSelectElement).value)}
            style={WEB_FILTER_SELECT_STYLE}
          >
            <option value="all">Brand: All</option>
            {brandOptions.map((brand) => (
              <option key={`store-brand-${brand}`} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        ) : null}
        {Platform.OS === "web" ? (
          <select
            value={statusFilter}
            onChange={(event) => onStatusChange((event.target as HTMLSelectElement).value)}
            style={WEB_FILTER_SELECT_STYLE}
          >
            <option value="all">Status: All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        ) : null}
        {Platform.OS === "web" ? (
          <select
            value={typeFilter}
            onChange={(event) => onTypeChange((event.target as HTMLSelectElement).value)}
            style={WEB_FILTER_SELECT_STYLE}
          >
            <option value="all">Type: All</option>
            {typeOptions.map((type) => (
              <option key={`store-type-${type}`} value={type}>
                {type}
              </option>
            ))}
          </select>
        ) : null}
        <Pressable
          accessibilityRole="button"
          onPress={onReset}
          style={[st.btn, st.btnGhost, activeFilterCount === 0 && st.btnDisabled]}
          disabled={activeFilterCount === 0}
        >
          <Text style={st.btnGhostText}>Reset</Text>
        </Pressable>
      </ScrollView>
      <Text style={st.dataMuted}>
        Showing {filteredCount} / {totalCount} stores
        {activeFilterCount > 0 ? ` | Filters ${activeFilterCount}` : ""}
      </Text>
    </View>
  );
}
