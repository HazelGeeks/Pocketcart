import React from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import type { MarketProduct } from "../../services/marketData";
import { money } from "../../screens/nativeAppData";
import { st } from "../../screens/nativeAppStyles";
import { marketingPalette as C } from "../../shared/design/palette";
import { categoryToIconVariant, type CategoryIconVariant } from "../../utils/categoryIcon";
import { formatSignedPercent } from "./priceDisplay";

type HomeSortMode = "deals" | "lowestPrice" | "biggestDrop";

type HomeCatalogPanelProps = {
  query: string;
  category: string;
  categories: string[];
  message: string | null;
  actionMessage: string | null;
  loading: boolean;
  products: MarketProduct[];
  selectedProduct: MarketProduct | null;
  sortMode: HomeSortMode;
  watchedProductIds: Set<string>;
  storeFilterName: string | null;
  onClearStoreFilter: () => void;
  onChangeQuery: (value: string) => void;
  onChangeCategory: (value: string) => void;
  onChangeSort: (mode: HomeSortMode) => void;
  onSelectProduct: (productId: string) => void;
  onWatchProduct: (productId: string) => void;
};

const SORT_OPTIONS: Array<{ value: HomeSortMode; label: string }> = [
  { value: "deals", label: "Best deals" },
  { value: "lowestPrice", label: "Lowest price" },
  { value: "biggestDrop", label: "Biggest drop" },
];

const formatTrendLabel = (product: MarketProduct) => {
  if (product.price_delta_percent === null) return null;
  const percent = formatSignedPercent(product.price_delta_percent);
  const direction =
    product.price_delta === null || product.price_delta === 0
      ? "Flat"
      : product.price_delta < 0
        ? "Down"
        : "Up";

  return `${direction} ${percent}`;
};

const formatPriceLabel = (value: number | null): string => {
  if (value === null) return "No price";
  return money.format(value);
};

const displayPriceForProduct = (product: MarketProduct): number | null =>
  product.current_price ?? product.best_store_price ?? product.previous_price;

export function HomeCatalogPanel({
  query,
  category,
  categories,
  message,
  actionMessage,
  loading,
  products,
  selectedProduct,
  watchedProductIds,
  sortMode,
  storeFilterName,
  onClearStoreFilter,
  onChangeQuery,
  onChangeCategory,
  onChangeSort,
  onSelectProduct,
  onWatchProduct,
}: HomeCatalogPanelProps) {
  const sortedProducts = React.useMemo(() => {
    return products.slice().sort((a, b) => {
      if (sortMode === "biggestDrop") {
        const aDrop = a.price_delta_percent ?? Number.MAX_VALUE;
        const bDrop = b.price_delta_percent ?? Number.MAX_VALUE;
        if (aDrop !== bDrop) return aDrop - bDrop;
      }

      if (sortMode === "lowestPrice" || sortMode === "deals") {
        const aPrice = displayPriceForProduct(a) ?? Number.MAX_VALUE;
        const bPrice = displayPriceForProduct(b) ?? Number.MAX_VALUE;
        if (aPrice !== bPrice) return aPrice - bPrice;
      }

      return a.name.localeCompare(b.name);
    });
  }, [products, sortMode]);

  return (
    <View style={st.sectionStack}>
      <Text style={st.sectionTitle}>Best Prices</Text>
      <View style={st.dealHeaderRow}>
        <Text style={st.sectionSub}>Search groceries and compare current sale prices.</Text>
        <Text style={st.badge}>Live</Text>
      </View>

      {storeFilterName ? (
        <View style={st.dealFilterRow}>
          <Text style={st.sectionSub}>Showing deals for {storeFilterName}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={onClearStoreFilter}
            style={st.inlinePill}
          >
            <Text style={st.inlinePillText}>Clear</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={st.dealSearchRow}>
        <View style={st.searchAndSortRow}>
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
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={st.sortOptionsWrap}
          style={st.sortOptionsScroll}
        >
          {SORT_OPTIONS.map((option) => {
            const active = sortMode === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                onPress={() => onChangeSort(option.value)}
                style={[st.inlinePill, st.sortPill, active && st.sortPillActive]}
              >
                <Text style={[st.inlinePillText, active && st.sortPillTextActive]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={st.categoryRow}
        >
          {[
            "All",
            ...categories,
          ].map((categoryOption) => {
            const active = category === categoryOption;
            return (
              <Pressable
                key={categoryOption}
                accessibilityRole="button"
                onPress={() => onChangeCategory(categoryOption)}
                style={[st.categoryChip, active && st.categoryChipActive]}
              >
                <Text style={[st.categoryChipText, active && st.categoryChipTextActive]}>
                  {categoryOption}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {message ? (
        <View style={st.rowCard}>
          <Text style={st.itemMeta}>{message}</Text>
        </View>
      ) : null}

      {actionMessage ? (
        <View style={st.rowCard}>
          <Text style={st.itemMeta}>{actionMessage}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={st.rowCard}>
          <Text style={st.itemMeta}>Loading products...</Text>
        </View>
      ) : products.length === 0 ? (
        <View style={st.rowCard}>
          <Text style={st.itemMeta}>
            {storeFilterName
              ? "No current sales at this store yet."
              : "No current sales right now. Check back after the next weekly update."}
          </Text>
        </View>
      ) : (
        <View style={st.homeProductList}>
          {sortedProducts.map((product) => {
            const isDeal =
              product.price_delta_percent !== null &&
              product.price_delta !== null &&
              product.price_delta < 0;
            const isWatching = watchedProductIds.has(product.id);
            const active = selectedProduct?.id === product.id;
            const displayPrice = displayPriceForProduct(product);
            const unitLabel = product.unit ? ` / ${product.unit}` : "";
            const changeLabel = formatTrendLabel(product);
            const previous = product.previous_price;

            return (
              <Pressable
                key={product.id}
                accessibilityRole="button"
                onPress={() => onSelectProduct(product.id)}
                style={[st.homeProductRow, active && st.dealFeedItemActive]}
              >
                {product.thumbnail_url ? (
                  <Image
                    source={{ uri: product.thumbnail_url }}
                    style={st.homeProductThumb}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={st.homeProductThumbPlaceholder}>
                    <CategoryPlaceholderIcon variant={categoryToIconVariant(product.category)} />
                  </View>
                )}

                <View style={st.homeProductMain}>
                  <View style={st.homeProductTitleRow}>
                    <Text style={[st.itemName, st.homeProductName]} numberOfLines={2}>
                      {product.name}
                    </Text>
                    {isDeal ? <Text style={st.tag}>Deal</Text> : null}
                  </View>
                  <Text style={st.itemMeta} numberOfLines={1}>
                    {product.category}{unitLabel}
                  </Text>
                  <Text style={st.homeStoreLine} numberOfLines={1}>
                    {product.best_store_name
                      ? `${product.best_store_name}${product.best_store_area ? ` · ${product.best_store_area}` : ""}`
                      : "Store not linked yet"}
                  </Text>
                  <View style={st.homeProductMetaRow}>
                    {changeLabel ? <Text style={st.homeDeltaText}>{changeLabel}</Text> : null}
                    <Text style={st.itemMeta}>
                      {previous !== null
                        ? `Last ${money.format(previous)}`
                        : displayPrice !== null
                          ? "First tracked price"
                          : "No price history"}
                    </Text>
                  </View>
                </View>

                <View style={st.homeProductPriceCol}>
                  <Text style={st.dealPrice} numberOfLines={1}>
                    {formatPriceLabel(displayPrice)}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={(event) => {
                      event.stopPropagation();
                      onWatchProduct(product.id);
                    }}
                    style={[
                      st.homeNotifyBtn,
                      isWatching && st.homeNotifyBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        st.homeNotifyText,
                        isWatching && st.homeNotifyTextActive,
                      ]}
                    >
                      {isWatching ? "Alert on" : "Notify"}
                    </Text>
                  </Pressable>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

function CategoryPlaceholderIcon({ variant }: { variant: CategoryIconVariant }) {
  return (
    <Svg width={48} height={48} viewBox="0 0 48 48" fill="none">
      <Circle cx={24} cy={24} r={21} fill={C.primaryGhost} />
      <CategoryIconGlyph variant={variant} />
    </Svg>
  );
}

function CategoryIconGlyph({ variant }: { variant: CategoryIconVariant }) {
  const stroke = C.primaryDeep;
  const fill = C.primaryLight;
  const accent = C.primary;

  switch (variant) {
    case "meat":
      return (
        <>
          <Path d="M15 28c0-8 7-14 15-12 4 1 6 4 5 8-1 6-7 10-14 9-4 0-6-2-6-5Z" fill={fill} stroke={stroke} strokeWidth={2} />
          <Circle cx={30} cy={22} r={3} fill={C.white} stroke={stroke} strokeWidth={2} />
        </>
      );
    case "seafood":
      return (
        <>
          <Path d="M13 24c6-7 15-8 22 0-7 8-16 7-22 0Z" fill={fill} stroke={stroke} strokeWidth={2} />
          <Path d="M35 24l6-5v10l-6-5Z" fill={fill} stroke={stroke} strokeWidth={2} />
          <Circle cx={19} cy={23} r={1.6} fill={stroke} />
        </>
      );
    case "snack":
      return (
        <>
          <Path d="M17 14h14l3 22H14l3-22Z" fill={fill} stroke={stroke} strokeWidth={2} />
          <Path d="M18 20h12M19 27h10" stroke={stroke} strokeWidth={2} strokeLinecap="round" />
          <Circle cx={31} cy={32} r={2.5} fill={accent} />
        </>
      );
    case "fruit":
      return (
        <>
          <Path d="M17 25c0-6 4-9 7-6 3-3 7 0 7 6 0 7-4 11-7 11s-7-4-7-11Z" fill={fill} stroke={stroke} strokeWidth={2} />
          <Path d="M25 18c1-4 4-5 8-4-1 4-4 5-8 4Z" fill={accent} stroke={stroke} strokeWidth={2} />
        </>
      );
    case "vegetable":
      return (
        <>
          <Path d="M15 30c6-13 15-15 20-13-1 9-8 17-20 13Z" fill={fill} stroke={stroke} strokeWidth={2} />
          <Path d="M18 28c5-2 10-6 15-11" stroke={stroke} strokeWidth={2} strokeLinecap="round" />
        </>
      );
    case "dairy":
      return (
        <>
          <Path d="M18 17h12l3 6v13H15V23l3-6Z" fill={C.white} stroke={stroke} strokeWidth={2} />
          <Path d="M19 12h10l1 5H18l1-5Z" fill={fill} stroke={stroke} strokeWidth={2} />
          <Path d="M15 24h18" stroke={stroke} strokeWidth={2} />
        </>
      );
    case "grains":
      return (
        <>
          <Path d="M16 20h16l-2 16H18l-2-16Z" fill={fill} stroke={stroke} strokeWidth={2} />
          <Path d="M19 20c0-5 3-8 7-8 3 0 5 2 6 5" stroke={stroke} strokeWidth={2} strokeLinecap="round" />
          <Circle cx={22} cy={27} r={1.5} fill={stroke} />
          <Circle cx={27} cy={31} r={1.5} fill={stroke} />
        </>
      );
    case "bakery":
      return (
        <>
          <Path d="M14 27c0-6 5-10 10-10s10 4 10 10v7H14v-7Z" fill={fill} stroke={stroke} strokeWidth={2} />
          <Path d="M20 22c2 2 2 5 0 8M28 22c-2 2-2 5 0 8" stroke={stroke} strokeWidth={2} strokeLinecap="round" />
        </>
      );
    case "beverage":
      return (
        <>
          <Path d="M17 14h16l-3 23H20l-3-23Z" fill={C.white} stroke={stroke} strokeWidth={2} />
          <Path d="M19 22h12l-1 9H20l-1-9Z" fill={fill} />
          <Path d="M26 14l5-5" stroke={stroke} strokeWidth={2} strokeLinecap="round" />
        </>
      );
    case "frozen":
      return (
        <>
          <Path d="M24 13v22M15 18l18 12M33 18 15 30" stroke={stroke} strokeWidth={2} strokeLinecap="round" />
          <Circle cx={24} cy={24} r={5} fill={fill} stroke={stroke} strokeWidth={2} />
        </>
      );
    case "deli":
      return (
        <>
          <Rect x={14} y={17} width={20} height={18} rx={4} fill={C.white} stroke={stroke} strokeWidth={2} />
          <Path d="M14 24h20M24 17v18" stroke={stroke} strokeWidth={2} />
          <Circle cx={19} cy={21} r={2} fill={accent} />
          <Circle cx={29} cy={30} r={2} fill={fill} />
        </>
      );
    case "canned":
      return (
        <>
          <Path d="M17 16c0-2 14-2 14 0v17c0 2-14 2-14 0V16Z" fill={fill} stroke={stroke} strokeWidth={2} />
          <Path d="M17 16c0 2 14 2 14 0M17 25c0 2 14 2 14 0" stroke={stroke} strokeWidth={2} />
        </>
      );
    case "cooking":
      return (
        <>
          <Path d="M24 13c5 6 8 10 8 15a8 8 0 0 1-16 0c0-5 3-9 8-15Z" fill={fill} stroke={stroke} strokeWidth={2} />
          <Path d="M24 21c2 3 3 5 3 7a3 3 0 0 1-6 0c0-2 1-4 3-7Z" fill={C.white} />
        </>
      );
    case "baby":
      return (
        <>
          <Path d="M20 14h8l2 8v13H18V22l2-8Z" fill={C.white} stroke={stroke} strokeWidth={2} />
          <Path d="M19 23h10" stroke={stroke} strokeWidth={2} />
          <Circle cx={24} cy={30} r={3} fill={fill} stroke={stroke} strokeWidth={2} />
        </>
      );
    case "household":
      return (
        <>
          <Path d="M20 14h8l2 7v15H18V21l2-7Z" fill={fill} stroke={stroke} strokeWidth={2} />
          <Path d="M19 24h10M21 14v-3h6v3" stroke={stroke} strokeWidth={2} strokeLinecap="round" />
          <Circle cx={31} cy={31} r={3} fill={C.white} stroke={stroke} strokeWidth={2} />
        </>
      );
    case "personal":
      return (
        <>
          <Path d="M19 19h10l3 17H16l3-17Z" fill={fill} stroke={stroke} strokeWidth={2} />
          <Path d="M21 19v-5h6v5M20 27h8" stroke={stroke} strokeWidth={2} strokeLinecap="round" />
        </>
      );
    case "grocery":
    default:
      return (
        <>
          <Rect x={14} y={15} width={20} height={20} rx={6} fill={fill} stroke={stroke} strokeWidth={2} />
          <Path d="M18 22h12M18 27h8M20 15l2-4h5l2 4" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
  }
}
