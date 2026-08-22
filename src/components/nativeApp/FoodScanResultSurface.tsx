import { Pressable, Text, View } from "react-native";
import { st } from "../../screens/nativeAppStyles";
import type { FoodScanMode, FoodScanResult } from "../../services/foodScan";
import type { FoodScanProductLink } from "../../services/foodScanProductLink";
import type { MarketProduct } from "../../services/marketData";
import { FoodScanProductLinkCard } from "./FoodScanProductLinkCard";
import { FoodScanResultView } from "./FoodScanResultView";

export function FoodScanResultSurface({
  mode,
  result,
  productLink,
  productLinkLoading,
  onOpenProduct,
  onScanAgain,
}: {
  mode: FoodScanMode;
  result: FoodScanResult;
  productLink: FoodScanProductLink | null;
  productLinkLoading: boolean;
  onOpenProduct: (product: MarketProduct) => void;
  onScanAgain: () => void;
}) {
  return (
    <>
      <FoodScanResultView mode={mode} result={result} />
      <FoodScanProductLinkCard
        link={productLink}
        loading={productLinkLoading}
        onOpenProduct={onOpenProduct}
      />
      <View style={st.foodScanCaptureRow}>
        <Pressable
          accessibilityRole="button"
          onPress={onScanAgain}
          style={[st.foodScanAction, st.foodScanActionPrimary, st.foodScanActionCentered]}
        >
          <Text style={st.foodScanActionPrimaryText}>Scan again</Text>
        </Pressable>
      </View>
    </>
  );
}
