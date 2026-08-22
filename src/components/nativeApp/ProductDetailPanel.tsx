import React from "react";
import { Text, View } from "react-native";
import { money, type PreviousPriceRow, type PriceChart } from "../../screens/nativeAppData";
import { st } from "../../screens/nativeAppStyles";
import type { MarketProduct, MarketStorePrice } from "../../services/marketData";
import { ProductDetailHero } from "./ProductDetailHero";
import { ProductPriceTrendSection } from "./ProductPriceTrendSection";
import { ProductStoreComparison } from "./ProductStoreComparison";
import { formatSignedPercent } from "./priceDisplay";
import { buildStorePriceGroups, getProductPriceView } from "./productDetailData";

type ProductDetailPanelProps = {
  product: MarketProduct | null;
  chart: PriceChart | null;
  previousPriceRows: PreviousPriceRow[];
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
  product,
  chart,
  previousPriceRows,
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
        <ProductDetailContent
          product={product}
          chart={chart}
          previousPriceRows={previousPriceRows}
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
  product,
  chart,
  previousPriceRows,
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
      <ProductDetailHero
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
        previousPriceRows={previousPriceRows}
        historyLoading={historyLoading}
      />

      <View style={st.productInfoSection}>
        <Text style={st.productTrendHeading}>Product information</Text>
        <View style={st.productInfoList}>
          <InfoRow
            label="Previous"
            value={priceView.previousPrice !== null ? money.format(priceView.previousPrice) : "-"}
          />
          <InfoRow label="Category" value={product.category || "-"} />
          <InfoRow label="Unit" value={product.unit || "-"} />
          <InfoRow
            label={priceView.usesPreferredStore ? "Selected retailer" : "Best retailer"}
            value={priceView.bestRetailerName ?? "Need retailer match"}
          />
        </View>

        <View style={st.tagRow}>
          <Text style={st.tag}>{priceView.decisionLabel}</Text>
          {priceView.priceDeltaPercent !== null ? (
            <Text style={st.tag}>
              {priceView.priceDeltaPercent > 0
                ? "Price up "
                : priceView.priceDeltaPercent < 0
                  ? "Price down "
                  : "Flat "}
              {formatSignedPercent(priceView.priceDeltaPercent)}
            </Text>
          ) : null}
        </View>
      </View>

      <ProductStoreComparison rows={storePriceGroups} loading={storePricesLoading} />
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={st.productInfoRow}>
      <Text style={st.summaryLabel}>{label}</Text>
      <Text style={[st.summaryValue, st.summaryValueSmall, st.productInfoValue]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}
