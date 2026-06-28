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
import { formatSignedPercent } from "./priceDisplay";
import { marketingPalette as C } from "../../shared/design/palette";

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
  onOpenStoreOnMap: (storeId: string, storeName?: string) => void;
};

const SORT_OPTIONS: Array<{ value: HomeSortMode; label: string }> = [
  { value: "deals", label: "Best deals" },
  { value: "lowestPrice", label: "Lowest price" },
  { value: "biggestDrop", label: "Biggest drop" },
];

const byPrice = (product: MarketProduct) => product.current_price ?? Number.MAX_VALUE;
const byDrop = (product: MarketProduct) => product.price_delta_percent ?? Number.MAX_VALUE;

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
              placeholderTextColor="#7F9068"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              style={st.searchInput}
            />
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
        </View>

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
                    <ProductPlaceholderIcon />
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

function ProductPlaceholderIcon() {
  return (
    <Svg width={46} height={46} viewBox="0 0 46 46" fill="none">
      <Rect
        x={9}
        y={10}
        width={28}
        height={26}
        rx={7}
        fill={C.primaryGhost}
        stroke={C.primaryDeep}
        strokeWidth={2}
      />
      <Path
        d="M16 18h14M16 24h10M18 10l2-4h6l2 4"
        stroke={C.primaryDeep}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={31} cy={30} r={3} fill={C.primary} />
    </Svg>
  );
}
