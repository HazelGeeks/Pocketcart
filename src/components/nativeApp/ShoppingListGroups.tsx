import React from "react";
import { Pressable, Text, View } from "react-native";
import type { ShoppingListItem } from "../../hooks/useShoppingList";
import { st } from "../../screens/nativeAppStyles";
import type { ShoppingPlan } from "../../utils/shoppingOptimizer";
import { AppIcon } from "../icons/AppIcon";
import { marketingPalette as C } from "../../shared/design/palette";
import { ShoppingBasketRow } from "./ShoppingBasketRow";

type Props = {
  items: ShoppingListItem[];
  plan: ShoppingPlan | null;
  loading: boolean;
  onChangeQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onToggleCompleted: (id: string) => void;
  onAddToFreezer: (item: ShoppingListItem) => void;
};

export function ShoppingListGroups(props: Props) {
  const [showCompleted, setShowCompleted] = React.useState(false);
  const pending = props.items.filter((item) => !item.completed);
  const completed = props.items.filter((item) => item.completed);
  const row = (item: ShoppingListItem) => <ShoppingBasketRow key={item.productId} item={item}
    plan={props.plan} loading={props.loading} onChangeQuantity={props.onChangeQuantity}
    onRemove={props.onRemove} onAddToFreezer={props.onAddToFreezer} onToggleCompleted={(id) => {
      if (!item.completed) setShowCompleted(true);
      props.onToggleCompleted(id);
    }} />;
  return (
    <View style={st.shoppingComposer}>
      {pending.length === 0 && completed.length > 0 ? (
        <View style={st.shoppingEmptyCard}>
          <Text style={st.shoppingSectionTitle}>All done!</Text>
          <AppIcon name="check" color={C.primaryDeep} size={30} />
        </View>
      ) : null}
      {pending.length > 0 ? <View style={st.shoppingItemsCard}>{pending.map(row)}</View> : null}
      {completed.length > 0 ? <View>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: showCompleted }}
          onPress={() => setShowCompleted((value) => !value)} style={st.shoppingCompareToggle}>
          <Text style={st.shoppingSectionTitle}>Purchased · {completed.length}</Text>
          <AppIcon name={showCompleted ? "close" : "chevron-right"} color={C.textSoft} size={18} />
        </Pressable>
        {showCompleted ? <View style={st.shoppingItemsCard}>{completed.map(row)}</View> : null}
      </View> : null}
    </View>
  );
}
