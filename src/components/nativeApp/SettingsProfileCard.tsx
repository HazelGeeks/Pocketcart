import type useBilling from "../../hooks/useBilling";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import type { UserProfile } from "../../services/userProfile";
import { marketingPalette as C } from "../../shared/design/palette";
import { st } from "../../screens/nativeAppStyles";
import { F } from "../../screens/nativeAppStyles/fonts";

type Props = {
  billing: ReturnType<typeof useBilling>;
  onOpenSubscription: () => void;
  profile: UserProfile | null;
};

export function SettingsProfileCard({ profile, billing, onOpenSubscription }: Props) {
  if (!profile) return null;
  const label = billing.loading ? "Checking plan…" : billing.planStatus === "plus" ? "Plus plan"
    : billing.planStatus === "general" ? "Free plan" : "View plan";
  return <View style={st.settingsProfileCard}>
    <View style={st.settingsAvatar} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={30} height={30} viewBox="0 0 24 24" fill="none">
        <Circle cx={12} cy={7.5} r={3.5} stroke={C.primaryDeep} strokeWidth={1.8} />
        <Path d="M5 21v-2a7 7 0 0 1 14 0v2" stroke={C.primaryDeep} strokeWidth={1.8} strokeLinecap="round" />
      </Svg>
    </View>
    <View style={styles.identity}>
      <Text accessibilityRole="header" style={st.settingsProfileTitle}>{profile.full_name?.trim() || "PocketCart member"}</Text>
      <Text style={st.settingsProfileSubtitle}>{profile.email || "Signed in"}</Text>
    </View>
    <Pressable accessibilityRole="button" accessibilityLabel={`Account plan: ${label}. View subscription details`} onPress={onOpenSubscription}
      style={({ pressed }) => [styles.badge, billing.planStatus === "plus" && styles.plusBadge, pressed && { opacity: 0.75 }]}>
      <Text style={[styles.badgeText, billing.planStatus === "plus" && styles.plusText]}>{label}</Text>
    </Pressable>
  </View>;
}

const styles = StyleSheet.create({
  identity: { gap: 4, width: "100%" },
  badge: { minHeight: 44, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 22, backgroundColor: C.primaryGhost, justifyContent: "center", alignItems: "center" },
  plusBadge: { backgroundColor: C.primaryDeep },
  badgeText: { color: C.primaryDeep, fontFamily: F.bold, fontSize: 13 },
  plusText: { color: C.white },
});
