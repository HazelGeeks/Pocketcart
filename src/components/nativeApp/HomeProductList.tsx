import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import { money } from "../../screens/nativeAppData";
import { st } from "../../screens/nativeAppStyles";
import type { MarketProduct } from "../../services/marketData";
import { categoryToIconVariant } from "../../utils/categoryIcon";
import { HOME_PRODUCT_BATCH_SIZE, nextVisibleProductCount } from "../../utils/infiniteScroll";
import { productDisplayName, productSecondaryName } from "../../utils/productNames";
import { retailerNameFromStoreDisplayName } from "../../utils/retailerPriceDisplay";
import { CategoryPlaceholderIcon } from "./CategoryPlaceholderIcon";
import {
  displayPriceForProduct,
  formatPriceLabel,
  formatTrendLabel,
  type HomeSortMode,
  sortHomeProducts,
} from "./homeCatalogUtils";

type Props = {
  products: MarketProduct[];
  favoriteStoreIds: string[];
  shoppingProductIds: Set<string>;
  sortMode: HomeSortMode;
  resetKey: string;
  loadMoreSignal: number;
  onSelectProduct: (productId: string) => void;
  onAddToShoppingList: (productId: string) => void;
};

export function HomeProductList({
  products,
  favoriteStoreIds,
  shoppingProductIds,
  sortMode,
  resetKey,
  loadMoreSignal,
  onSelectProduct,
  onAddToShoppingList,
}: Props) {
  const [visibleCount, setVisibleCount] = React.useState(HOME_PRODUCT_BATCH_SIZE);
  const lastLoadMoreSignalRef = React.useRef(loadMoreSignal);
  const favoriteStoreIdSet = React.useMemo(() => new Set(favoriteStoreIds), [favoriteStoreIds]);
  const sortedProducts = React.useMemo(
    () => sortHomeProducts(products, sortMode),
    [products, sortMode],
  );
  React.useEffect(() => {
    setVisibleCount(HOME_PRODUCT_BATCH_SIZE);
    lastLoadMoreSignalRef.current = loadMoreSignal;
  }, [resetKey]);
  React.useEffect(() => {
    if (loadMoreSignal === lastLoadMoreSignalRef.current) return;
    lastLoadMoreSignalRef.current = loadMoreSignal;
    setVisibleCount((count) => nextVisibleProductCount(count, sortedProducts.length));
  }, [loadMoreSignal, sortedProducts.length]);

  return (
    <View style={st.homeProductList}>
      <View style={st.homeResultsRow}>
        <Text style={st.itemMeta}>
          Showing {Math.min(visibleCount, sortedProducts.length)} of {sortedProducts.length}
        </Text>
      </View>
      {sortedProducts.slice(0, visibleCount).map((product) => {
        const displayName = productDisplayName(product);
        const secondaryName = productSecondaryName(product);
        const preferred = product.preferred_store_price !== null;
        const effectiveDelta = preferred ? product.preferred_price_delta : product.price_delta;
        const displayPrice = displayPriceForProduct(product);
        const previous = preferred ? product.preferred_previous_price : product.previous_price;
        const trendLabel = formatTrendLabel(product);
        const trendStyle =
          effectiveDelta === null || effectiveDelta === 0
            ? st.homeDeltaFlat
            : effectiveDelta < 0
              ? st.homeDeltaDown
              : st.homeDeltaUp;
        const storeName = product.preferred_store_name ?? product.best_store_name;
        const retailerName = storeName ? retailerNameFromStoreDisplayName(storeName) : null;
        const inList = shoppingProductIds.has(product.id);
        const favorite = Boolean(
          product.preferred_store_id && favoriteStoreIdSet.has(product.preferred_store_id),
        );
        return (
          <Pressable
            key={product.id}
            accessibilityRole="button"
            onPress={() => onSelectProduct(product.id)}
            style={st.homeProductRow}
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
                  {effectiveDelta !== null && effectiveDelta < 0 ? (
                    <Text style={st.homeDealInline}>Deal</Text>
                  ) : null}
                  {effectiveDelta !== null && effectiveDelta < 0 ? " " : null}
                  {displayName}
                </Text>
                {favorite ? <Text style={st.homeFavoriteTag}>My store</Text> : null}
              </View>
              {secondaryName ? (
                <Text style={st.itemMeta} numberOfLines={1}>
                  {secondaryName}
                </Text>
              ) : null}
              <Text style={st.itemMeta} numberOfLines={1}>
                {product.category}
                {product.unit ? ` / ${product.unit}` : ""}
              </Text>
              <Text style={st.homeStoreLine} numberOfLines={1}>
                {retailerName ?? "Retailer not linked yet"}
              </Text>
              {trendLabel && previous !== null ? (
                <Text style={st.homeTrendLine} numberOfLines={1}>
                  <Text style={[st.homeDeltaText, trendStyle]}>{trendLabel}</Text>
                  <Text style={st.itemMeta}> Last {money.format(previous)}</Text>
                </Text>
              ) : null}
            </View>
            <View style={st.homeProductPriceCol}>
              <Text style={st.dealPrice} numberOfLines={1}>
                {formatPriceLabel(displayPrice)}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={(event) => {
                  event.stopPropagation();
                  onAddToShoppingList(product.id);
                }}
                style={[st.homeListBtn, inList && st.homeListBtnActive]}
              >
                <Text style={[st.homeListBtnText, inList && st.homeListBtnTextActive]}>
                  {inList ? "In list" : "Add to list"}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
