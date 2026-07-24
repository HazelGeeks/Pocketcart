import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import { hasSupabaseEnv, supabase } from "./supabaseClient";
import {
  completeAuthSessionFromUrl,
  syncAuthenticatedUserProfile,
  type ServiceResult,
  type UserProfile,
} from "./userProfile";
import { isNewlyCreatedUser } from "../utils/socialAuth";

const authRedirectUrl = process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL?.trim() ?? "";

export type SocialAuthResult = {
  cancelled: boolean;
  isNewUser: boolean;
  profile: UserProfile | null;
};

function unavailableResult(message: string): ServiceResult<SocialAuthResult> {
  return {
    data: { cancelled: false, isNewUser: false, profile: null },
    error: message,
  };
}

async function isAppleSignInAvailable(): Promise<boolean> {
  return Platform.OS === "ios" && AppleAuthentication.isAvailableAsync();
}

export async function signInWithApple(): Promise<ServiceResult<SocialAuthResult>> {
  if (!hasSupabaseEnv || !supabase) {
    return unavailableResult("Supabase is not configured for sign in.");
  }
  if (!(await isAppleSignInAvailable())) {
    return unavailableResult("Apple sign in is not available on this device.");
  }

  try {
    const rawNonce = Crypto.randomUUID();
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      rawNonce,
    );
    const credential = await AppleAuthentication.signInAsync({
      nonce: hashedNonce,
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      return unavailableResult("Apple did not return a usable identity token.");
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "apple",
      token: credential.identityToken,
      nonce: rawNonce,
    });
    if (error || !data.user) {
      return unavailableResult(error?.message ?? "Unable to read the Apple account.");
    }

    const fullName = [
      credential.fullName?.givenName,
      credential.fullName?.middleName,
      credential.fullName?.familyName,
    ].filter(Boolean).join(" ");

    let user = data.user;
    let profileWarning: string | null = null;
    if (fullName) {
      const { data: updated, error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          given_name: credential.fullName?.givenName,
          family_name: credential.fullName?.familyName,
        },
      });
      if (updateError) profileWarning = updateError.message;
      if (updated.user) user = updated.user;
    }

    const profileResult = await syncAuthenticatedUserProfile(user);
    return {
      data: {
        cancelled: false,
        isNewUser: isNewlyCreatedUser(user.created_at, user.last_sign_in_at),
        profile: profileResult.data,
      },
      error: profileResult.error ?? profileWarning,
    };
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ERR_REQUEST_CANCELED"
    ) {
      return {
        data: { cancelled: true, isNewUser: false, profile: null },
        error: null,
      };
    }
    return unavailableResult(
      error instanceof Error ? error.message : "Apple sign in failed.",
    );
  }
}

export async function signInWithGoogle(): Promise<ServiceResult<SocialAuthResult>> {
  if (!hasSupabaseEnv || !supabase) {
    return unavailableResult("Supabase is not configured for sign in.");
  }
  if (!authRedirectUrl) {
    return unavailableResult("EXPO_PUBLIC_AUTH_REDIRECT_URL is required for Google sign in.");
  }

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: authRedirectUrl,
        skipBrowserRedirect: true,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error || !data.url) {
      return unavailableResult(error?.message ?? "Unable to start Google sign in.");
    }

    const browserResult = await WebBrowser.openAuthSessionAsync(data.url, authRedirectUrl);
    if (browserResult.type !== "success") {
      return {
        data: { cancelled: true, isNewUser: false, profile: null },
        error: null,
      };
    }

    const callbackResult = await completeAuthSessionFromUrl(browserResult.url);
    if (!callbackResult.data.profile) {
      return unavailableResult(
        callbackResult.error ?? "Google sign in did not return a user profile.",
      );
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return unavailableResult(userError?.message ?? "Unable to read the Google account.");
    }
    const profileResult = await syncAuthenticatedUserProfile(userData.user);
    return {
      data: {
        cancelled: false,
        isNewUser: isNewlyCreatedUser(
          userData.user.created_at,
          userData.user.last_sign_in_at,
        ),
        profile: profileResult.data,
      },
      error: profileResult.error ?? callbackResult.error,
    };
  } catch (error) {
    return unavailableResult(
      error instanceof Error ? error.message : "Google sign in failed.",
    );
  }
}
