import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Circle, Line, Path } from "react-native-svg";
import { st } from "../../screens/nativeAppStyles";
import { marketingPalette as C } from "../../shared/design/palette";
import { StoreStarIcon } from "./StoreMapResultCard";

type StoreMapControlsProps = {
  overlay: boolean;
  topInset: number;
  horizontalPad: number;
  query: string;
  storeCount: number;
  favoriteStoreCount: number;
  favoriteFilterActive: boolean;
  userLocation: { latitude: number; longitude: number } | null;
  locatingUser: boolean;
  onChangeQuery: (value: string) => void;
  onSetFavoriteFilter: (active: boolean) => void;
  onUseCurrentLocation: () => void;
};

export function StoreMapControls({
  overlay,
  topInset,
  horizontalPad,
  query,
  storeCount,
  favoriteStoreCount,
  favoriteFilterActive,
  userLocation,
  locatingUser,
  onChangeQuery,
  onSetFavoriteFilter,
  onUseCurrentLocation,
}: StoreMapControlsProps) {
  const clearFilters = () => {
    onChangeQuery("");
    onSetFavoriteFilter(false);
  };

  return (
    <View
      style={[
        overlay ? st.storeMapControlsOverlay : st.storeMapControlsList,
        { paddingTop: topInset + 10, paddingHorizontal: horizontalPad },
      ]}
    >
      <View style={st.storeMapSearchRow}>
        <View style={st.storeMapSearchBox}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Circle
              cx={10.8}
              cy={10.8}
              r={6.8}
              stroke={C.textMuted}
              strokeWidth={2}
            />
            <Line
              x1={16}
              y1={16}
              x2={21}
              y2={21}
              stroke={C.textMuted}
              strokeWidth={2}
              strokeLinecap="round"
            />
          </Svg>
          <TextInput
            value={query}
            onChangeText={onChangeQuery}
            placeholder="Search stores or addresses"
            placeholderTextColor={C.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            style={st.storeMapSearchInput}
          />
          {query ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear store search"
              hitSlop={8}
              onPress={() => onChangeQuery("")}
              style={st.storeMapClearButton}
            >
              <Text style={st.storeMapClearText}>×</Text>
            </Pressable>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Use my current location"
          disabled={locatingUser}
          onPress={onUseCurrentLocation}
          style={[
            st.storeMapLocationButton,
            userLocation && st.storeMapLocationButtonActive,
          ]}
        >
          {locatingUser ? (
            <ActivityIndicator color={C.primaryDeep} size="small" />
          ) : (
            <Svg width={25} height={25} viewBox="0 0 24 24" fill="none">
              <Circle
                cx={12}
                cy={10}
                r={4}
                stroke={C.primaryDeep}
                strokeWidth={2}
              />
              <Path
                d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z"
                stroke={C.primaryDeep}
                strokeWidth={2}
                strokeLinejoin="round"
              />
            </Svg>
          )}
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={st.storeMapFilterRow}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityState={{
            selected: !query && !favoriteFilterActive,
          }}
          onPress={clearFilters}
          style={[
            st.storeMapFilterButton,
            !query &&
              !favoriteFilterActive &&
              st.storeMapFilterButtonActive,
          ]}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path
              d="M4 7h10M18 7h2M4 17h2M10 17h10"
              stroke={C.primaryDeep}
              strokeWidth={2}
              strokeLinecap="round"
            />
            <Circle
              cx={16}
              cy={7}
              r={2}
              stroke={C.primaryDeep}
              strokeWidth={2}
            />
            <Circle
              cx={8}
              cy={17}
              r={2}
              stroke={C.primaryDeep}
              strokeWidth={2}
            />
          </Svg>
          <Text style={st.storeMapFilterText}>All stores</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{
            selected: Boolean(userLocation) && !favoriteFilterActive,
          }}
          onPress={() => {
            clearFilters();
            onUseCurrentLocation();
          }}
          style={[
            st.storeMapFilterButton,
            userLocation &&
              !favoriteFilterActive &&
              st.storeMapFilterButtonActive,
          ]}
        >
          <Text style={st.storeMapFilterText}>Nearest</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: favoriteFilterActive }}
          onPress={() => onSetFavoriteFilter(!favoriteFilterActive)}
          style={[
            st.storeMapFilterButton,
            favoriteFilterActive && st.storeMapFilterButtonActive,
          ]}
        >
          <StoreStarIcon
            size={16}
            filled={favoriteFilterActive}
            color={C.primaryDeep}
          />
          <Text style={st.storeMapFilterText}>
            My stores
            {favoriteStoreCount > 0 ? ` (${favoriteStoreCount})` : ""}
          </Text>
        </Pressable>
        <View style={st.storeMapFilterButton}>
          <Text style={st.storeMapFilterText}>
            {storeCount} {storeCount === 1 ? "store" : "stores"}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
