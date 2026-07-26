import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import type { MarketProduct } from "../../services/marketData";
import { money } from "../../screens/nativeAppData";
import { st } from "../../screens/nativeAppStyles";
import { marketingPalette as C } from "../../shared/design/palette";
import { formatSignedPercent } from "./priceDisplay";
import type { ProductPriceView } from "./productDetailData";

type ProductDetailHeroProps = {
  product: MarketProduct;
  priceView: ProductPriceView;
  addSubmitting: boolean;
  isInShoppingList: boolean;
  canOpenStore: boolean;
  onAddToShoppingList: () => void;
  onAddToWatchlist: () => void;
  onOpenStore: () => void;
};

export function ProductDetailHero({
  product,
  priceView,
  addSubmitting,
  isInShoppingList,
  canOpenStore,
  onAddToShoppingList,
  onAddToWatchlist,
  onOpenStore,
}: ProductDetailHeroProps) {
  const {
    currentPrice,
    priceDelta,
    priceDeltaPercent,
    isRising,
    isDropping,
    hasTrend,
    storeLine,
    decisionText,
  } = priceView;

  return (
    <View style={st.productHeroCard}>
      {product.thumbnail_url ? (
        <Image
          source={{ uri: product.thumbnail_url }}
          style={st.productHeroImage}
          resizeMode="cover"
        />
      ) : (
        <View style={st.productHeroPlaceholder}>
          <Text style={st.productHeroPlaceholderText}>
            {product.category || "Product"}
          </Text>
          <Text style={st.productHeroPlaceholderSub}>Image unavailable</Text>
        </View>
      )}

      <View style={st.productHeroBody}>
        <View style={st.productHeroTitleRow}>
          <View style={st.productHeroTitleBlock}>
            <Text style={st.productHeroName} numberOfLines={2}>
              {product.name}
            </Text>
            {product.english_name ? (
              <Text style={st.itemMeta} numberOfLines={1}>
                {product.english_name}
              </Text>
            ) : null}
          </View>
          <Text style={st.productHeroDecision}>
            {hasTrend
              ? isDropping
                ? "Buy"
                : isRising
                  ? "Wait"
                  : "Monitor"
              : "New price"}
          </Text>
        </View>

        <Text style={st.productHeroStore} numberOfLines={1}>
          {storeLine}
        </Text>

        <View style={st.productHeroPriceRow}>
          <View>
            <Text style={st.summaryLabel}>Current price</Text>
            <Text style={st.productHeroPrice}>
              {currentPrice !== null ? money.format(currentPrice) : "-"}
            </Text>
            {product.unit ? (
              <Text style={st.itemMeta}>per {product.unit}</Text>
            ) : null}
          </View>
          <View style={st.productHeroChangeCard}>
            <Text style={st.summaryLabel}>Change</Text>
            <Text
              style={[
                st.productHeroChange,
                isRising
                  ? st.historyDiffUp
                  : isDropping
                    ? st.historyDiffDown
                    : undefined,
              ]}
            >
              {priceDelta !== null && priceDeltaPercent !== null
                ? formatSignedPercent(priceDeltaPercent)
                : "-"}
            </Text>
            <Text style={st.itemMeta} numberOfLines={1}>
              vs last sale
            </Text>
          </View>
        </View>

        <Text style={st.productDecisionText}>{decisionText}</Text>

        <Pressable
          accessibilityRole="button"
          disabled={addSubmitting}
          onPress={onAddToWatchlist}
          style={st.watchlistCtaBtn}
        >
          <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
            <Path
              d="m12 4 2.35 4.76 5.25.76-3.8 3.7.9 5.23L12 16l-4.7 2.45.9-5.23-3.8-3.7 5.25-.76L12 4Z"
              stroke={C.white}
              strokeWidth={2.1}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          <Text style={st.watchlistCtaText}>
            {addSubmitting ? "Enabling..." : "Notify me when on sale"}
          </Text>
        </Pressable>

        <View style={st.productHeroActions}>
          <Pressable
            accessibilityRole="button"
            onPress={onAddToShoppingList}
            style={[
              st.shoppingDetailAddBtn,
              st.productHeroPrimaryAction,
              isInShoppingList && st.shoppingDetailAddBtnActive,
            ]}
          >
            <Text
              style={[
                st.shoppingDetailAddText,
                isInShoppingList && st.shoppingDetailAddTextActive,
              ]}
            >
              {isInShoppingList ? "Add another" : "Add to shopping list"}
            </Text>
          </Pressable>
          {canOpenStore ? (
            <Pressable
              accessibilityRole="button"
              onPress={onOpenStore}
              style={[
                st.watchlistSecondaryBtn,
                st.productHeroSecondaryAction,
              ]}
            >
              <Text style={st.watchlistSecondaryText}>View store map</Text>
            </Pressable>
          ) : null}
        </View>

        <Text style={st.watchlistCtaHelp}>
          Sale alerts stay active for future weekly prices. Your shopping list
          is for this trip only.
        </Text>
      </View>
    </View>
  );
}
