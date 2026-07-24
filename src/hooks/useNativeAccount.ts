import React from "react";
import type { NativeTabId } from "../screens/nativeAppData";
import type { ProfilePreferences } from "../services/profilePreferences";
import { hasSupabaseEnv } from "../services/supabaseClient";
import {
  getCurrentUserProfile,
  type UserProfile,
} from "../services/userProfile";
import type {
  NativeAccountRoute,
  NativeAuthMode,
} from "./nativeAccountTypes";
import useNativeAccountLinks from "./useNativeAccountLinks";
import useNativeAuthActions from "./useNativeAuthActions";
import useNativeProfileActions from "./useNativeProfileActions";
import useProfilePreferences from "./useProfilePreferences";

export type { NativeAccountRoute, NativeAuthMode } from "./nativeAccountTypes";

type Options = {
  activeTab: NativeTabId;
  clearWatchlist: () => void;
  loadWatchlist: (keepMessage?: boolean) => Promise<void>;
  onOpenMore: () => void;
  showToast: (message: string) => void;
};

export default function useNativeAccount(options: Options) {
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [accountRoute, setAccountRoute] = React.useState<NativeAccountRoute>("settings");
  const [moreLoading, setMoreLoading] = React.useState(false);
  const [moreMessage, setMoreMessage] = React.useState<string | null>(null);
  const [authMode, setAuthMode] = React.useState<NativeAuthMode>("signIn");
  const [socialAuthLoading, setSocialAuthLoading] = React.useState<
    "apple" | "google" | null
  >(null);
  const [signInEmail, setSignInEmail] = React.useState("");
  const [signInPassword, setSignInPassword] = React.useState("");
  const [signUpName, setSignUpName] = React.useState("");
  const [signUpEmail, setSignUpEmail] = React.useState("");
  const [signUpPassword, setSignUpPassword] = React.useState("");
  const [deleteConfirming, setDeleteConfirming] = React.useState(false);
  const [deletingAccount, setDeletingAccount] = React.useState(false);
  const [preferencesSaving, setPreferencesSaving] = React.useState(false);
  const [pendingEmailVerification, setPendingEmailVerification] = React.useState(false);

  const preferences = useProfilePreferences(
    profile?.id ?? null,
    profile?.email ?? (pendingEmailVerification ? signUpEmail : null),
  );

  const loadProfile = React.useCallback(async (keepMessage = false) => {
    if (!hasSupabaseEnv) {
      setProfile(null);
      return;
    }
    setMoreLoading(true);
    const { data, error } = await getCurrentUserProfile();
    setProfile(data);
    setMoreLoading(false);
    if (error) setMoreMessage(error);
    else if (!keepMessage) setMoreMessage(null);
  }, []);

  React.useEffect(() => {
    if (options.activeTab === "more") void loadProfile();
  }, [loadProfile, options.activeTab]);

  useNativeAccountLinks({
    loadWatchlist: options.loadWatchlist,
    onOpenMore: options.onOpenMore,
    setAccountRoute,
    setAuthMode,
    setMoreLoading,
    setMoreMessage,
    setPendingEmailVerification,
    setProfile,
    showToast: options.showToast,
  });

  const authActions = useNativeAuthActions({
    loadProfile,
    loadWatchlist: options.loadWatchlist,
    setAccountRoute,
    setMoreLoading,
    setMoreMessage,
    setPendingEmailVerification,
    setProfile,
    setSignInPassword,
    setSignUpPassword,
    setSocialAuthLoading,
    showToast: options.showToast,
    signInEmail,
    signInPassword,
    signUpEmail,
    signUpName,
    signUpPassword,
  });
  const profileActions = useNativeProfileActions({
    clearWatchlist: options.clearWatchlist,
    setAccountRoute,
    setDeleteConfirming,
    setDeletingAccount,
    setMoreLoading,
    setMoreMessage,
    setPendingEmailVerification,
    setProfile,
    showToast: options.showToast,
  });

  const savePersonalization = React.useCallback(async (next: ProfilePreferences) => {
    setPreferencesSaving(true);
    const error = await preferences.save(next);
    setPreferencesSaving(false);
    setAccountRoute("settings");
    setMoreMessage(
      pendingEmailVerification
        ? "Preferences saved. Check your email to verify your account."
        : error
          ? "Preferences were saved on this device. Account sync will retry later."
          : "Shopping profile updated.",
    );
    options.showToast("Shopping profile updated.");
  }, [options, pendingEmailVerification, preferences]);

  const skipPersonalization = React.useCallback(() => {
    void savePersonalization({ ...preferences.preferences, completed: true });
  }, [preferences.preferences, savePersonalization]);

  const openAuth = React.useCallback((mode: NativeAuthMode) => {
    setAuthMode(mode);
    setMoreMessage(null);
    setAccountRoute("auth");
  }, []);
  const openSignIn = React.useCallback(() => openAuth("signIn"), [openAuth]);
  const openSignUp = React.useCallback(() => openAuth("signUp"), [openAuth]);
  const closeSubpage = React.useCallback(() => {
    setAccountRoute("settings");
    if (accountRoute === "auth") setMoreMessage(null);
  }, [accountRoute]);

  return {
    accountRoute,
    authMode,
    closeSubpage,
    deleteAccount: profileActions.deleteAccount,
    deleteConfirming,
    deletingAccount,
    moreLoading,
    moreMessage,
    openSignIn,
    openSignUp,
    pendingEmailVerification,
    preferencesSaving,
    profile,
    profilePreferences: preferences.preferences,
    profilePreferencesLoaded: preferences.loaded,
    requestReset: authActions.requestReset,
    savePassword: profileActions.savePassword,
    savePersonalization,
    setAccountRoute,
    setAuthMode,
    setDeleteConfirming,
    setMoreLoading,
    setMoreMessage,
    setSignInEmail,
    setSignInPassword,
    setSignUpEmail,
    setSignUpName,
    setSignUpPassword,
    signIn: authActions.signIn,
    signInEmail,
    signInPassword,
    signInWithProvider: authActions.signInWithProvider,
    signOut: profileActions.signOut,
    signUp: authActions.signUp,
    signUpEmail,
    signUpName,
    signUpPassword,
    socialAuthLoading,
    skipPersonalization,
    updatePersonalizationDraft: preferences.saveDraft,
    updateProfile: profileActions.updateProfile,
  };
}
