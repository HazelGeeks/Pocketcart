import React from "react";
import { useFamily } from "../../contexts/FamilyContext";
import { ShoppingFreezerSheet } from "./ShoppingFreezerSheet";
import { Alert, Pressable, Text, View } from "react-native";
import type { ShoppingListItem } from "../../hooks/useShoppingList";
import { CartSummary } from "./CartSummary";
import { st } from "../../screens/nativeAppStyles";
import type { MarketProduct } from "../../services/marketData";
import type { ShoppingRecommendation } from "../../utils/shoppingOptimizer";
import { ShoppingListComposer } from "./ShoppingListComposer";
import { ShoppingListGroups } from "./ShoppingListGroups";

type ShoppingListPanelProps = {
  familyName: string | null;
  userId: string | null;
  onSignIn: () => void;
  onStored: (productId: string, freezerId: string) => void;
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
  onRemove: (productId: string) => void;
};

export function ShoppingListPanel(props: ShoppingListPanelProps) {
  const family = useFamily();
  const { items, listLoading, loading, recommendation } = props;
  const [transferItem, setTransferItem] = React.useState<ShoppingListItem | null>(null);
  const [transferMessage, setTransferMessage] = React.useState<string | null>(null);
  React.useEffect(() => { setTransferItem(null); setTransferMessage(null); }, [props.userId, family.family?.id]);
  const addToFreezer = (item: ShoppingListItem) => {
    if (!props.userId) {
      Alert.alert("Sign in to use My Freezer", "Your shopping list will stay here.", [
        { text: "Cancel", style: "cancel" }, { text: "Sign in", onPress: props.onSignIn },
      ]);
      return;
    }
    setTransferMessage(null); setTransferItem(item);
  };
  const pending = items.filter((item) => !item.completed);
  const plan = loading ? null : recommendation.recommended;
  const confirmClear = () => Alert.alert(
    "Clear Cart?",
    `Remove all ${items.length} products from your Cart?`,
    [{ text: "Cancel", style: "cancel" }, { text: "Clear", style: "destructive", onPress: props.onClear }],
  );

  return (
    <View style={st.shoppingPage}>
      {transferItem && props.userId ? <ShoppingFreezerSheet key={`${props.userId}:${transferItem.productId}`} item={transferItem} userId={props.userId}
        onClose={() => setTransferItem(null)} onSaved={(id, freezerId, warning) => {
          props.onStored(id, freezerId); setTransferItem(null);
          setTransferMessage(warning ? `Saved to My Freezer. ${warning}` : "Added to My Freezer.");
        }} /> : null}
      {transferMessage ? <Text accessibilityLiveRegion="polite" style={st.shoppingRefreshText}>{transferMessage}</Text> : null}
      <CartSummary familyName={props.familyName} pendingCount={pending.length} total={plan?.total ?? null}
        unpricedCount={recommendation.unpricedProductIds.length} loading={loading} listLoading={listLoading} />
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
      ) : <ShoppingListGroups onAddToFreezer={addToFreezer} items={items} loading={loading} plan={plan}
        onChangeQuantity={props.onChangeQuantity} onRemove={props.onRemove} onToggleCompleted={props.onToggleCompleted} />}
      {!listLoading && items.length > 0 ? <Pressable accessibilityRole="button" accessibilityLabel="Clear Cart" onPress={confirmClear} style={[st.shoppingClearBtn, { alignSelf: "center" }]}><Text style={st.shoppingClearText}>Clear</Text></Pressable> : null}
    </View>
  );
}
