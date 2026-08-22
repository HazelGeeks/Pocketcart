import type useNativeCatalog from "../../hooks/useNativeCatalog";
import type useNativeShoppingPlan from "../../hooks/useNativeShoppingPlan";
import type { MarketProduct } from "../../services/marketData";
import { HomeCatalogPanel } from "./HomeCatalogPanel";
import { ProductDetailPanel } from "./ProductDetailPanel";

type Props = {
  catalog: ReturnType<typeof useNativeCatalog>;
  favoriteStoreIds: string[];
  onAddProductToShoppingList: (product: MarketProduct) => void;
  onAddSelectedToWatchlist: () => void;
  onAddShoppingProductFromHome: (productId: string) => void;
  onOpenStoreOnMap: (storeId: string, storeName?: string) => void;
  shopping: ReturnType<typeof useNativeShoppingPlan>;
  loadMoreSignal: number;
};

export function NativeHomeTab({
  catalog,
  favoriteStoreIds,
  onAddProductToShoppingList,
  onAddSelectedToWatchlist,
  onAddShoppingProductFromHome,
  onOpenStoreOnMap,
  shopping,
  loadMoreSignal,
}: Props) {
  if (catalog.route === "catalog") {
    return (
      <HomeCatalogPanel
        query={catalog.query}
        category={catalog.category}
        categories={catalog.categories}
        categoryImageUrls={catalog.categoryImageUrls}
        message={catalog.message}
        actionMessage={catalog.actionMessage}
        loading={catalog.loading}
        products={catalog.filteredProducts}
        favoriteStoreIds={favoriteStoreIds}
        shoppingProductIds={shopping.productIds}
        loadMoreSignal={loadMoreSignal}
        sortMode={catalog.sortMode}
        onSaleOnly={catalog.onSaleOnly}
        storeFilterName={catalog.storeFilterName}
        onClearStoreFilter={catalog.clearStoreFilter}
        onChangeQuery={catalog.setQuery}
        onChangeCategory={catalog.setCategory}
        onChangeOnSaleOnly={catalog.setOnSaleOnly}
        onChangeSort={catalog.setSortMode}
        onSelectProduct={(productId) => {
          catalog.setSelectedProductId(productId);
          catalog.setRoute("detail");
        }}
        onAddToShoppingList={onAddShoppingProductFromHome}
      />
    );
  }

  return (
    <ProductDetailPanel
      product={catalog.selectedProduct}
      chart={catalog.chart}
      previousPriceRows={catalog.previousPriceRows}
      actionMessage={catalog.actionMessage}
      historyMessage={catalog.historyMessage}
      historyLoading={catalog.historyLoading}
      storePrices={catalog.storePrices}
      storePricesLoading={catalog.storePricesLoading}
      addSubmitting={catalog.addSubmitting}
      isInShoppingList={Boolean(
        catalog.selectedProduct && shopping.productIds.has(catalog.selectedProduct.id),
      )}
      onAddToWatchlist={onAddSelectedToWatchlist}
      onAddToShoppingList={() => {
        if (catalog.selectedProduct) {
          onAddProductToShoppingList(catalog.selectedProduct);
        }
      }}
      onOpenStoreOnMap={onOpenStoreOnMap}
    />
  );
}
