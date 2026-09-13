import { Image, Pressable, Text, View } from "react-native";
import type { MarketProduct } from "../../services/marketData";
import { money } from "../../screens/nativeAppData";
import { st } from "../../screens/nativeAppStyles";
import { marketingPalette as C } from "../../shared/design/palette";
import { categoryToIconVariant } from "../../utils/categoryIcon";
import { productDisplayName, productSecondaryName } from "../../utils/productNames";
import { CategoryPlaceholderIcon } from "./CategoryPlaceholderIcon";
import { formatSignedPercent } from "./priceDisplay";
import type { ProductPriceView } from "./productDetailData";

type ProductDetailHeroProps = {
  alertEnabled: boolean;
  onManageAlerts: () => void;
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
  alertEnabled,
  onManageAlerts,
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
  const displayName = productDisplayName(product);
  const secondaryName = productSecondaryName(product);

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
          <CategoryPlaceholderIcon variant={categoryToIconVariant(product.category)} />
          <Text style={st.productHeroPlaceholderText}>
            {product.category || "Product"}
          </Text>
        </View>
      )}

      <View style={st.productHeroBody}>
        <View style={st.productHeroTitleRow}>
          <View style={st.productHeroTitleBlock}>
            <Text style={st.productHeroName} numberOfLines={2}>
              {displayName}
            </Text>
            {secondaryName ? (
              <Text style={st.itemMeta} numberOfLines={1}>
                {secondaryName}
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

        <View style={st.productHeroActions}>
          <Pressable
            accessibilityRole="button"
            onPress={onAddToShoppingList}
            style={[
              st.shoppingDetailAddBtn,
              { backgroundColor: C.primaryDeep },
              st.productHeroPrimaryAction,

            ]}
          >
            <Text
              style={[
                st.shoppingDetailAddText,
                { color: C.white },
              ]}
            >
              {isInShoppingList ? "Add another" : "Add to cart"}
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

        <Pressable accessibilityRole="button" disabled={addSubmitting} onPress={alertEnabled ? onManageAlerts : onAddToWatchlist} style={st.shoppingAddButton}>
          <Text style={st.shoppingRefreshText}>{addSubmitting ? "Enabling…" : alertEnabled ? "Alert enabled · Manage" : "Notify me when on sale"}</Text>
        </Pressable>
      </View>
    </View>
  );
}
