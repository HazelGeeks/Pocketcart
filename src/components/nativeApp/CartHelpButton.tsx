import { Text } from "react-native";
import { st } from "../../screens/nativeAppStyles";
import { NativeHelpButton } from "./NativeHelpButton";

export function CartHelpButton() {
  return <NativeHelpButton title="Cart help">
    <Text style={st.shoppingBodyText}>Swipe right to mark an item purchased. Swipe right again in Purchased to move it back to To buy.</Text>
    <Text style={st.shoppingBodyText}>Swipe left to delete an item. Tap Undo to restore it.</Text>
    <Text style={st.shoppingBodyText}>Tap the quantity to change it or use the purchase and delete buttons.</Text>
    <Text style={st.shoppingBodyText}>Prices load when you open Cart or change the items to buy. Estimates exclude items without tracked prices and travel costs.</Text>
    <Text style={st.shoppingBodyText}>Shared Cart changes are visible to your family members.</Text>
  </NativeHelpButton>;
}
