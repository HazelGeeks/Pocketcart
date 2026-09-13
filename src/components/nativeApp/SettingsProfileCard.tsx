import type useBilling from "../../hooks/useBilling";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import type { UserProfile } from "../../services/userProfile";
import { hasSupabaseEnv } from "../../services/supabaseClient";
import { marketingPalette as C } from "../../shared/design/palette";
import { st } from "../../screens/nativeAppStyles";

type Props = {
  billing: ReturnType<typeof useBilling>;
  onOpenSubscription: () => void;
  profile: UserProfile | null;
  onOpenSignIn: () => void;
  onOpenSignUp: () => void;
};

export function SettingsProfileCard({
  profile,
  billing,
  onOpenSubscription,
  onOpenSignIn,
  onOpenSignUp,
}: Props) {
  if (!hasSupabaseEnv) {
    return (
      <View style={[st.settingsProfileCard, { padding: 16, backgroundColor: "transparent" }]}>
      <Text accessibilityRole="header" style={st.settingsAccountTitle}>Account</Text>
        <ProfileIdentity title="Account unavailable" subtitle="Account services are not configured." />
      </View>
    );
  }

  if (profile) {
    const label = billing.loading ? "Checking…" : billing.planStatus === "plus" ? "Plus" : billing.planStatus === "general" ? "General" : billing.message ? "Check status" : "Checking…";
    return (
      <View style={[st.settingsProfileCard, { padding: 16, backgroundColor: "transparent" }]}>
        <View style={[styles.heading, { alignItems: "center" }]}>
          <View style={{ flex: 1 }}><ProfileIdentity title={profile.full_name?.trim() || "PocketCart member"} subtitle={profile.email || "Signed in"} /></View>
          <Pressable accessibilityRole="button" accessibilityLabel={`Account plan: ${label}. View subscription details`} onPress={onOpenSubscription}
            style={[styles.badge, billing.planStatus === "plus" && styles.plusBadge]}>
            <Text style={[styles.badgeText, billing.planStatus === "plus" && styles.plusText]}>{label}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[st.settingsProfileCard, { padding: 16, backgroundColor: "transparent" }]}>
      <Text accessibilityRole="header" style={st.settingsAccountTitle}>Account</Text>
      <ProfileIdentity
        title="Your PocketCart account"
        subtitle="Sign in to sync your shopping profile, My Freezer, and price alerts."
      />
      <View style={st.settingsButtonRow}>
        <Pressable accessibilityRole="button" onPress={onOpenSignIn} style={[st.settingsButton, st.settingsButtonPrimary]}>
          <Text style={st.settingsButtonPrimaryText}>Sign In</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onOpenSignUp} style={[st.settingsButton, st.settingsButtonSecondary]}>
          <Text style={st.settingsButtonSecondaryText}>Create Account</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ProfileIdentity({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={st.settingsProfileIdentity}>
      <View style={st.settingsAvatar} accessibilityElementsHidden>
        <Svg width={23} height={23} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={8} r={3.5} stroke={C.primaryDeep} strokeWidth={2} />
          <Path
            d="M5.5 19c.7-4 3-6 6.5-6s5.8 2 6.5 6"
            stroke={C.primaryDeep}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </Svg>
      </View>
      <View style={st.settingsProfileCopy}>
        <Text style={st.settingsProfileTitle}>{title}</Text>
        <Text style={st.settingsProfileSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 12 },
  badge: { minHeight: 44, paddingHorizontal: 14, borderRadius: 22, backgroundColor: C.white, justifyContent: "center", alignItems: "center" },
  plusBadge: { backgroundColor: C.primaryDeep },
  badgeText: { color: C.primaryDeep, fontFamily: "Nunito_800ExtraBold", fontSize: 14 },
  plusText: { color: C.white },
});
