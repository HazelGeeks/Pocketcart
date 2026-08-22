import { Text, View } from "react-native";
import { st } from "../../screens/nativeAppStyles";
import type { MarketProduct } from "../../services/marketData";
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
  sortMode: HomeSortMode;
  onSaleOnly: boolean;
  shoppingProductIds: Set<string>;
  loadMoreSignal: number;
  storeFilterName: string | null;
  onClearStoreFilter: () => void;
  onChangeQuery: (value: string) => void;
  onChangeCategory: (value: string) => void;
  onChangeOnSaleOnly: (value: boolean) => void;
  onChangeSort: (mode: HomeSortMode) => void;
  onSelectProduct: (productId: string) => void;
  onAddToShoppingList: (productId: string) => void;
};

export function HomeCatalogPanel(props: Props) {
  const resetKey = `${props.category}|${props.query}|${props.sortMode}|${props.onSaleOnly}|${props.storeFilterName ?? ""}`;
  const showPhotoDiscovery =
    !props.loading &&
    props.products.length > 0 &&
    !props.query.trim() &&
    props.category === "All" &&
    props.onSaleOnly &&
    !props.storeFilterName;
  return (
    <View style={st.sectionStack}>
      {showPhotoDiscovery ? <HomePhotoBanner productCount={props.products.length} /> : null}
      <HomeCatalogControls
        query={props.query}
        category={props.category}
        categories={props.categories}
        categoryImageUrls={props.categoryImageUrls}
        sortMode={props.sortMode}
        onSaleOnly={props.onSaleOnly}
        storeFilterName={props.storeFilterName}
        onClearStoreFilter={props.onClearStoreFilter}
        onChangeQuery={props.onChangeQuery}
        onChangeCategory={props.onChangeCategory}
        onChangeOnSaleOnly={props.onChangeOnSaleOnly}
        onChangeSort={props.onChangeSort}
      />
      {props.message ? (
        <View style={st.rowCard}>
          <Text style={st.itemMeta}>{props.message}</Text>
        </View>
      ) : null}
      {props.actionMessage ? (
        <View style={st.rowCard}>
          <Text style={st.itemMeta}>{props.actionMessage}</Text>
        </View>
      ) : null}
      {props.loading ? (
        <View style={st.rowCard}>
          <Text style={st.itemMeta}>Loading products...</Text>
        </View>
      ) : props.products.length === 0 ? (
        <View style={st.rowCard}>
          <Text style={st.itemMeta}>
            {props.storeFilterName && props.onSaleOnly
              ? "No current sales at this store yet."
              : props.onSaleOnly
                ? "No current sales right now. Check back after the next weekly update."
                : "No products match your search or filters."}
          </Text>
        </View>
      ) : (
        <HomeProductList
          products={props.products}
          favoriteStoreIds={props.favoriteStoreIds}
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
