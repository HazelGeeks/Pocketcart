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
};

export function ShoppingBasketRow({ item, plan, loading, onChangeQuantity, onRemove, onToggleCompleted }: Props) {
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
          <Text style={st.shoppingBodyText}>{item.unit || "Each"}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${item.name}`}
          onPress={() => onRemove(item.productId)} style={st.shoppingRemoveBtn}>
          <AppIcon name="delete" color={C.textSoft} size={20} />
        </Pressable>
      </View>
      {!item.completed ? <View style={st.shoppingBasketControls}>
        <View style={st.shoppingItemCopy}>
          <Text style={st.shoppingItemTotal}>
            {loading ? "Checking price…" : price ? money.format(price.total) : "Estimate unavailable"}
          </Text>
          {price && stop ? <Text style={st.shoppingBodyText}>{money.format(price.unitPrice)} each · {stop.storeName}</Text> : null}
        </View>
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
