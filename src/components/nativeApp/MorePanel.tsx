import React from "react";
import { Linking, Pressable, Switch, Text, TextInput, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import type { UserProfile } from "../../services/userProfile";
import { hasSupabaseEnv } from "../../services/supabaseClient";
import {
  SHOPPING_FREQUENCY_LABELS,
  type ProfilePreferences,
} from "../../services/profilePreferences";
import { marketingPalette as C } from "../../shared/design/palette";
import { st } from "../../screens/nativeAppStyles";

const PRIVACY_URL = "https://pocketcart.pages.dev/privacy";
const TERMS_URL = "https://pocketcart.pages.dev/terms";
const SUPPORT_URL = "https://pocketcart.pages.dev/support";

type MorePanelProps = {
  profile: UserProfile | null;
  loading: boolean;
  message: string | null;
  locationLabel: string;
  alertsEnabled: boolean;
  settingsPostalCode: string;
  onChangeSettingsPostalCode: (value: string) => void;
  onShareLocation: () => void;
  onSetPostalLocation: () => void;
  onEnableAlerts: () => void;
  onDisableAlerts: () => void;
  onSendTestAlert: () => void;
  onOpenAppSettings: () => void;
  preferences: ProfilePreferences;
  deleteConfirming: boolean;
  deletingAccount: boolean;
  onOpenSignIn: () => void;
  onOpenSignUp: () => void;
  onEditPreferences: () => void;
  onEditProfile: () => void;
  onSignOut: () => void;
  onStartDeleteAccount: () => void;
  onCancelDeleteAccount: () => void;
  onConfirmDeleteAccount: () => void;
};

export function MorePanel(props: MorePanelProps) {
  return (
    <View style={st.settingsPage}>
      <ProfileCard {...props} />

      {props.message ? (
        <View style={st.settingsMessage} accessibilityRole="alert">
          <Text style={st.settingsMessageText}>{props.message}</Text>
        </View>
      ) : null}

      <ShoppingProfileSection {...props} />
      <PreferencesSection {...props} />
      <SupportSection />
      <AccountSection {...props} />
    </View>
  );
}

function SettingsSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={st.settingsSection}>
      <Text style={st.settingsSectionLabel}>{label}</Text>
      <View style={st.settingsGroup}>{children}</View>
    </View>
  );
}

function PreferencesSection({
  locationLabel,
  alertsEnabled,
  settingsPostalCode,
  loading,
  onChangeSettingsPostalCode,
  onShareLocation,
  onSetPostalLocation,
  onEnableAlerts,
  onDisableAlerts,
  onSendTestAlert,
  onOpenAppSettings,
  profile,
}: MorePanelProps) {
  return (
    <SettingsSection label="Preferences">
      <View style={st.settingsBlock}>
        <View style={st.settingsKeyRow}>
          <Text style={st.settingsRowTitle}>Location</Text>
          <Text style={st.settingsRowValue} numberOfLines={1}>{locationLabel}</Text>
        </View>
        <Text style={st.settingsHelp}>Use your location or save a postal code to find nearby stores.</Text>
        <TextInput
          accessibilityLabel="Postal code"
          value={settingsPostalCode}
          onChangeText={onChangeSettingsPostalCode}
          placeholder="Postal code"
          placeholderTextColor={C.textMuted}
          autoCapitalize="characters"
          autoCorrect={false}
          style={st.settingsInput}
        />
        <View style={st.settingsButtonRow}>
          <Pressable
            accessibilityRole="button"
            onPress={onShareLocation}
            style={[st.settingsButton, st.settingsButtonSecondary]}
            disabled={loading}
          >
            <Text style={st.settingsButtonSecondaryText}>Use Current Location</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onSetPostalLocation}
            style={[st.settingsButton, st.settingsButtonPrimary]}
            disabled={loading}
          >
            <Text style={st.settingsButtonPrimaryText}>Save Postal Code</Text>
          </Pressable>
        </View>
      </View>

      <View style={st.settingsDivider} />

      <View style={st.settingsToggleRow}>
        <View style={st.settingsRowCopy}>
          <Text style={st.settingsRowTitle}>Price notifications</Text>
          <Text style={st.settingsHelp}>Receive alerts when watched products go on sale.</Text>
        </View>
        <Switch
          accessibilityLabel="Price notifications"
          value={alertsEnabled}
          onValueChange={(enabled) => {
            if (enabled) onEnableAlerts();
            else onDisableAlerts();
          }}
          disabled={loading}
          trackColor={{ false: "#D7E2DA", true: C.primaryLight }}
          thumbColor={alertsEnabled ? C.primaryDeep : C.white}
          ios_backgroundColor="#D7E2DA"
        />
      </View>

      <View style={st.settingsDivider} />

      {profile && alertsEnabled ? (
        <>
          <SettingsLinkRow
            label="Send test notification"
            value={loading ? "Sending…" : "Device check"}
            disabled={loading}
            onPress={onSendTestAlert}
          />
          <View style={st.settingsDivider} />
        </>
      ) : null}

      <SettingsLinkRow label="Open App Settings" value="Permissions" onPress={onOpenAppSettings} />
    </SettingsSection>
  );
}

function SupportSection() {
  return (
    <SettingsSection label="Support">
      <SettingsLinkRow label="Help & Support" onPress={() => openExternalUrl(SUPPORT_URL)} />
      <View style={st.settingsDivider} />
      <SettingsLinkRow label="Privacy Policy" onPress={() => openExternalUrl(PRIVACY_URL)} />
      <View style={st.settingsDivider} />
      <SettingsLinkRow label="Terms of Service" onPress={() => openExternalUrl(TERMS_URL)} />
    </SettingsSection>
  );
}

function SettingsLinkRow({
  label,
  value,
  destructive = false,
  disabled = false,
  onPress,
}: {
  label: string;
  value?: string;
  destructive?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        st.settingsLinkRow,
        pressed && st.settingsRowPressed,
        disabled && { opacity: 0.5 },
      ]}
    >
      <Text style={[st.settingsRowTitle, destructive && st.settingsDangerText]}>{label}</Text>
      <View style={st.settingsLinkMeta}>
        {value ? <Text style={st.settingsRowValue}>{value}</Text> : null}
        <Text style={[st.settingsChevron, destructive && st.settingsDangerText]}>›</Text>
      </View>
    </Pressable>
  );
}

function AccountSection({
  profile,
  deleteConfirming,
  deletingAccount,
  onStartDeleteAccount,
  onCancelDeleteAccount,
  onConfirmDeleteAccount,
}: MorePanelProps) {
  if (!profile) return null;

  return (
    <SettingsSection label="Account">
      {deleteConfirming ? (
        <View style={st.settingsDangerBlock}>
          <Text style={st.settingsRowTitle}>Delete your account?</Text>
          <Text style={st.settingsHelp}>
            This permanently deletes your profile, shopping preferences, and saved price alert subscriptions.
          </Text>
          <View style={st.settingsButtonRow}>
            <Pressable
              accessibilityRole="button"
              onPress={onCancelDeleteAccount}
              style={[st.settingsButton, st.settingsButtonSecondary]}
              disabled={deletingAccount}
            >
              <Text style={st.settingsButtonSecondaryText}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onConfirmDeleteAccount}
              style={[st.settingsButton, st.settingsButtonDanger]}
              disabled={deletingAccount}
            >
              <Text style={st.settingsButtonPrimaryText}>
                {deletingAccount ? "Deleting…" : "Delete Account"}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <SettingsLinkRow label="Delete Account" destructive onPress={onStartDeleteAccount} />
      )}
    </SettingsSection>
  );
}

function ShoppingProfileSection({ profile, preferences, onEditPreferences }: MorePanelProps) {
  if (!profile && !preferences.completed) return null;

  if (!preferences.completed) {
    return (
      <SettingsSection label="Shopping Profile">
        <SettingsLinkRow
          label="Personalize your deals"
          value="Optional"
          onPress={onEditPreferences}
        />
      </SettingsSection>
    );
  }

  const interestText = preferences.interestedCategories.length > 0
    ? preferences.interestedCategories.join(", ")
    : "Not selected";
  const frequencyText = preferences.shoppingFrequency
    ? SHOPPING_FREQUENCY_LABELS[preferences.shoppingFrequency]
    : "Not selected";
  const storeText = preferences.favoriteStores.length > 0
    ? preferences.favoriteStores.join(", ")
    : "Not selected";

  return (
    <SettingsSection label="Shopping Profile">
      <View style={st.settingsSummaryBlock}>
        <PreferenceSummary label="Interested in" value={interestText} />
        <PreferenceSummary label="Shopping frequency" value={frequencyText} />
        <PreferenceSummary label="Favorite stores" value={storeText} />
      </View>
      <View style={st.settingsDivider} />
      <SettingsLinkRow label="Edit Shopping Profile" onPress={onEditPreferences} />
    </SettingsSection>
  );
}

function PreferenceSummary({ label, value }: { label: string; value: string }) {
  return (
    <View style={st.settingsSummaryRow}>
      <Text style={st.settingsHelp}>{label}</Text>
      <Text style={st.settingsSummaryValue}>{value}</Text>
    </View>
  );
}

function ProfileCard({
  profile,
  loading,
  onOpenSignIn,
  onOpenSignUp,
  onEditProfile,
  onSignOut,
}: MorePanelProps) {
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
        subtitle="Sign in to sync your shopping profile and price alerts."
      />
      <View style={st.settingsButtonRow}>
        <Pressable
          accessibilityRole="button"
          onPress={onOpenSignIn}
          style={[st.settingsButton, st.settingsButtonPrimary]}
        >
          <Text style={st.settingsButtonPrimaryText}>Sign In</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onOpenSignUp}
          style={[st.settingsButton, st.settingsButtonSecondary]}
        >
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
        <Svg width={27} height={27} viewBox="0 0 24 24" fill="none">
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

function openExternalUrl(url: string) {
  void Linking.openURL(url);
}
