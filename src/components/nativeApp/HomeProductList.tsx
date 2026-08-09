import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import type { MarketProduct } from "../../services/marketData";
import { money } from "../../screens/nativeAppData";
import { st } from "../../screens/nativeAppStyles";
import { categoryToIconVariant } from "../../utils/categoryIcon";
import { productDisplayName, productSecondaryName } from "../../utils/productNames";
import {
  HOME_PRODUCT_BATCH_SIZE,
  nextVisibleProductCount,
} from "../../utils/infiniteScroll";
import { CategoryPlaceholderIcon } from "./CategoryPlaceholderIcon";
import {
  displayPriceForProduct,
  formatPriceLabel,
  formatTrendLabel,
  sortHomeProducts,
  type HomeSortMode,
} from "./homeCatalogUtils";

type Props = {
  products: MarketProduct[];
  favoriteStoreIds: string[];
  selectedProduct: MarketProduct | null;
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
  selectedProduct,
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
  const sortedProducts = React.useMemo(() => sortHomeProducts(products, sortMode), [products, sortMode]);
  React.useEffect(() => {
    setVisibleCount(HOME_PRODUCT_BATCH_SIZE);
    lastLoadMoreSignalRef.current = loadMoreSignal;
  }, [resetKey]);
  React.useEffect(() => {
    if (loadMoreSignal === lastLoadMoreSignalRef.current) return;
    lastLoadMoreSignalRef.current = loadMoreSignal;
    setVisibleCount((count) =>
      nextVisibleProductCount(count, sortedProducts.length),
    );
  }, [loadMoreSignal, sortedProducts.length]);

  return (
    <View style={st.homeProductList}>
      <View style={st.homeResultsRow}>
        <Text style={st.itemMeta}>Showing {Math.min(visibleCount, sortedProducts.length)} of {sortedProducts.length}</Text>
      </View>
      {sortedProducts.slice(0, visibleCount).map((product) => {
        const displayName = productDisplayName(product);
        const secondaryName = productSecondaryName(product);
        const preferred = product.preferred_store_price !== null;
        const effectiveDelta = preferred ? product.preferred_price_delta : product.price_delta;
        const displayPrice = displayPriceForProduct(product);
        const previous = preferred ? product.preferred_previous_price : product.previous_price;
        const storeName = product.preferred_store_name ?? product.best_store_name;
        const storeArea = product.preferred_store_area ?? product.best_store_area;
        const inList = shoppingProductIds.has(product.id);
        const favorite = Boolean(product.preferred_store_id && favoriteStoreIdSet.has(product.preferred_store_id));
        return (
          <Pressable key={product.id} accessibilityRole="button" onPress={() => onSelectProduct(product.id)} style={[st.homeProductRow, selectedProduct?.id === product.id && st.dealFeedItemActive]}>
            {product.thumbnail_url ? <Image source={{ uri: product.thumbnail_url }} style={st.homeProductThumb} resizeMode="cover" /> : (
              <View style={st.homeProductThumbPlaceholder}>
                <CategoryPlaceholderIcon variant={categoryToIconVariant(product.category)} />
              </View>
            )}
            <View style={st.homeProductMain}>
              <View style={st.homeProductTitleRow}>
                <Text style={[st.itemName, st.homeProductName]} numberOfLines={2}>{displayName}</Text>
                {effectiveDelta !== null && effectiveDelta < 0 ? <Text style={st.tag}>Deal</Text> : null}
                {favorite ? <Text style={st.homeFavoriteTag}>My store</Text> : null}
              </View>
              {secondaryName ? <Text style={st.itemMeta} numberOfLines={1}>{secondaryName}</Text> : null}
              <Text style={st.itemMeta} numberOfLines={1}>{product.category}{product.unit ? ` / ${product.unit}` : ""}</Text>
              <Text style={st.homeStoreLine} numberOfLines={1}>{storeName ? `${storeName}${storeArea ? ` · ${storeArea}` : ""}` : "Store not linked yet"}</Text>
              <View style={st.homeProductMetaRow}>
                {formatTrendLabel(product) ? <Text style={st.homeDeltaText}>{formatTrendLabel(product)}</Text> : null}
                <Text style={st.itemMeta}>{previous !== null ? `Last ${money.format(previous)}` : displayPrice !== null ? "First tracked price" : "No price history"}</Text>
              </View>
            </View>
            <View style={st.homeProductPriceCol}>
              <Text style={st.dealPrice} numberOfLines={1}>{formatPriceLabel(displayPrice)}</Text>
              <Pressable accessibilityRole="button" onPress={(event) => { event.stopPropagation(); onAddToShoppingList(product.id); }} style={[st.homeListBtn, inList && st.homeListBtnActive]}>
                <Text style={[st.homeListBtnText, inList && st.homeListBtnTextActive]}>{inList ? "In list" : "Add to list"}</Text>
              </Pressable>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
