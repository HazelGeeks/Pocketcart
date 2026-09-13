import React from "react";
import { Pressable, Text, View } from "react-native";
import type { ShoppingListItem } from "../../hooks/useShoppingList";
import { st } from "../../screens/nativeAppStyles";
import { groupShoppingList, type ShoppingGroupMode } from "../../utils/shoppingListGroups";
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
  const [mode, setMode] = React.useState<ShoppingGroupMode>("list");
  const [showCompleted, setShowCompleted] = React.useState(false);
  const groups = groupShoppingList(props.items, mode, props.plan);
  const completed = props.items.filter((item) => item.completed);
  const row = (item: ShoppingListItem) => <ShoppingBasketRow key={item.productId} item={item}
    plan={props.plan} loading={props.loading} onChangeQuantity={props.onChangeQuantity}
    onRemove={props.onRemove} onAddToFreezer={props.onAddToFreezer} onToggleCompleted={(id) => {
      if (!item.completed) setShowCompleted(true);
      props.onToggleCompleted(id);
    }} />;
  return (
    <View style={st.shoppingComposer}>
      <View style={st.shoppingGroupOptions}>
        {([['list', 'List'], ['category', 'Category'], ['store', 'Store']] as const).map(([value, label]) => (
          <Pressable key={value} accessibilityRole="button" accessibilityLabel={`Group shopping list by ${label}`}
            accessibilityState={{ selected: mode === value }} onPress={() => setMode(value)}
            style={[st.shoppingGroupButton, mode === value && st.shoppingGroupButtonActive]}>
            <Text style={st.shoppingRefreshText}>{label}</Text>
          </Pressable>
        ))}
      </View>
      {groups.length === 0 && completed.length > 0 ? (
        <View style={st.shoppingEmptyCard}>
          <Text style={st.shoppingSectionTitle}>All done!</Text>
          <AppIcon name="check" color={C.primaryDeep} size={30} />
        </View>
      ) : null}
      {groups.map((group) => <View key={group.key}>
        {mode !== "list" ? <Text style={st.shoppingRefreshText}>{group.label} · {group.items.length}</Text> : null}
        <View style={st.shoppingItemsCard}>{group.items.map(row)}</View>
      </View>)}
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
