import type { ShoppingListItem } from "../../utils/shoppingListState";
import { Pressable, Text, View } from "react-native";
import { st } from "../../screens/nativeAppStyles";
import { MyFreezerPanel } from "./MyFreezerPanel";

export function NativeFreezerTab({ userId, onSignIn, cartItems }: { userId: string | null; onSignIn: () => void; cartItems: ShoppingListItem[] }) {
  if (userId) return <MyFreezerPanel userId={userId} cartItems={cartItems} />;

  return (
    <View style={st.authCard}>
      <Text style={st.authTitle}>Keep track of your food</Text>
      <Text style={st.authDescription}>Sign in to save food in My Freezer and receive expiry reminders.</Text>
      <Pressable accessibilityRole="button" onPress={onSignIn} style={[st.settingsButton, st.settingsButtonPrimary, { flex: 0 }]}>
        <Text style={st.settingsButtonPrimaryText}>Sign in</Text>
      </Pressable>
    </View>
  );
}
