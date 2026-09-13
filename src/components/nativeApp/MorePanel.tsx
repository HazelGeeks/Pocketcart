import { Linking, Pressable, Switch, Text, View } from "react-native";
import type useBilling from "../../hooks/useBilling";
import type { UserProfile } from "../../services/userProfile";
import type { ProfilePreferences } from "../../services/profilePreferences";
import { marketingPalette as C } from "../../shared/design/palette";
import { st } from "../../screens/nativeAppStyles";
import { SettingsLinkRow, SettingsSection } from "./SettingsMenu";
import { SettingsLocationCard } from "./SettingsLocationCard";
import { FamilyPanel } from "./FamilyPanel";
import { SettingsProfileCard } from "./SettingsProfileCard";

const PRIVACY_URL = "https://pocketcart.hazelgeeks.workers.dev/privacy";
const TERMS_URL = "https://pocketcart.hazelgeeks.workers.dev/terms";
const SUPPORT_URL = "https://pocketcart.hazelgeeks.workers.dev/support";

type MorePanelProps = {
  billing: ReturnType<typeof useBilling>;
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
  onOpenSubscription: () => void;
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

      <MyAccountSection {...props} />
      <FamilyPanel onSignIn={props.onOpenSignIn} onSignUp={props.onOpenSignUp} />
      <PreferencesSection {...props} />
      <SupportSection />
      <AccountSection {...props} />
      {props.profile ? (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: props.loading || props.deletingAccount }}
          disabled={props.loading || props.deletingAccount}
          onPress={props.onSignOut}
          style={({ pressed }) => [st.settingsLogout, pressed && st.settingsRowPressed]}
        >
          <Text style={st.settingsLogoutText}>{props.loading ? "Please wait…" : "Log Out"}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function MyAccountSection(props: MorePanelProps) {
  return (
    <SettingsSection label="My account">
      {props.profile ? (
        <>
          <SettingsLinkRow label="Personal information" value="Name & email" icon="edit" onPress={props.onEditProfile} disabled={props.loading} />
          <View style={st.settingsDivider} />
        </>
      ) : null}
      <SettingsLinkRow label="Shopping profile" value={props.preferences.completed ? "Your interests and favorite stores" : "Personalize your deals"} icon="filter" onPress={props.onEditPreferences} />
      <View style={st.settingsDivider} />
      <SettingsLinkRow label="Pocketcart Plus" value="Subscription & purchases" icon="sparkles" onPress={props.onOpenSubscription} />
      <View style={st.settingsDivider} />
      <SettingsLinkRow label="My Freezer" value={props.profile ? "Manage your saved food" : "Sign in to save your food"} icon="freezer" onPress={props.profile ? props.onOpenMyFreezer : props.onOpenSignIn} />
    </SettingsSection>
  );
}

function PreferencesSection({
  message,
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
      <SettingsLocationCard message={message}
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
    <>
      <SettingsSection label="Support">
        <SettingsLinkRow label="Help & Support" value="Questions, issues, and feedback" onPress={() => openExternalUrl(SUPPORT_URL)} />
      </SettingsSection>
      <SettingsSection label="Our policies">
        <SettingsLinkRow label="Terms of Service" onPress={() => openExternalUrl(TERMS_URL)} />
        <View style={st.settingsDivider} />
        <SettingsLinkRow label="Privacy Policy" onPress={() => openExternalUrl(PRIVACY_URL)} />
      </SettingsSection>
    </>
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
    <SettingsSection label="Account actions">
      {deleteConfirming ? (
        <View style={st.settingsDangerBlock}>
          <Text style={st.settingsRowTitle}>Delete your account?</Text>
          <Text style={st.settingsHelp}>
            This permanently deletes your profile, shopping preferences, My Freezer inventory, and saved price alert subscriptions. Shared family items remain with the family if other members are still present.
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

function openExternalUrl(url: string) {
  void Linking.openURL(url);
}
