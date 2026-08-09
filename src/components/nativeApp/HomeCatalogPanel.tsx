import React from "react";
import { Text, View } from "react-native";
import type { MarketProduct } from "../../services/marketData";
import { st } from "../../screens/nativeAppStyles";
import type { CategoryImageUrls } from "../../utils/categoryImages";
import { HomeCatalogControls } from "./HomeCatalogControls";
import { HomePhotoBanner } from "./HomePhotoDiscovery";
import { HomeProductList } from "./HomeProductList";
import type { HomeSortMode } from "./homeCatalogUtils";

type Props = {
  query: string;
  category: string;
  categories: string[];
  categoryImageUrls: CategoryImageUrls;
  message: string | null;
  actionMessage: string | null;
  loading: boolean;
  products: MarketProduct[];
  favoriteStoreIds: string[];
  selectedProduct: MarketProduct | null;
  sortMode: HomeSortMode;
  shoppingProductIds: Set<string>;
  loadMoreSignal: number;
  storeFilterName: string | null;
  onClearStoreFilter: () => void;
  onChangeQuery: (value: string) => void;
  onChangeCategory: (value: string) => void;
  onChangeSort: (mode: HomeSortMode) => void;
  onSelectProduct: (productId: string) => void;
  onAddToShoppingList: (productId: string) => void;
};

export function HomeCatalogPanel(props: Props) {
  const resetKey = `${props.category}|${props.query}|${props.sortMode}|${props.storeFilterName ?? ""}`;
  const showPhotoDiscovery =
    !props.loading &&
    props.products.length > 0 &&
    !props.query.trim() &&
    props.category === "All" &&
    !props.storeFilterName;
  return (
    <View style={st.sectionStack}>
      {showPhotoDiscovery ? (
        <HomePhotoBanner productCount={props.products.length} />
      ) : null}
      <HomeCatalogControls
        query={props.query}
        category={props.category}
        categories={props.categories}
        categoryImageUrls={props.categoryImageUrls}
        sortMode={props.sortMode}
        storeFilterName={props.storeFilterName}
        onClearStoreFilter={props.onClearStoreFilter}
        onChangeQuery={props.onChangeQuery}
        onChangeCategory={props.onChangeCategory}
        onChangeSort={props.onChangeSort}
      />
      {props.message ? <View style={st.rowCard}><Text style={st.itemMeta}>{props.message}</Text></View> : null}
      {props.actionMessage ? <View style={st.rowCard}><Text style={st.itemMeta}>{props.actionMessage}</Text></View> : null}
      {props.loading ? (
        <View style={st.rowCard}><Text style={st.itemMeta}>Loading products...</Text></View>
      ) : props.products.length === 0 ? (
        <View style={st.rowCard}><Text style={st.itemMeta}>{props.storeFilterName ? "No current sales at this store yet." : "No current sales right now. Check back after the next weekly update."}</Text></View>
      ) : (
        <HomeProductList
          products={props.products}
          favoriteStoreIds={props.favoriteStoreIds}
          selectedProduct={props.selectedProduct}
          shoppingProductIds={props.shoppingProductIds}
          sortMode={props.sortMode}
          resetKey={resetKey}
          loadMoreSignal={props.loadMoreSignal}
          onSelectProduct={props.onSelectProduct}
          onAddToShoppingList={props.onAddToShoppingList}
        />
      )}
    </View>
  );
}
