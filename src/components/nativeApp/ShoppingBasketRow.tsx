import React from "react";
import { Pressable, Text, View } from "react-native";
import type { ShoppingListItem } from "../../hooks/useShoppingList";
import { money } from "../../screens/nativeAppData";
import { st } from "../../screens/nativeAppStyles";
import { marketingPalette as C } from "../../shared/design/palette";
import type { ShoppingPlan } from "../../utils/shoppingOptimizer";
import { AppIcon } from "../icons/AppIcon";

type Props = {
  item: ShoppingListItem;
  plan: ShoppingPlan | null;
  loading: boolean;
  onChangeQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onToggleCompleted: (id: string) => void;
  onAddToFreezer: (item: ShoppingListItem) => void;
};

export function ShoppingBasketRow({ item, plan, loading, onChangeQuantity, onRemove, onToggleCompleted, onAddToFreezer }: Props) {
  const [editing, setEditing] = React.useState(false);
  const stop = plan?.stops.find((candidate) => candidate.items.some((entry) => entry.productId === item.productId));
  const price = stop?.items.find((entry) => entry.productId === item.productId);
  return (
    <View style={[st.shoppingItemRow, item.completed && st.shoppingPurchasedRow]}>
      <View style={st.shoppingBasketHeading}>
        <Pressable accessibilityRole="checkbox" accessibilityLabel={`Purchased ${item.name}`}
          aria-checked={Boolean(item.completed)} accessibilityState={{ checked: Boolean(item.completed) }} onPress={() => onToggleCompleted(item.productId)}
          style={st.shoppingCheckTarget}>
          <View style={[st.shoppingCheckbox, item.completed && st.shoppingCheckboxChecked]}>
            {item.completed ? <AppIcon name="check" color={C.white} size={17} /> : null}
          </View>
        </Pressable>
        <View style={st.shoppingItemCopy}>
          <Text style={[st.shoppingProductName, item.completed && st.shoppingPurchasedName]}>{item.name}</Text>
          <Text style={st.shoppingFootnote} numberOfLines={1}>{[item.unit, !item.completed && stop?.storeName].filter(Boolean).join(" · ") || "Item"}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={`Edit quantity or remove ${item.name}`}
          accessibilityState={{ expanded: editing }} onPress={() => setEditing(!editing)} style={st.shoppingRowAmount}>
          {!item.completed ? <Text style={st.shoppingItemTotal} accessibilityLabel={loading ? "Checking price" : price ? undefined : "No tracked price"}>
            {loading ? "…" : price ? money.format(price.total) : "—"}
          </Text> : null}
          <View style={st.shoppingQuantityPill}>
            <Text style={st.shoppingRefreshText}>×{item.quantity}</Text>
            <AppIcon name={editing ? "close" : "edit"} color={C.primaryDeep} size={13} />
          </View>
        </Pressable>
      </View>
      {item.completed ? <Pressable accessibilityRole="button" accessibilityLabel={item.freezerItemId ? `${item.name} added to My Freezer` : `Add ${item.name} to My Freezer`}
        disabled={Boolean(item.freezerItemId)} accessibilityState={{ disabled: Boolean(item.freezerItemId) }}
        onPress={() => onAddToFreezer(item)} style={st.shoppingAddButton}>
        <AppIcon name={item.freezerItemId ? "check" : "freezer"} color={C.primaryDeep} size={18} />
        <Text style={st.shoppingRefreshText}>{item.freezerItemId ? "Added to My Freezer" : "Add to My Freezer"}</Text>
      </Pressable> : null}
      {editing ? <View style={st.shoppingBasketControls}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${item.name}`}
          onPress={() => onRemove(item.productId)} style={st.shoppingAddButton}>
          <AppIcon name="delete" color={C.textSoft} size={18} />
          <Text style={st.shoppingBodyText}>Remove</Text>
        </Pressable>
        <View style={st.quantityControl}>
          <Pressable accessibilityRole="button" accessibilityLabel={`Decrease quantity of ${item.name}`}
            accessibilityState={{ disabled: item.quantity <= 1 }} disabled={item.quantity <= 1}
            onPress={() => onChangeQuantity(item.productId, -1)}
            style={[st.quantityBtn, item.quantity <= 1 && st.shoppingControlDisabled]}>
            <Text style={st.quantityBtnText}>−</Text>
          </Pressable>
          <Text accessibilityLabel={`Quantity ${item.quantity}`} style={st.quantityValue}>{item.quantity}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={`Increase quantity of ${item.name}`}
            accessibilityState={{ disabled: item.quantity >= 99 }} disabled={item.quantity >= 99}
            onPress={() => onChangeQuantity(item.productId, 1)}
            style={[st.quantityBtn, item.quantity >= 99 && st.shoppingControlDisabled]}>
            <Text style={st.quantityBtnText}>+</Text>
          </Pressable>
        </View>
      </View> : null}
    </View>
  );
}
