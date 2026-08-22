import type React from "react";
import { Linking, Pressable, Switch, Text, View } from "react-native";
import type { UserProfile } from "../../services/userProfile";
import {
  SHOPPING_FREQUENCY_LABELS,
  type ProfilePreferences,
} from "../../services/profilePreferences";
import { marketingPalette as C } from "../../shared/design/palette";
import { st } from "../../screens/nativeAppStyles";
import { AppIcon } from "../icons/AppIcon";
import { SettingsLocationCard } from "./SettingsLocationCard";
import { SettingsProfileCard } from "./SettingsProfileCard";

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
  onOpenMyFreezer: () => void;
  onEditProfile: () => void;
  onSignOut: () => void;
  onStartDeleteAccount: () => void;
  onCancelDeleteAccount: () => void;
  onConfirmDeleteAccount: () => void;
};

export function MorePanel(props: MorePanelProps) {
  return (
    <View style={st.settingsPage}>
      <SettingsProfileCard {...props} />

      {props.message ? (
        <View style={st.settingsMessage} accessibilityRole="alert">
          <Text style={st.settingsMessageText}>{props.message}</Text>
        </View>
      ) : null}

      <ShoppingProfileSection {...props} />
      <MyKitchenSection {...props} />
      <PreferencesSection {...props} />
      <SupportSection />
      <AccountSection {...props} />
    </View>
  );
}

function MyKitchenSection({ profile, onOpenMyFreezer, onOpenSignIn }: MorePanelProps) {
  return (
    <SettingsSection label="My Kitchen">
      <SettingsLinkRow
        label="My Freezer"
        value={profile ? "Open" : "Sign in required"}
        onPress={profile ? onOpenMyFreezer : onOpenSignIn}
      />
    </SettingsSection>
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
      <SettingsLocationCard
        locationLabel={locationLabel}
        settingsPostalCode={settingsPostalCode}
        loading={loading}
        onChangeSettingsPostalCode={onChangeSettingsPostalCode}
        onShareLocation={onShareLocation}
        onSetPostalLocation={onSetPostalLocation}
      />

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
        <AppIcon
          name="chevron-right"
          color={destructive ? "#A83939" : C.textMuted}
          size={20}
          strokeWidth={2.1}
        />
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
            This permanently deletes your profile, shopping preferences, My Freezer inventory, and saved price alert subscriptions.
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
      <View>
        <PreferenceSummary label="Interested in" value={interestText} />
        <PreferenceSummary label="Shopping frequency" value={frequencyText} />
        <PreferenceSummary label="Favorite stores" value={storeText} />
      </View>
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

function openExternalUrl(url: string) {
  void Linking.openURL(url);
}
