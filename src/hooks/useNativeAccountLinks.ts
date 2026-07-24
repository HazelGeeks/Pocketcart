import React from "react";
import { Linking } from "react-native";
import {
  completeAuthSessionFromUrl,
  type UserProfile,
} from "../services/userProfile";
import {
  classifyAuthCallbackType,
  isAuthCallbackUrl,
} from "../utils/authCallback";
import type {
  NativeAccountRoute,
  NativeAuthMode,
} from "./nativeAccountTypes";

type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

type Options = {
  loadWatchlist: (keepMessage?: boolean) => Promise<void>;
  onOpenMore: () => void;
  setAccountRoute: SetState<NativeAccountRoute>;
  setAuthMode: SetState<NativeAuthMode>;
  setMoreLoading: SetState<boolean>;
  setMoreMessage: SetState<string | null>;
  setPendingEmailVerification: SetState<boolean>;
  setProfile: SetState<UserProfile | null>;
  showToast: (message: string) => void;
};

export default function useNativeAccountLinks(options: Options) {
  const handledUrlsRef = React.useRef<Set<string>>(new Set());
  const {
    loadWatchlist,
    onOpenMore,
    setAccountRoute,
    setAuthMode,
    setMoreLoading,
    setMoreMessage,
    setPendingEmailVerification,
    setProfile,
    showToast,
  } = options;

  const handleUrl = React.useCallback(async (url: string | null) => {
    if (!url || handledUrlsRef.current.has(url) || !isAuthCallbackUrl(url)) return;

    handledUrlsRef.current.add(url);
    setMoreLoading(true);
    const { data, error } = await completeAuthSessionFromUrl(url);
    setMoreLoading(false);
    if (!data.handled) return;

    onOpenMore();
    setAuthMode("signIn");
    if (error) {
      setAccountRoute("settings");
      setMoreMessage(error);
      showToast("Unable to complete sign in.");
      return;
    }

    setProfile(data.profile);
    setPendingEmailVerification(false);
    const callbackKind = classifyAuthCallbackType(data.type);
    if (callbackKind === "passwordRecovery") {
      setAccountRoute("resetPassword");
      setMoreMessage(null);
      showToast("Choose a new password.");
      return;
    }

    const verifiedEmail = callbackKind === "emailVerification";
    setAccountRoute("settings");
    setMoreMessage(
      verifiedEmail ? "Email verified. You're signed in." : "Signed in successfully.",
    );
    showToast(verifiedEmail ? "Email verified." : "Signed in.");
    await loadWatchlist(true);
  }, [
    loadWatchlist,
    onOpenMore,
    setAccountRoute,
    setAuthMode,
    setMoreLoading,
    setMoreMessage,
    setPendingEmailVerification,
    setProfile,
    showToast,
  ]);

  React.useEffect(() => {
    let isMounted = true;
    void Linking.getInitialURL().then((url) => {
      if (isMounted) void handleUrl(url);
    });
    const subscription = Linking.addEventListener("url", ({ url }) => {
      void handleUrl(url);
    });
    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, [handleUrl]);
}
