import { Alert, Pressable, Text, View } from "react-native";
import type { ShoppingListItem } from "../../hooks/useShoppingList";
import { money } from "../../screens/nativeAppData";
import { st } from "../../screens/nativeAppStyles";
import type { MarketProduct } from "../../services/marketData";
import type { ShoppingRecommendation } from "../../utils/shoppingOptimizer";
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
  const completedCount = items.length - pending.length;
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
          <Text style={st.shoppingSectionTitle}>{listLoading ? "Your shopping list" : `${pending.length} to buy · ${completedCount} purchased`}</Text>
          <Text style={st.shoppingBodyText}>
            {listLoading ? "Loading your list…" : pending.length === 0 ? "Add items below for your next trip."
              : loading ? "Checking current prices…"
                : plan ? `${money.format(plan.total)} ${partial ? "priced subtotal" : "estimated"} · remaining items`
                  : "Remaining items have no complete store estimate."}
          </Text>
          {!loading && !listLoading && partial && pending.length > 0 ? (
            <Text style={st.shoppingFootnote}>{recommendation.unpricedProductIds.length} without a tracked price · excluded from estimate</Text>
          ) : null}
        </View>
        {items.length > 0 && !listLoading ? (
          <Pressable accessibilityRole="button" onPress={confirmClear} style={st.shoppingClearBtn}>
            <Text style={st.shoppingClearText}>Clear list</Text>
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
          <Text style={st.shoppingSectionTitle}>Build this week's basket</Text>
          <Text style={st.shoppingBodyText}>Search above or type anything you need. You can also add products from current deals.</Text>
          <Pressable accessibilityRole="button" onPress={props.onBrowseDeals} style={st.shoppingEmptyAction}>
            <Text style={st.shoppingEmptyActionText}>Browse current deals</Text>
          </Pressable>
        </View>
      ) : <ShoppingListGroups items={items} loading={loading} plan={plan}
        onChangeQuantity={props.onChangeQuantity} onRemove={props.onRemove} onToggleCompleted={props.onToggleCompleted} />}
      {!listLoading && pending.length > 0 ? <ShoppingRecommendationPanel itemCount={pending.length}
        recommendation={recommendation} loading={loading} onRefresh={props.onRefresh} onOpenStore={props.onOpenStore} /> : null}
      <Text style={st.shoppingFootnote}>Catalog items sync when signed in. Custom items and purchase checkmarks are saved on this device.</Text>
    </View>
  );
}
