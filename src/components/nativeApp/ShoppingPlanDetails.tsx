import { Pressable, Text, View } from "react-native";
import { money } from "../../screens/nativeAppData";
import { st } from "../../screens/nativeAppStyles";
import type { ShoppingPlan } from "../../utils/shoppingOptimizer";

export function PlanStops({
  plan,
  onOpenStore,
}: {
  plan: ShoppingPlan;
  onOpenStore: (storeId: string, storeName: string) => void;
}) {
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
              <Pressable
                accessibilityRole="button"
                onPress={() => onOpenStore(stop.storeId, stop.storeName)}
                style={st.shoppingMapButton}
              >
                <Text style={st.shoppingMapLink}>View map</Text>
              </Pressable>
            </View>
          </View>
          {stop.items.map((item) => (
            <View key={item.productId} style={st.shoppingStopItem}>
              <Text style={[st.shoppingBodyText, st.shoppingItemCopy]}>{item.name} × {item.quantity}</Text>
              <Text style={st.shoppingBodyText}>{money.format(item.total)}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

export function PlanSummary({ label, plan }: { label: string; plan: ShoppingPlan | null }) {
  return (
    <View style={st.shoppingCompareCard}>
      <View style={st.shoppingCompareTopRow}>
        <Text style={st.summaryLabel}>{label}</Text>
        <Text style={st.shoppingCompareValue}>{plan ? money.format(plan.total) : "—"}</Text>
      </View>
      <Text style={st.itemMeta}>
        {plan ? plan.stops.map((stop) => stop.storeName).join(" + ") : "No full-price match"}
      </Text>
    </View>
  );
}
