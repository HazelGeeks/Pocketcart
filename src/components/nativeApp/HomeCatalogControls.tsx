import React from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { st } from "../../screens/nativeAppStyles";
import { marketingPalette as C } from "../../shared/design/palette";
import { SORT_OPTIONS, type HomeSortMode } from "./homeCatalogUtils";

type Props = {
  query: string;
  category: string;
  categories: string[];
  sortMode: HomeSortMode;
  unreadAlertCount: number;
  storeFilterName: string | null;
  onClearStoreFilter: () => void;
  onChangeQuery: (value: string) => void;
  onChangeCategory: (value: string) => void;
  onChangeSort: (mode: HomeSortMode) => void;
  onOpenAlerts: () => void;
};

export function HomeCatalogControls({
  query,
  category,
  categories,
  sortMode,
  unreadAlertCount,
  storeFilterName,
  onClearStoreFilter,
  onChangeQuery,
  onChangeCategory,
  onChangeSort,
  onOpenAlerts,
}: Props) {
  return (
    <>
      <Text style={st.sectionSub}>Search groceries and compare current sale prices.</Text>
      {storeFilterName ? (
        <View style={st.dealFilterRow}>
          <Text style={st.sectionSub}>Showing deals for {storeFilterName}</Text>
          <Pressable accessibilityRole="button" onPress={onClearStoreFilter} style={st.inlinePill}>
            <Text style={st.inlinePillText}>Clear</Text>
          </Pressable>
        </View>
      ) : null}
      <View style={st.dealSearchRow}>
        <View style={st.searchAndAlertRow}>
          <View style={[st.searchCard, st.homeSearchCard]}>
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
            accessibilityLabel={unreadAlertCount > 0 ? `${unreadAlertCount} unread price alerts` : "Open price alerts"}
            onPress={onOpenAlerts}
            style={st.searchAlertBtn}
          >
            <Svg width={25} height={25} viewBox="0 0 24 24" fill="none">
              <Path d="M6.5 10.4a5.5 5.5 0 0 1 11 0v3.45l1.6 2.55H4.9l1.6-2.55V10.4Z" stroke={C.primaryDeep} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
              <Path d="M10 19a2 2 0 0 0 4 0" stroke={C.primaryDeep} strokeWidth={2.2} strokeLinecap="round" />
            </Svg>
            {unreadAlertCount > 0 ? (
              <View style={st.searchAlertBadge}>
                <Text style={st.searchAlertBadgeText}>{unreadAlertCount > 9 ? "9+" : unreadAlertCount}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.sortOptionsWrap} style={st.sortOptionsScroll}>
          {SORT_OPTIONS.map((option) => {
            const active = sortMode === option.value;
            return (
              <Pressable key={option.value} accessibilityRole="button" onPress={() => onChangeSort(option.value)} style={[st.inlinePill, st.sortPill, active && st.sortPillActive]}>
                <Text style={[st.inlinePillText, active && st.sortPillTextActive]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.categoryRow}>
          {["All", ...categories].map((option) => {
            const active = category === option;
            return (
              <Pressable key={option} accessibilityRole="button" onPress={() => onChangeCategory(option)} style={[st.categoryChip, active && st.categoryChipActive]}>
                <Text style={[st.categoryChipText, active && st.categoryChipTextActive]}>{option}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </>
  );
}
