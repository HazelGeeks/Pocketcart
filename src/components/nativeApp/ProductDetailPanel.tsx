import React from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import type {
  MarketProduct,
  MarketStorePrice,
} from "../../services/marketData";
import {
  type PreviousPriceRow,
  type PriceChart,
  money,
} from "../../screens/nativeAppData";
import { st } from "../../screens/nativeAppStyles";
import { marketingPalette as C } from "../../shared/design/palette";
import { formatSignedPercent } from "./priceDisplay";
import {
  buildStorePriceGroups,
  getProductPriceView,
} from "./productDetailData";
import { ProductDetailHero } from "./ProductDetailHero";
import { ProductPriceTrendSection } from "./ProductPriceTrendSection";
import { ProductStoreComparison } from "./ProductStoreComparison";

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
  onBack: () => void;
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
  onBack,
  onAddToShoppingList,
  onAddToWatchlist,
  onOpenStoreOnMap,
}: ProductDetailPanelProps) {
  const storePriceGroups = React.useMemo(
    () => buildStorePriceGroups(storePrices),
    [storePrices],
  );

  return (
    <View style={st.sectionStack}>
      <View style={st.detailActionRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to current deals"
          onPress={onBack}
          style={[st.detailNavBtn, st.detailActionBtn]}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path
              d="M15 18 9 12l6-6"
              stroke={C.primaryDeep}
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          <Text style={st.detailNavText}>Back to current deals</Text>
        </Pressable>
      </View>

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
          <Text style={st.itemMeta}>
            Product not found. Go back and choose again.
          </Text>
        </View>
      )}
    </View>
  );
}

type ProductDetailContentProps = Omit<
  ProductDetailPanelProps,
  "product" | "storePrices" | "onBack"
> & {
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
  const canOpenStore = Boolean(
    priceView.bestStoreId && onOpenStoreOnMap,
  );
  const openStore = () => {
    if (!priceView.bestStoreId) return;
    onOpenStoreOnMap?.(
      priceView.bestStoreId,
      priceView.bestStoreName ?? undefined,
    );
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

      <View style={st.productInfoGrid}>
        <InfoCell
          label="Previous"
          value={
            priceView.previousPrice !== null
              ? money.format(priceView.previousPrice)
              : "-"
          }
        />
        <InfoCell label="Category" value={product.category || "-"} />
        <InfoCell label="Unit" value={product.unit || "-"} />
        <InfoCell
          label={priceView.usesPreferredStore ? "Selected store" : "Best store"}
          value={priceView.bestStoreName ?? "Need store match"}
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

      <ProductStoreComparison
        rows={storePriceGroups}
        loading={storePricesLoading}
      />
    </View>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={st.productInfoCell}>
      <Text style={st.summaryLabel}>{label}</Text>
      <Text style={[st.summaryValue, st.summaryValueSmall]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}
