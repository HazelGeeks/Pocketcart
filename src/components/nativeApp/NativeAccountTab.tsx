import { Linking, Text, View } from "react-native";
import type useNativeAccount from "../../hooks/useNativeAccount";
import type useNativeOnboarding from "../../hooks/useNativeOnboarding";
import type useNativePermissions from "../../hooks/useNativePermissions";
import { st } from "../../screens/nativeAppStyles";
import { GuestAccountPanel } from "./GuestAccountPanel";
import {
  EditProfilePanel,
  EmailVerificationPanel,
  ResetPasswordPanel,
} from "./AccountFlowPanels";
import { SubscriptionPanel } from "./SubscriptionPanel";
import { MorePanel } from "./MorePanel";
import { MyFreezerPanel } from "./MyFreezerPanel";
import { PersonalizationPanel } from "./PersonalizationPanel";

type Props = {
  account: ReturnType<typeof useNativeAccount>;
  onboarding: ReturnType<typeof useNativeOnboarding>;
  permissions: ReturnType<typeof useNativePermissions>;
  storeOptions: string[];
  onOpenMap: () => void;
  onOpenScan: () => void;
};

export function NativeAccountTab({
  account,
  onboarding,
  permissions,
  storeOptions,
  onOpenMap,
  onOpenScan,
}: Props) {
  const route = account.displayRoute;
  if (route === "settings" && !account.profile) {
    return <GuestAccountPanel onSignIn={account.openSignIn} onSignUp={account.openSignUp}
      message={account.accountRoute === "auth" ? null : account.moreMessage} />;
  }
  if (route === "subscription") return <SubscriptionPanel billing={account.billing} signedIn={Boolean(account.profile)} onSignIn={account.openSignIn} />;
  if (route === "settings" || route === "guestSettings") {
    return (
      <MorePanel
        billing={account.billing}
        onOpenSubscription={() => account.setAccountRoute("subscription")}
        profile={account.profile}
        loading={account.moreLoading}
        message={account.moreMessage}
        locationLabel={permissions.locationSettingsLabel}
        alertsEnabled={onboarding.state.alertsEnabled}
        settingsPostalCode={onboarding.postalCode}
        onChangeSettingsPostalCode={onboarding.setPostalCode}
        onShareLocation={() => {
          void permissions.shareLocation("settings");
        }}
        onSetPostalLocation={() => {
          void permissions.usePostalLocation("settings");
        }}
        onEnableAlerts={() => {
          void permissions.enableAlerts("settings");
        }}
        onDisableAlerts={() => {
          void permissions.disableAlerts();
        }}
        onOpenAppSettings={() => {
          void Linking.openSettings();
        }}
        preferences={account.profilePreferences}
        deleteConfirming={account.deleteConfirming}
        deletingAccount={account.deletingAccount}
        onOpenSignIn={account.openSignIn}
        onOpenSignUp={account.openSignUp}
        onEditPreferences={() => account.setAccountRoute("personalize")}
        onOpenMap={onOpenMap}
        onOpenScan={onOpenScan}
        onEditProfile={() => {
          account.setMoreMessage(null);
          account.setAccountRoute("editProfile");
        }}
        onSignOut={account.signOut}
        onStartDeleteAccount={() => account.setDeleteConfirming(true)}
        onCancelDeleteAccount={() => account.setDeleteConfirming(false)}
        onConfirmDeleteAccount={() => {
          void account.deleteAccount();
        }}
      />
    );
  }

  if (route === "freezer" && account.profile) {
    return <MyFreezerPanel userId={account.profile.id} />;
  }

  if (route === "verify") {
    return (
      <EmailVerificationPanel
        email={account.signUpEmail}
        onContinue={() => account.setAccountRoute("personalize")}
        onLater={() => account.setAccountRoute("settings")}
      />
    );
  }

  if (route === "personalize") {
    if (!account.profilePreferencesLoaded) {
      return (
        <View style={st.authCard}>
          <Text style={st.authDescription}>Loading your shopping profile...</Text>
        </View>
      );
    }
    return (
      <PersonalizationPanel editing={!account.pendingEmailVerification}
        initialPreferences={account.profilePreferences}
        storeOptions={storeOptions}
        saving={account.preferencesSaving}
        onSave={(next) => {
          void account.savePersonalization(next);
        }}
        onDraftChange={account.updatePersonalizationDraft}
        onSkip={account.pendingEmailVerification ? account.skipPersonalization : () => account.setAccountRoute("settings")}
      />
    );
  }

  if (route === "editProfile" && account.profile) {
    return (
      <EditProfilePanel
        profile={account.profile}
        loading={account.moreLoading}
        message={account.moreMessage}
        onSave={(name, email) => {
          void account.updateProfile(name, email);
        }}
      />
    );
  }

  if (route === "resetPassword") {
    return (
      <ResetPasswordPanel
        loading={account.moreLoading}
        message={account.moreMessage}
        onSave={(password) => {
          void account.savePassword(password);
        }}
      />
    );
  }

  return null;
}
