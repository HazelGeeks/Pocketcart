import { Alert, Pressable, Text, View } from "react-native";
import type { ShoppingListItem } from "../../hooks/useShoppingList";
import { money } from "../../screens/nativeAppData";
import { st } from "../../screens/nativeAppStyles";
import type { MarketProduct } from "../../services/marketData";
import type { ShoppingRecommendation } from "../../utils/shoppingOptimizer";
import { AppIcon } from "../icons/AppIcon";
import { marketingPalette as C } from "../../shared/design/palette";
import { ShoppingListComposer } from "./ShoppingListComposer";
import { ShoppingListGroups } from "./ShoppingListGroups";
import { ShoppingRecommendationPanel } from "./ShoppingRecommendationPanel";

type ShoppingListPanelProps = {
  items: ShoppingListItem[];
  loading: boolean;
  listLoading: boolean;
  message: string | null;
  recommendation: ShoppingRecommendation;
  undoCount: number;
  onUndo: () => void;
  onAddProduct: (product: MarketProduct) => void;
  onAddCustom: (name: string) => void;
  onToggleCompleted: (id: string) => void;
  onBrowseDeals: () => void;
  onChangeQuantity: (productId: string, delta: number) => void;
  onClear: () => void;
  onRefresh: () => void;
  onRemove: (productId: string) => void;
  onOpenStore: (storeId: string, storeName: string) => void;
};

export function ShoppingListPanel(props: ShoppingListPanelProps) {
  const { items, listLoading, loading, recommendation } = props;
  const pending = items.filter((item) => !item.completed);
  const plan = loading ? null : recommendation.recommended;
  const partial = recommendation.unpricedProductIds.length > 0;
  const confirmClear = () => Alert.alert(
    "Clear shopping list?",
    `Remove all ${items.length} products from your list?`,
    [{ text: "Cancel", style: "cancel" }, { text: "Clear list", style: "destructive", onPress: props.onClear }],
  );

  return (
    <View style={st.shoppingPage}>
      <View style={st.shoppingHeaderRow}>
        <View style={st.shoppingHeaderCopy}>
          <Text style={st.shoppingBodyText}>{listLoading ? "Loading…" : `${pending.length} to buy`}</Text>
          <Text style={st.shoppingTotalHeadline}>{listLoading || loading ? "…" : pending.length === 0 ? "All set" : plan ? money.format(plan.total) : "—"}</Text>
          <Text style={st.shoppingFootnote}>{pending.length === 0 ? "Ready for your next trip" : plan ? partial ? `Subtotal · ${recommendation.unpricedProductIds.length} unpriced` : "Estimated total" : "No tracked total"}</Text>
        </View>
        {items.length > 0 && !listLoading ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Shopping list options" onPress={() => Alert.alert("List options", undefined, [
              { text: "About prices & sync", onPress: () => Alert.alert("Prices & sync", "Totals cover remaining items with tracked sale prices. Unpriced items and travel costs are excluded. Catalog items sync when signed in; custom items and purchase checkmarks stay on this device.") },
              { text: "Clear list", style: "destructive", onPress: confirmClear },
              { text: "Cancel", style: "cancel" },
            ])} style={st.shoppingClearBtn}>
            <AppIcon name="menu" color={C.textSoft} size={21} />
          </Pressable>
        ) : null}
      </View>
      {props.message ? <Text accessibilityRole="alert" style={st.shoppingWarningText}>{props.message}</Text> : null}
      {props.undoCount > 0 ? <View style={st.shoppingUndoBar}>
        <Text accessibilityLiveRegion="polite" style={[st.shoppingBodyText, st.shoppingItemCopy]}>{props.undoCount} {props.undoCount === 1 ? "item" : "items"} removed</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Undo removal" onPress={props.onUndo} style={st.shoppingAddButton}>
          <Text style={st.shoppingRefreshText}>Undo</Text>
        </Pressable>
      </View> : null}
      <ShoppingListComposer disabled={listLoading} onAddProduct={props.onAddProduct} onAddCustom={props.onAddCustom} />
      {listLoading ? null : items.length === 0 ? (
        <View style={st.shoppingEmptyCard}>
          <Text style={st.shoppingSectionTitle}>Your next grocery run</Text>
          <Text style={st.shoppingBodyText}>Add your first item above.</Text>
          <Pressable accessibilityRole="button" onPress={props.onBrowseDeals} style={st.shoppingEmptyAction}>
            <Text style={st.shoppingEmptyActionText}>Browse deals</Text>
          </Pressable>
        </View>
      ) : <ShoppingListGroups items={items} loading={loading} plan={plan}
        onChangeQuantity={props.onChangeQuantity} onRemove={props.onRemove} onToggleCompleted={props.onToggleCompleted} />}
      {!listLoading && pending.length > 0 ? <ShoppingRecommendationPanel itemCount={pending.length}
        recommendation={recommendation} loading={loading} onRefresh={props.onRefresh} onOpenStore={props.onOpenStore} /> : null}
    </View>
  );
}
