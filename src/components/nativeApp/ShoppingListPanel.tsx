import React from "react";
import { Pressable, Text, View } from "react-native";
import type { ShoppingListItem } from "../../hooks/useShoppingList";
import { money } from "../../screens/nativeAppData";
import { st } from "../../screens/nativeAppStyles";
import {
  buildShoppingCoverageSummary,
  type ShoppingPlan,
  type ShoppingRecommendation,
} from "../../utils/shoppingOptimizer";

type ShoppingListPanelProps = {
  items: ShoppingListItem[];
  loading: boolean;
  message: string | null;
  recommendation: ShoppingRecommendation;
  onChangeQuantity: (productId: string, delta: number) => void;
  onClear: () => void;
  onRefresh: () => void;
  onRemove: (productId: string) => void;
  onOpenStore: (storeId: string, storeName: string) => void;
};

export function ShoppingListPanel({
  items,
  loading,
  message,
  recommendation,
  onChangeQuantity,
  onClear,
  onRefresh,
  onRemove,
  onOpenStore,
}: ShoppingListPanelProps) {
  const recommended = recommendation.recommended;
  const unpricedCount = recommendation.unpricedProductIds.length;
  const coverage = buildShoppingCoverageSummary(items.length, unpricedCount);
  const singleSavings = recommendation.bestSingle && recommendation.bestSplit
    ? Math.max(0, recommendation.bestSingle.total - recommendation.bestSplit.total)
    : 0;
  const preferredDifference =
    recommendation.bestPreferred && recommended
      ? Math.max(0, recommendation.bestPreferred.total - recommended.total)
      : 0;

  return (
    <View style={st.sectionStack}>
      <View style={st.shoppingHeaderRow}>
        <View style={st.shoppingHeaderCopy}>
          <Text style={st.sectionSub}>Compare one-stop shopping with the cheapest two-store combination.</Text>
        </View>
        {items.length > 0 ? (
          <Pressable accessibilityRole="button" onPress={onClear} style={st.shoppingClearBtn}>
            <Text style={st.shoppingClearText}>Clear</Text>
          </Pressable>
        ) : null}
      </View>

      {items.length === 0 ? (
        <View style={st.shoppingEmptyCard}>
          <Text style={st.itemName}>Build this week's basket</Text>
          <Text style={st.itemMeta}>Tap “Add to list” on products from Home. Signed-in lists sync across devices.</Text>
        </View>
      ) : (
        <>
          <View style={st.shoppingItemsCard}>
            {items.map((item, index) => (
              <View key={item.productId} style={[st.shoppingItemRow, index > 0 && st.shoppingItemDivider]}>
                <View style={st.shoppingItemCopy}>
                  <Text style={st.itemName} numberOfLines={2}>{item.name}</Text>
                  <Text style={st.itemMeta}>{item.unit ?? "Each"}</Text>
                </View>
                <View style={st.quantityControl}>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Decrease ${item.name}`} onPress={() => onChangeQuantity(item.productId, -1)} style={st.quantityBtn}>
                    <Text style={st.quantityBtnText}>−</Text>
                  </Pressable>
                  <Text style={st.quantityValue}>{item.quantity}</Text>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Increase ${item.name}`} onPress={() => onChangeQuantity(item.productId, 1)} style={st.quantityBtn}>
                    <Text style={st.quantityBtnText}>+</Text>
                  </Pressable>
                </View>
                <Pressable accessibilityRole="button" onPress={() => onRemove(item.productId)} style={st.shoppingRemoveBtn}>
                  <Text style={st.shoppingRemoveText}>Remove</Text>
                </Pressable>
              </View>
            ))}
          </View>

          <View style={st.shoppingRecommendationCard}>
            <View style={st.shoppingPlanTitleRow}>
              <View>
                <Text style={st.shoppingEyebrow}>
                  {coverage.eyebrow}
                </Text>
                <Text style={st.shoppingPlanTitle}>
                  {loading
                    ? "Checking current prices..."
                    : recommended
                      ? `${recommended.stops.length} ${recommended.stops.length === 1 ? "store" : "stores"} · ${money.format(recommended.total)}${coverage.subtotalSuffix}`
                      : "Not enough price coverage"}
                </Text>
              </View>
              <Pressable accessibilityRole="button" onPress={onRefresh} style={st.shoppingRefreshBtn} disabled={loading}>
                <Text style={st.shoppingRefreshText}>{loading ? "Checking" : "Refresh"}</Text>
              </Pressable>
            </View>

            {singleSavings > 0.009 && recommended?.kind === "split" ? (
              <Text style={st.shoppingSavingsText}>Save {money.format(singleSavings)} compared with the cheapest one-store basket.</Text>
            ) : recommendation.recommendedUsesPreferredStores ? (
              <Text style={st.shoppingSavingsText}>This recommendation uses only your saved My stores.</Text>
            ) : recommended?.kind === "single" ? (
              <Text style={st.itemMeta}>The cheapest complete basket is also the simplest one-stop trip.</Text>
            ) : null}

            {recommended ? <PlanStops plan={recommended} onOpenStore={onOpenStore} /> : null}
            {message ? <Text style={st.shoppingWarningText}>{message}</Text> : null}
            {!loading && coverage.warning ? (
              <Text style={st.shoppingWarningText}>{coverage.warning}</Text>
            ) : null}
          </View>

          {(recommendation.bestSingle || recommendation.bestSplit) ? (
            <View style={st.shoppingCompareRow}>
              <PlanSummary label="Best one store" plan={recommendation.bestSingle} />
              <PlanSummary label="Best two stores" plan={recommendation.bestSplit} />
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
            </View>
          ) : null}
          <Text style={st.shoppingFootnote}>Estimates use currently tracked sale prices. Travel cost and untracked regular prices are not included.</Text>
        </>
      )}
    </View>
  );
}

function PlanStops({ plan, onOpenStore }: { plan: ShoppingPlan; onOpenStore: ShoppingListPanelProps["onOpenStore"] }) {
  return (
    <View style={st.shoppingStops}>
      {plan.stops.map((stop, index) => (
        <View key={stop.storeId} style={st.shoppingStopCard}>
          <View style={st.shoppingStopHeader}>
            <View style={st.shoppingStopCopy}>
              <Text style={st.shoppingStopNumber}>STOP {index + 1}</Text>
              <Text style={st.itemName}>{stop.storeName}</Text>
              {stop.storeArea ? <Text style={st.itemMeta}>{stop.storeArea}</Text> : null}
            </View>
            <View style={st.shoppingStopPriceCol}>
              <Text style={st.storePrice}>{money.format(stop.subtotal)}</Text>
              <Pressable accessibilityRole="button" onPress={() => onOpenStore(stop.storeId, stop.storeName)}>
                <Text style={st.shoppingMapLink}>View map</Text>
              </Pressable>
            </View>
          </View>
          <Text style={st.itemMeta}>{stop.items.map((item) => `${item.name} × ${item.quantity}`).join(" · ")}</Text>
        </View>
      ))}
    </View>
  );
}

function PlanSummary({ label, plan }: { label: string; plan: ShoppingPlan | null }) {
  return (
    <View style={st.shoppingCompareCard}>
      <Text style={st.summaryLabel}>{label}</Text>
      <Text style={st.shoppingCompareValue}>{plan ? money.format(plan.total) : "—"}</Text>
      <Text style={st.itemMeta}>{plan ? plan.stops.map((stop) => stop.storeName).join(" + ") : "No full-price match"}</Text>
    </View>
  );
}
