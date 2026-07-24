import React from "react";
import {
  deleteCurrentUserAccount,
  signOutUser,
  updatePassword,
  updateUserProfile,
  type UserProfile,
} from "../services/userProfile";
import type { NativeAccountRoute } from "./nativeAccountTypes";

type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

type Options = {
  clearWatchlist: () => void;
  setAccountRoute: SetState<NativeAccountRoute>;
  setDeleteConfirming: SetState<boolean>;
  setDeletingAccount: SetState<boolean>;
  setMoreLoading: SetState<boolean>;
  setMoreMessage: SetState<string | null>;
  setPendingEmailVerification: SetState<boolean>;
  setProfile: SetState<UserProfile | null>;
  showToast: (message: string) => void;
};

export default function useNativeProfileActions(options: Options) {
  const updateProfile = React.useCallback(async (nameValue: string, emailValue: string) => {
    const name = nameValue.trim();
    const email = emailValue.trim();
    if (!name || !email) {
      options.setMoreMessage("Name and email are required.");
      return;
    }
    options.setMoreLoading(true);
    const { data, error } = await updateUserProfile({ name, email });
    options.setMoreLoading(false);
    if (error) {
      options.setMoreMessage(error);
      return;
    }
    if (data.profile) options.setProfile(data.profile);
    options.setAccountRoute("settings");
    options.setMoreMessage(
      data.emailChangeRequested
        ? "Profile updated. Check your email to confirm the new address."
        : "Profile updated.",
    );
    options.showToast("Profile updated.");
  }, [options]);

  const savePassword = React.useCallback(async (password: string) => {
    if (password.length < 8) {
      options.setMoreMessage("Password must be at least 8 characters.");
      return;
    }
    options.setMoreLoading(true);
    const { error } = await updatePassword(password);
    options.setMoreLoading(false);
    if (error) {
      options.setMoreMessage(error);
      return;
    }
    options.setAccountRoute("settings");
    options.setMoreMessage("Password updated successfully.");
    options.showToast("Password updated.");
  }, [options]);

  const signOut = React.useCallback(async () => {
    options.setMoreLoading(true);
    const { error } = await signOutUser();
    options.setMoreLoading(false);
    if (error) {
      options.setMoreMessage(error);
      return;
    }
    options.setProfile(null);
    options.clearWatchlist();
    options.setDeleteConfirming(false);
    options.setPendingEmailVerification(false);
    options.setAccountRoute("settings");
    options.setMoreMessage("Signed out.");
    options.showToast("Signed out.");
  }, [options]);

  const deleteAccount = React.useCallback(async () => {
    options.setDeletingAccount(true);
    const { error } = await deleteCurrentUserAccount();
    options.setDeletingAccount(false);
    if (error) {
      options.setMoreMessage(error);
      return;
    }
    options.setDeleteConfirming(false);
    options.setProfile(null);
    options.setPendingEmailVerification(false);
    options.clearWatchlist();
    options.setMoreMessage("Account deleted.");
    options.showToast("Account deleted.");
  }, [options]);

  return { deleteAccount, savePassword, signOut, updateProfile };
}
