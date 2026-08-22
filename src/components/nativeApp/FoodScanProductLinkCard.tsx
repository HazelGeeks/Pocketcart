import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { money } from "../../screens/nativeAppData";
import { st } from "../../screens/nativeAppStyles";
import type { FoodScanProductLink } from "../../services/foodScanProductLink";
import type { MarketProduct } from "../../services/marketData";
import { marketingPalette as C } from "../../shared/design/palette";
import { formatFoodScanSalePeriod } from "../../utils/foodScanProductMatch";
import { AppIcon } from "../icons/AppIcon";

export function FoodScanProductLinkCard({
  link,
  loading,
  onOpenProduct,
}: {
  link: FoodScanProductLink | null;
  loading: boolean;
  onOpenProduct: (product: MarketProduct) => void;
}) {
  if (loading) {
    return (
      <View style={st.foodScanLinkLoading}>
        <ActivityIndicator color={C.primaryDeep} size="small" />
        <Text style={st.itemMeta}>Checking PocketCart prices…</Text>
      </View>
    );
  }
  if (!link) return null;

  const { product, currentSale, previousSale } = link;
  const latest = currentSale ?? previousSale;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View price history for ${product.english_name ?? product.korean_name}`}
      onPress={() => onOpenProduct(product)}
      style={({ pressed }) => [st.foodScanLinkCard, pressed && st.foodScanLinkCardPressed]}
    >
      <View style={st.foodScanLinkContent}>
        <Text style={st.foodScanEyebrow}>Found in PocketCart</Text>
        <Text style={st.foodScanLinkName} numberOfLines={1}>
          {product.english_name ?? product.korean_name}
          {product.unit ? ` · ${product.unit}` : ""}
        </Text>
        {latest ? (
          <Text style={st.foodScanLinkPrice}>
            {currentSale ? "On sale " : "Last sale "}
            {money.format(latest.price)}
          </Text>
        ) : (
          <Text style={st.itemMeta}>No tracked sale price yet</Text>
        )}
        {latest ? (
          <Text style={st.foodScanLinkMeta} numberOfLines={1}>
            {latest.store_name} · {formatFoodScanSalePeriod(latest)}
          </Text>
        ) : null}
        {currentSale && previousSale ? (
          <Text style={st.foodScanLinkPrevious}>
            Previous {money.format(previousSale.price)} · {formatFoodScanSalePeriod(previousSale)}
          </Text>
        ) : null}
      </View>
      <View style={st.foodScanLinkAction}>
        <Text style={st.foodScanLinkActionText}>Price history</Text>
        <AppIcon name="chevron-right" color={C.primaryDeep} size={18} strokeWidth={2.3} />
      </View>
    </Pressable>
  );
}
