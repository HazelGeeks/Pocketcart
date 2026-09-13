import React from "react";
import { ActivityIndicator, Linking, Pressable, Text, View } from "react-native";
import type useBilling from "../../hooks/useBilling";
import { st } from "../../screens/nativeAppStyles";
import { marketingPalette as C } from "../../shared/design/palette";

type Props = { billing: ReturnType<typeof useBilling>; signedIn: boolean; onSignIn: () => void };
export function SubscriptionPanel({ billing, signedIn, onSignIn }: Props) {
  const [selected, setSelected] = React.useState<string | null>(null);
  const selectedPackage = billing.packages.find(item => item.identifier === selected) ?? billing.packages[0];
  const unavailable = !billing.configured || !billing.purchasesEnabled || !billing.packages.length;
  const disabled = billing.busy || billing.loading;
  return <View style={st.shoppingPage}>
    <View style={st.shoppingRecommendationCard}>
      <Text style={st.shoppingBodyText}>General: sale alerts for 5 products. Plus: unlimited product alerts.</Text>
      <Text style={st.shoppingFootnote}>My Freezer and expiry reminders are included, with unlimited food storage.</Text>
      <Text style={st.shoppingBodyText}>{billing.isPlus ? "Your subscription is active." : billing.storeActive
        ? "Purchase found. Subscription verification is pending." : unavailable ? "Subscriptions are coming soon." : "Choose a subscription plan."}</Text>
      {billing.expirationDate ? <Text style={st.shoppingFootnote}>{billing.willRenew ? "Renews" : "Access until"} {new Date(billing.expirationDate).toLocaleDateString()}</Text> : null}
    </View>
    {billing.loading ? <ActivityIndicator accessibilityLabel="Loading subscription" color={C.primaryDeep} /> : null}
    {billing.message ? <Text accessibilityRole="alert" style={st.shoppingWarningText}>{billing.message}</Text> : null}
    {!signedIn ? <Pressable accessibilityRole="button" onPress={onSignIn} style={st.shoppingEmptyAction}>
      <Text style={st.shoppingEmptyActionText}>Sign in</Text>
    </Pressable> : null}
    {signedIn && !billing.storeActive && !billing.isPlus && !unavailable ? <>
      {billing.packages.map(item => <Pressable key={item.identifier} accessibilityRole="radio"
        accessibilityState={{ checked: selectedPackage?.identifier === item.identifier, disabled }} disabled={disabled}
        onPress={() => setSelected(item.identifier)} style={[st.shoppingClearBtn, { alignItems: "stretch", padding: 16 }]}>
        <Text style={st.shoppingSectionTitle}>{item.product.title}</Text>
        <Text style={st.shoppingBodyText}>{item.product.description}</Text>
        <Text style={st.shoppingItemTotal}>{item.product.priceString} / {periodLabel(item.product.subscriptionPeriod)}</Text>
        {selectedPackage?.identifier === item.identifier ? <Text style={st.shoppingRefreshText}>Selected</Text> : null}
      </Pressable>)}
      <Pressable accessibilityRole="button" disabled={disabled || !selectedPackage}
        accessibilityLabel="Continue to the store subscription confirmation"
        onPress={() => selectedPackage && void billing.purchase(selectedPackage.identifier)} style={st.shoppingEmptyAction}>
        <Text style={st.shoppingEmptyActionText}>{billing.busy ? "Please wait…" : "Continue"}</Text>
      </Pressable>
      <Text style={st.shoppingFootnote}>Payment is charged to your store account after confirmation. The subscription renews automatically unless canceled in store settings. The store confirmation shows the final price and any applicable offer.</Text>
    </> : null}
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
        onPress={() => void Linking.openURL(`https://pocketcart.hazelgeeks.workers.dev/${path}`)} style={st.shoppingAddButton}>
        <Text style={st.shoppingFootnote}>{label}</Text>
      </Pressable>)}
    </View>
  </View>;
}
function periodLabel(period: string | null) {
  const match = /^P(\d+)([DWMY])$/.exec(period ?? "");
  if (!match) return period ?? "billing period";
  const unit = ({ D: "day", W: "week", M: "month", Y: "year" } as Record<string, string>)[match[2]];
  return Number(match[1]) === 1 ? unit : `${match[1]} ${unit}s`;
}
