import React from "react";
import { Pressable, Text, View } from "react-native";
import { money } from "../../screens/nativeAppData";
import { st } from "../../screens/nativeAppStyles";
import { marketingPalette as C } from "../../shared/design/palette";
import { buildShoppingCoverageSummary, type ShoppingRecommendation } from "../../utils/shoppingOptimizer";
import { AppIcon } from "../icons/AppIcon";
import { PlanStops, PlanSummary } from "./ShoppingPlanDetails";

type Props = {
  itemCount: number;
  recommendation: ShoppingRecommendation;
  loading: boolean;
  onRefresh: () => void;
  onOpenStore: (id: string, name: string) => void;
};

export function ShoppingRecommendationPanel({ itemCount, recommendation, loading, onRefresh, onOpenStore }: Props) {
  const [showPlan, setShowPlan] = React.useState(false);
  const [showComparison, setShowComparison] = React.useState(false);
  const recommended = loading ? null : recommendation.recommended;
  const unpricedCount = recommendation.unpricedProductIds.length;
  const coverage = buildShoppingCoverageSummary(itemCount, unpricedCount);
  const singleSavings =
    recommendation.bestSingle && recommendation.bestSplit
      ? Math.max(0, recommendation.bestSingle.total - recommendation.bestSplit.total)
      : 0;
  const preferredDifference =
    recommendation.bestPreferred && recommended
      ? Math.max(0, recommendation.bestPreferred.total - recommended.total)
      : 0;

  return <View style={st.shoppingComposer}>
    <Pressable accessibilityRole="button" accessibilityLabel="Show shopping plan and price comparison"
      accessibilityState={{ expanded: showPlan }} onPress={() => setShowPlan(!showPlan)} style={st.shoppingCompareToggle}>
      <AppIcon name="map" color={C.primaryDeep} size={23} />
      <View style={st.shoppingItemCopy}>
        <Text style={st.shoppingSectionTitle}>Where to shop</Text>
        <Text style={st.shoppingFootnote}>{loading ? "Checking prices…" : recommended ? `${recommended.stops.length} ${recommended.stops.length === 1 ? "store" : "stores"}${singleSavings > 0.009 && recommended.kind === "split" ? ` · Save ${money.format(singleSavings)}` : ""}` : "Price options"}</Text>
      </View>
      <AppIcon name={showPlan ? "close" : "chevron-right"} color={C.primaryDeep} size={20} />
    </Pressable>
    {showPlan ? <View style={st.shoppingComposer}>
          <View style={st.shoppingRecommendationCard}>
            <View style={st.shoppingPlanTitleRow}>
              <View style={st.shoppingItemCopy}>
                <Text style={st.shoppingEyebrow}>{loading ? "CURRENT SALE ESTIMATE" : coverage.eyebrow}</Text>
                <Text style={st.shoppingPlanTitle}>
                  {loading
                    ? "Checking current prices..."
                    : recommended
                      ? `${recommended.stops.length} ${recommended.stops.length === 1 ? "store" : "stores"} · ${money.format(recommended.total)}${coverage.subtotalSuffix}`
                      : "Not enough price coverage"}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={onRefresh}
                style={st.shoppingRefreshBtn}
                disabled={loading}
              >
                <Text style={st.shoppingRefreshText}>{loading ? "Checking" : "Refresh"}</Text>
              </Pressable>
            </View>

            {!loading && singleSavings > 0.009 && recommended?.kind === "split" ? (
              <Text style={st.shoppingSavingsText}>
                Save {money.format(singleSavings)} compared with the cheapest one-store basket.
              </Text>
            ) : !loading && recommendation.recommendedUsesPreferredStores ? (
              <Text style={st.shoppingSavingsText}>
                This recommendation uses only your saved My stores.
              </Text>
            ) : recommended?.kind === "single" ? (
              <Text style={st.itemMeta}>
                The lowest estimate for priced items is a one-store trip.
              </Text>
            ) : null}

            {recommended ? <PlanStops plan={recommended} onOpenStore={onOpenStore} /> : null}
            {!loading && coverage.warning ? (
              <Text style={st.shoppingWarningText}>{coverage.warning}</Text>
            ) : null}
          </View>

          {!loading && (recommendation.bestSingle || recommendation.bestSplit) ? (
            <View>
              <Pressable accessibilityRole="button" accessibilityState={{ expanded: showComparison }}
                onPress={() => setShowComparison((value) => !value)} style={st.shoppingCompareToggle}>
                <Text style={st.shoppingBodyText}>{showComparison ? "Hide store comparison" : "Compare store options"}</Text>
                <AppIcon name={showComparison ? "close" : "chevron-right"} color={C.primaryDeep} size={18} />
              </Pressable>
              {showComparison ? <View style={st.shoppingCompareRow}>
              <PlanSummary label={coverage.isPartial ? "One store · priced items" : "Best one store"} plan={recommendation.bestSingle} />
              <PlanSummary label={coverage.isPartial ? "Two stores · priced items" : "Best two stores"} plan={recommendation.bestSplit} />
              {recommendation.bestPreferred && !recommendation.recommendedUsesPreferredStores ? (
                <PlanSummary
                  label={
                    preferredDifference > 0.009
                      ? `My stores (+${money.format(preferredDifference)})`
                      : "My stores"
                  }
                  plan={recommendation.bestPreferred}
                />
              ) : null}
              </View> : null}
            </View>
          ) : null}
          <Text style={st.shoppingFootnote}>
            Estimates use currently tracked sale prices. Travel cost and untracked regular prices
            are not included.
          </Text>
    </View> : null}
  </View>;
}
