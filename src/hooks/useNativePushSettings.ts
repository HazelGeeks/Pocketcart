import React from "react";
import {
  configurePushNotificationHandler,
  disablePushTokensForCurrentUser,
  registerPushTokenForCurrentUser,
} from "../services/pushNotifications";
import { sendTestSaleAlertPushNotification } from "../services/pushNotificationTest";
import type { UserProfile } from "../services/userProfile";
import { isPushRegistrationReady } from "../utils/pushRegistrationState";
import type useNativeOnboarding from "./useNativeOnboarding";

type OnboardingController = ReturnType<typeof useNativeOnboarding>;

type Options = {
  onboarding: OnboardingController;
  profile: UserProfile | null;
  setMoreLoading: (loading: boolean) => void;
  setMoreMessage: (message: string | null) => void;
  showToast: (message: string) => void;
};

export default function useNativePushSettings({
  onboarding,
  profile,
  setMoreLoading,
  setMoreMessage,
  showToast,
}: Options) {
  const {
    persist,
    setAlertsEnabled,
    setMessage,
    setVisible,
    state,
  } = onboarding;

  React.useEffect(() => {
    configurePushNotificationHandler();
  }, []);

  React.useEffect(() => {
    if (!profile || !state.alertsEnabled) return;
    let active = true;

    void registerPushTokenForCurrentUser()
      .then((registration) => {
        if (!active || isPushRegistrationReady(registration)) return;
        setMoreMessage(
          registration.message ?? "Push alerts could not be linked to this device.",
        );
        void persist({ ...state, alertsEnabled: false });
      })
      .catch(() => {
        if (!active) return;
        setMoreMessage("Push alerts could not be linked to this device.");
        void persist({ ...state, alertsEnabled: false });
      });

    return () => {
      active = false;
    };
  }, [persist, profile, setMoreMessage, state]);

  const enableAlerts = React.useCallback(async (
    source: "onboarding" | "settings" = "onboarding",
  ) => {
    if (source === "settings") setMoreLoading(true);

    try {
      const permission = await registerPushTokenForCurrentUser();
      const nextAlertsEnabled = isPushRegistrationReady(permission);

      if (source === "settings") setMoreMessage(permission.message ?? null);
      else setMessage(permission.message ?? null);

      setAlertsEnabled(nextAlertsEnabled);
      await persist({
        ...state,
        alertsCompleted: true,
        alertsEnabled: nextAlertsEnabled,
      });
      if (source === "onboarding") setVisible(false);
      showToast(
        nextAlertsEnabled
          ? "Alerts enabled."
          : permission.message ?? "Push alerts could not be enabled.",
      );
    } catch {
      const message = "Notification permission could not be checked.";
      if (source === "settings") setMoreMessage(message);
      else setMessage(message);
      showToast(message);
    } finally {
      if (source === "settings") setMoreLoading(false);
    }
  }, [
    persist,
    setAlertsEnabled,
    setMessage,
    setMoreLoading,
    setMoreMessage,
    setVisible,
    showToast,
    state,
  ]);

  const disableAlerts = React.useCallback(async () => {
    setMoreLoading(true);
    const serverError = profile ? await disablePushTokensForCurrentUser() : null;
    const message = serverError
      ? `Alerts are off on this device. Server update: ${serverError}`
      : "Price notifications are off for this account.";

    setMoreMessage(message);
    await persist({
      ...state,
      alertsCompleted: true,
      alertsEnabled: false,
    });
    setMoreLoading(false);
    showToast(serverError ? "Alerts disabled with a server warning." : "Alerts disabled.");
  }, [
    persist,
    profile,
    setMoreLoading,
    setMoreMessage,
    showToast,
    state,
  ]);

  const sendTestAlert = React.useCallback(async () => {
    setMoreLoading(true);
    try {
      const result = await sendTestSaleAlertPushNotification();
      setMoreMessage(result.message);
      showToast(result.sent ? "Test notification sent." : result.message);
    } catch {
      const message = "The test notification could not be sent.";
      setMoreMessage(message);
      showToast(message);
    } finally {
      setMoreLoading(false);
    }
  }, [setMoreLoading, setMoreMessage, showToast]);

  return {
    disableAlerts,
    enableAlerts,
    sendTestAlert,
  };
}
