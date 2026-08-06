import React from "react";
import { Text, View } from "react-native";
import type { MarketProduct } from "../../services/marketData";
import { st } from "../../screens/nativeAppStyles";
import { HomeCatalogControls } from "./HomeCatalogControls";
import { HomeProductList } from "./HomeProductList";
import type { HomeSortMode } from "./homeCatalogUtils";

type Props = {
  query: string;
  category: string;
  categories: string[];
  message: string | null;
  actionMessage: string | null;
  loading: boolean;
  products: MarketProduct[];
  favoriteStoreIds: string[];
  selectedProduct: MarketProduct | null;
  sortMode: HomeSortMode;
  shoppingProductIds: Set<string>;
  unreadAlertCount: number;
  storeFilterName: string | null;
  onClearStoreFilter: () => void;
  onChangeQuery: (value: string) => void;
  onChangeCategory: (value: string) => void;
  onChangeSort: (mode: HomeSortMode) => void;
  onSelectProduct: (productId: string) => void;
  onAddToShoppingList: (productId: string) => void;
  onOpenAlerts: () => void;
};

export function HomeCatalogPanel(props: Props) {
  const resetKey = `${props.category}|${props.query}|${props.sortMode}|${props.storeFilterName ?? ""}`;
  return (
    <View style={st.sectionStack}>
      <HomeCatalogControls
        query={props.query}
        category={props.category}
        categories={props.categories}
        sortMode={props.sortMode}
        unreadAlertCount={props.unreadAlertCount}
        storeFilterName={props.storeFilterName}
        onClearStoreFilter={props.onClearStoreFilter}
        onChangeQuery={props.onChangeQuery}
        onChangeCategory={props.onChangeCategory}
        onChangeSort={props.onChangeSort}
        onOpenAlerts={props.onOpenAlerts}
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
          onSelectProduct={props.onSelectProduct}
          onAddToShoppingList={props.onAddToShoppingList}
        />
      )}
    </View>
  );
}
