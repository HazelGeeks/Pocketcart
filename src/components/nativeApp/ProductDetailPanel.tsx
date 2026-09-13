import React from "react";
import { Text, View } from "react-native";
import { type PriceChart } from "../../screens/nativeAppData";
import { st } from "../../screens/nativeAppStyles";
import type { MarketProduct, MarketStorePrice } from "../../services/marketData";
import { ProductDetailHero } from "./ProductDetailHero";
import { ProductPriceTrendSection } from "./ProductPriceTrendSection";
import { ProductStoreComparison } from "./ProductStoreComparison";
import { buildStorePriceGroups, getProductPriceView } from "./productDetailData";

type ProductDetailPanelProps = {
  alertEnabled: boolean;
  onManageAlerts: () => void;
  product: MarketProduct | null;
  chart: PriceChart | null;
  actionMessage: string | null;
  historyMessage: string | null;
  historyLoading: boolean;
  storePrices: MarketStorePrice[];
  storePricesLoading: boolean;
  addSubmitting: boolean;
  isInShoppingList: boolean;
  onAddToShoppingList: () => void;
  onAddToWatchlist: () => void;
  onOpenStoreOnMap?: (storeId: string, storeName?: string) => void;
};

export function ProductDetailPanel({
  alertEnabled,
  onManageAlerts,
  product,
  chart,
  actionMessage,
  historyMessage,
  historyLoading,
  storePrices,
  storePricesLoading,
  addSubmitting,
  isInShoppingList,
  onAddToShoppingList,
  onAddToWatchlist,
  onOpenStoreOnMap,
}: ProductDetailPanelProps) {
  const storePriceGroups = React.useMemo(() => buildStorePriceGroups(storePrices), [storePrices]);

  return (
    <View style={st.sectionStack}>
      {product ? (
        <ProductDetailContent alertEnabled={alertEnabled} onManageAlerts={onManageAlerts}
          product={product}
          chart={chart}
          actionMessage={actionMessage}
          historyMessage={historyMessage}
          historyLoading={historyLoading}
          storePriceGroups={storePriceGroups}
          storePricesLoading={storePricesLoading}
          addSubmitting={addSubmitting}
          isInShoppingList={isInShoppingList}
          onAddToShoppingList={onAddToShoppingList}
          onAddToWatchlist={onAddToWatchlist}
          onOpenStoreOnMap={onOpenStoreOnMap}
        />
      ) : (
        <View style={st.rowCard}>
          <Text style={st.itemMeta}>Product not found. Go back and choose again.</Text>
        </View>
      )}
    </View>
  );
}

type ProductDetailContentProps = Omit<ProductDetailPanelProps, "product" | "storePrices"> & {
  product: MarketProduct;
  storePriceGroups: ReturnType<typeof buildStorePriceGroups>;
};

function ProductDetailContent({
  alertEnabled,
  onManageAlerts,
  product,
  chart,
  actionMessage,
  historyMessage,
  historyLoading,
  storePriceGroups,
  storePricesLoading,
  addSubmitting,
  isInShoppingList,
  onAddToShoppingList,
  onAddToWatchlist,
  onOpenStoreOnMap,
}: ProductDetailContentProps) {
  const priceView = getProductPriceView(product);
  const canOpenStore = Boolean(priceView.bestStoreId && onOpenStoreOnMap);
  const openStore = () => {
    if (!priceView.bestStoreId) return;
    onOpenStoreOnMap?.(priceView.bestStoreId, priceView.bestStoreName ?? undefined);
  };

  return (
    <View style={st.productDetailStack}>
      <ProductDetailHero alertEnabled={alertEnabled} onManageAlerts={onManageAlerts}
        product={product}
        priceView={priceView}
        addSubmitting={addSubmitting}
        isInShoppingList={isInShoppingList}
        canOpenStore={canOpenStore}
        onAddToShoppingList={onAddToShoppingList}
        onAddToWatchlist={onAddToWatchlist}
        onOpenStore={openStore}
      />

      {actionMessage ? <Text style={st.itemMeta}>{actionMessage}</Text> : null}
      {historyMessage ? <Text style={st.itemMeta}>{historyMessage}</Text> : null}

      <ProductPriceTrendSection
        chart={chart}
        historyLoading={historyLoading}
      />

      <ProductStoreComparison rows={storePriceGroups} loading={storePricesLoading} />
    </View>
  );
}
