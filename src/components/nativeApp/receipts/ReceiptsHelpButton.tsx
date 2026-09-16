import { Text, View } from "react-native";
import { st } from "../../../screens/nativeAppStyles";
import { NativeHelpButton } from "../NativeHelpButton";

const TIPS = [
  ["Save a receipt", "Sign in, then tap Photograph receipt or Enter receipt manually. If you choose Read receipt details, your photo is sent to OpenAI to fill in purchase details. Check the store, date, items and final total before saving."],
  ["See your spending", "Choose Day, Week or Month, then use the arrows to browse earlier or later periods. Weeks run Monday–Sunday. Spending uses the final amount paid, including tax. Different currencies are shown separately."],
  ["Find and update purchases", "Search by store or item within the selected period. Tap a receipt to view its photo and purchased items, edit details or delete it."],
  ["Sync across devices", "Receipts are private to your account. Open Receipts, return to the app or tap refresh to load changes from your other devices. Receipts are not shared with family members."],
  ["View notifications", "Tap the bell in the top navigation bar to view notifications. The dot shows when you have unread alerts. Go back to return to Receipts."],
] as const;

export function ReceiptsHelpButton() {
  return <NativeHelpButton title="Receipts help">
    {TIPS.map(([title, body]) => <View key={title} style={{ gap: 5 }}>
      <Text accessibilityRole="header" style={st.shoppingSectionTitle}>{title}</Text>
      <Text style={st.shoppingBodyText}>{body}</Text>
    </View>)}
  </NativeHelpButton>;
}
