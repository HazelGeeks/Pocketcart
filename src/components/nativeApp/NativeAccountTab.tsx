import React from "react";
import { Linking, Text, View } from "react-native";
import type useNativeAccount from "../../hooks/useNativeAccount";
import type useNativeOnboarding from "../../hooks/useNativeOnboarding";
import type useNativePermissions from "../../hooks/useNativePermissions";
import { st } from "../../screens/nativeAppStyles";
import { AccountAuthPanel } from "./AccountAuthPanel";
import {
  EditProfilePanel,
  EmailVerificationPanel,
  ResetPasswordPanel,
} from "./AccountFlowPanels";
import { MorePanel } from "./MorePanel";
import { PersonalizationPanel } from "./PersonalizationPanel";

type Props = {
  account: ReturnType<typeof useNativeAccount>;
  onboarding: ReturnType<typeof useNativeOnboarding>;
  permissions: ReturnType<typeof useNativePermissions>;
  storeOptions: string[];
};

export function NativeAccountTab({
  account,
  onboarding,
  permissions,
  storeOptions,
}: Props) {
  if (account.accountRoute === "settings") {
    return (
      <MorePanel
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
        onSendTestAlert={() => {
          void permissions.sendTestAlert();
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

  if (account.accountRoute === "auth") {
    return (
      <AccountAuthPanel
        mode={account.authMode}
        loading={account.moreLoading}
        socialLoading={account.socialAuthLoading}
        message={account.moreMessage}
        signInEmail={account.signInEmail}
        signInPassword={account.signInPassword}
        signUpName={account.signUpName}
        signUpEmail={account.signUpEmail}
        signUpPassword={account.signUpPassword}
        onChangeMode={(mode) => {
          account.setAuthMode(mode);
          account.setMoreMessage(null);
        }}
        onSignIn={account.signIn}
        onSignUp={account.signUp}
        onSignInWithApple={() => {
          void account.signInWithProvider("apple");
        }}
        onSignInWithGoogle={() => {
          void account.signInWithProvider("google");
        }}
        onForgotPassword={(email) => {
          void account.requestReset(email);
        }}
        onChangeSignInEmail={account.setSignInEmail}
        onChangeSignInPassword={account.setSignInPassword}
        onChangeSignUpName={account.setSignUpName}
        onChangeSignUpEmail={account.setSignUpEmail}
        onChangeSignUpPassword={account.setSignUpPassword}
      />
    );
  }

  if (account.accountRoute === "verify") {
    return (
      <EmailVerificationPanel
        email={account.signUpEmail}
        onContinue={() => account.setAccountRoute("personalize")}
        onLater={() => account.setAccountRoute("settings")}
      />
    );
  }

  if (account.accountRoute === "personalize") {
    if (!account.profilePreferencesLoaded) {
      return (
        <View style={st.authCard}>
          <Text style={st.authDescription}>Loading your shopping profile...</Text>
        </View>
      );
    }
    return (
      <PersonalizationPanel
        initialPreferences={account.profilePreferences}
        storeOptions={storeOptions}
        saving={account.preferencesSaving}
        onSave={(next) => {
          void account.savePersonalization(next);
        }}
        onDraftChange={account.updatePersonalizationDraft}
        onSkip={account.skipPersonalization}
      />
    );
  }

  if (account.accountRoute === "editProfile" && account.profile) {
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

  if (account.accountRoute === "resetPassword") {
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
