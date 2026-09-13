import { Text, View } from "react-native";
import { st } from "../../screens/nativeAppStyles";
import { NativeHelpButton } from "./NativeHelpButton";

const TIPS = [
  ["Filter your storage", "Use All, Refrigerator, or Freezer to show every location or just one storage type. Food added while a category is selected starts with that storage type."],
  ["Set up your storage", "Sign in to save your food. Tap Add refrigerator or freezer, choose a type, and give it a name, such as Kitchen refrigerator or Garage freezer. Choose an emoji and color to make it easy to recognize. Tap the pencil beside a storage name to edit its name, emoji, or color. Delete removes the location and keeps its food in the default Refrigerator or Freezer list."],
  ["Add your food", "Tap Add food and start typing a food name. Choose a suggested product to fill its name, unit, and image, or use your own food name. Choose where it is stored and enter its quantity. You can also add a best-before date and a note. Existing food stays in Refrigerator or Freezer until you assign a named location."],
  ["Move or remove food", "Tap the pencil beside a food item to update it or choose another storage location. Tap the trash icon to remove it after confirmation."],
  ["View notifications", "Tap the bell in the top navigation bar to open the same Notifications page as Home. The dot shows when you have unread alerts."],
  ["Share with your family", "When you belong to a family, this page shows your shared food and storage locations. Your family members can see updates."],
] as const;

export function FreezerHelpButton() {
  return <NativeHelpButton title="Freezer help">
    {TIPS.map(([title, body]) => <View key={title} style={{ gap: 5 }}>
      <Text accessibilityRole="header" style={st.freezerItemName}>{title}</Text>
      <Text style={st.shoppingBodyText}>{body}</Text>
    </View>)}
  </NativeHelpButton>;
}
