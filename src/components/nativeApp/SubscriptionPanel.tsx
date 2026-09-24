import { ActivityIndicator, Linking, Pressable, Text, View } from "react-native";
import type useBilling from "../../hooks/useBilling";
import { st } from "../../screens/nativeAppStyles";
import { marketingPalette as C } from "../../shared/design/palette";

type Props = { billing: ReturnType<typeof useBilling>; signedIn: boolean; onSignIn: () => void };
export function SubscriptionPanel({ billing, signedIn, onSignIn }: Props) {
  const disabled = billing.busy || billing.loading;
  return <View style={st.shoppingPage}>
    <View style={st.shoppingRecommendationCard}>
      <Text style={st.shoppingBodyText}>Product alerts are free for everyone. No subscription is required.</Text>
      <Text style={st.shoppingFootnote}>My Freezer and expiry reminders are included, with unlimited food storage.</Text>
      <Text style={st.shoppingBodyText}>{billing.isPlus ? "Your subscription is active." : billing.storeActive
        ? "Purchase found. Subscription verification is pending." : "No active subscription."}</Text>
      {billing.expirationDate ? <Text style={st.shoppingFootnote}>{billing.willRenew ? "Renews" : "Access until"} {new Date(billing.expirationDate).toLocaleDateString()}</Text> : null}
    </View>
    {billing.loading ? <ActivityIndicator accessibilityLabel="Loading subscription" color={C.primaryDeep} /> : null}
    {billing.message ? <Text accessibilityRole="alert" style={st.shoppingWarningText}>{billing.message}</Text> : null}
    {!signedIn ? <Pressable accessibilityRole="button" onPress={onSignIn} style={st.shoppingEmptyAction}>
      <Text style={st.shoppingEmptyActionText}>Sign in</Text>
    </Pressable> : null}
    {signedIn ? <>
      <Pressable accessibilityRole="button" disabled={disabled || !billing.configured} onPress={() => void billing.restore()} style={[st.shoppingCompareToggle, (disabled || !billing.configured) && { opacity: 0.4 }]}>
        <Text style={st.shoppingRefreshText}>Restore purchases</Text>
      </Pressable>
      <Pressable accessibilityRole="button" disabled={disabled || !billing.configured} onPress={() => void billing.manage()} style={[st.shoppingCompareToggle, (disabled || !billing.configured) && { opacity: 0.4 }]}>
        <Text style={st.shoppingRefreshText}>Manage subscription</Text>
      </Pressable>
      <Pressable accessibilityRole="button" disabled={disabled} onPress={() => void billing.refresh()} style={st.shoppingCompareToggle}>
        <Text style={st.shoppingRefreshText}>Refresh status</Text>
      </Pressable>
    </> : null}
    <View style={{ flexDirection: "row", gap: 20 }}>
      {([['Terms', 'terms'], ['Privacy', 'privacy']] as const).map(([label, path]) => <Pressable key={path} accessibilityRole="link"
        onPress={() => void Linking.openURL(`https://pocketcart.app/${path}`)} style={st.shoppingAddButton}>
        <Text style={st.shoppingFootnote}>{label}</Text>
      </Pressable>)}
    </View>
  </View>;
}
