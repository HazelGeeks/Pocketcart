import { Pressable, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import type { UserProfile } from "../../services/userProfile";
import { hasSupabaseEnv } from "../../services/supabaseClient";
import { marketingPalette as C } from "../../shared/design/palette";
import { st } from "../../screens/nativeAppStyles";

type Props = {
  profile: UserProfile | null;
  loading: boolean;
  onOpenSignIn: () => void;
  onOpenSignUp: () => void;
  onEditProfile: () => void;
  onSignOut: () => void;
};

export function SettingsProfileCard({
  profile,
  loading,
  onOpenSignIn,
  onOpenSignUp,
  onEditProfile,
  onSignOut,
}: Props) {
  if (!hasSupabaseEnv) {
    return (
      <View style={st.settingsProfileCard}>
        <ProfileIdentity title="Account unavailable" subtitle="Account services are not configured." />
      </View>
    );
  }

  if (profile) {
    return (
      <View style={st.settingsProfileCard}>
        <ProfileIdentity
          title={profile.full_name?.trim() || "PocketCart member"}
          subtitle={profile.email || "Signed in"}
        />
        <View style={st.settingsButtonRow}>
          <Pressable accessibilityRole="button" onPress={onEditProfile} style={[st.settingsButton, st.settingsButtonPrimary]} disabled={loading}>
            <Text style={st.settingsButtonPrimaryText}>Edit Profile</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onSignOut} style={[st.settingsButton, st.settingsButtonSecondary]} disabled={loading}>
            <Text style={st.settingsButtonSecondaryText}>{loading ? "Please wait..." : "Sign Out"}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={st.settingsProfileCard}>
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
        <Text style={st.settingsProfileTitle} numberOfLines={1}>{title}</Text>
        <Text style={st.settingsProfileSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}
