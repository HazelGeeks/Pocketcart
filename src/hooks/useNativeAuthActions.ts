import React from "react";
import { signInWithApple, signInWithGoogle } from "../services/nativeSocialAuth";
import {
  requestPasswordReset,
  signInUser,
  signUpUser,
  type UserProfile,
} from "../services/userProfile";
import type { NativeAccountRoute } from "./nativeAccountTypes";

type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

type Options = {
  loadProfile: (keepMessage?: boolean) => Promise<void>;
  loadWatchlist: (keepMessage?: boolean) => Promise<void>;
  setAccountRoute: SetState<NativeAccountRoute>;
  setMoreLoading: SetState<boolean>;
  setMoreMessage: SetState<string | null>;
  setPendingEmailVerification: SetState<boolean>;
  setProfile: SetState<UserProfile | null>;
  setSignInPassword: SetState<string>;
  setSignUpPassword: SetState<string>;
  setSocialAuthLoading: SetState<"apple" | "google" | null>;
  showToast: (message: string) => void;
  signInEmail: string;
  signInPassword: string;
  signUpEmail: string;
  signUpName: string;
  signUpPassword: string;
};

export default function useNativeAuthActions(options: Options) {
  const signUp = React.useCallback(async () => {
    const name = options.signUpName.trim();
    const email = options.signUpEmail.trim();
    const password = options.signUpPassword;
    if (!name || !email || password.length < 8) {
      options.setMoreMessage(
        !name
          ? "Name is required."
          : !email
            ? "Email is required."
            : "Password must be at least 8 characters.",
      );
      return;
    }

    options.setMoreLoading(true);
    const { data, error } = await signUpUser({ name, email, password });
    options.setMoreLoading(false);
    if (error) {
      options.setMoreMessage(error);
      return;
    }

    options.setMoreMessage(
      data.awaitingVerification
        ? "Account created. Check your email to verify your account."
        : "Account created successfully.",
    );
    options.setPendingEmailVerification(data.awaitingVerification);
    options.showToast(
      data.awaitingVerification
        ? "Account created. Verify your email."
        : "Account created.",
    );
    options.setSignUpPassword("");
    await options.loadProfile(true);
    options.setAccountRoute(data.awaitingVerification ? "verify" : "personalize");
  }, [options]);

  const signIn = React.useCallback(async () => {
    const email = options.signInEmail.trim();
    const password = options.signInPassword;
    if (!email || !password) {
      options.setMoreMessage(email ? "Password is required." : "Email is required.");
      return;
    }

    options.setMoreLoading(true);
    const { data, error } = await signInUser({ email, password });
    options.setMoreLoading(false);
    if (error) {
      options.setMoreMessage(error);
      return;
    }

    options.setProfile(data);
    options.setPendingEmailVerification(false);
    options.setMoreMessage(null);
    options.setSignInPassword("");
    options.setAccountRoute("settings");
    options.showToast("Signed in.");
    await options.loadWatchlist(true);
  }, [options]);

  const signInWithProvider = React.useCallback(async (
    provider: "apple" | "google",
  ) => {
    options.setMoreMessage(null);
    options.setSocialAuthLoading(provider);
    const result = provider === "apple"
      ? await signInWithApple()
      : await signInWithGoogle();
    options.setSocialAuthLoading(null);

    if (result.data.cancelled) return;
    if (!result.data.profile) {
      options.setMoreMessage(result.error ?? `Unable to sign in with ${provider}.`);
      return;
    }

    options.setProfile(result.data.profile);
    options.setPendingEmailVerification(false);
    options.setMoreMessage(
      result.error
        ? `Signed in, but some profile details could not sync: ${result.error}`
        : null,
    );
    options.setAccountRoute(result.data.isNewUser ? "personalize" : "settings");
    options.showToast(`Signed in with ${provider === "apple" ? "Apple" : "Google"}.`);
    await options.loadWatchlist(true);
  }, [options]);

  const requestReset = React.useCallback(async (emailValue: string) => {
    const email = emailValue.trim();
    if (!email) {
      options.setMoreMessage("Enter your email first, then tap Forgot password.");
      return;
    }
    options.setMoreLoading(true);
    const { error } = await requestPasswordReset(email);
    options.setMoreLoading(false);
    options.setMoreMessage(error ?? "Password reset email sent. Open the link on this device.");
  }, [options]);

  return { requestReset, signIn, signInWithProvider, signUp };
}
