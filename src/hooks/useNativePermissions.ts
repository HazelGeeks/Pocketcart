import React from "react";
import { requestLocationPermissionAndPosition } from "../services/nativePermissions";
import {
  configurePushNotificationHandler,
  registerPushTokenForCurrentUser,
} from "../services/pushNotifications";
import type { UserProfile } from "../services/userProfile";
import { isPushRegistrationReady } from "../utils/pushRegistrationState";
import { getLocationSettingsLabel } from "../utils/nativeLocationSettings";
import type useNativeOnboarding from "./useNativeOnboarding";
import type { NativeOnboardingState } from "./useNativeOnboarding";

type OnboardingController = ReturnType<typeof useNativeOnboarding>;
type LocationSource = "onboarding" | "settings" | "map";

type UseNativePermissionsOptions = {
  focusMapOnUser: (latitude: number, longitude: number) => void;
  onboarding: OnboardingController;
  profile: UserProfile | null;
  setHomeActionMessage: (message: string | null) => void;
  setMapMessage: (message: string | null) => void;
  setMapQuery: (query: string) => void;
  setMoreLoading: (loading: boolean) => void;
  setMoreMessage: (message: string | null) => void;
  showToast: (message: string) => void;
};

export default function useNativePermissions({
  focusMapOnUser,
  onboarding,
  profile,
  setHomeActionMessage,
  setMapMessage,
  setMapQuery,
  setMoreLoading,
  setMoreMessage,
  showToast,
}: UseNativePermissionsOptions) {
  const [requesting, setRequesting] = React.useState(false);
  const {
    alertsEnabled,
    persist,
    postalCode,
    setAlertsEnabled,
    setMessage,
    setStep,
    setVisible,
    state,
  } = onboarding;

  const locationSettingsLabel = getLocationSettingsLabel(state);

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

  const shareLocation = React.useCallback(async (
    source: LocationSource = "onboarding",
  ) => {
    setRequesting(true);
    if (source === "settings") setMoreLoading(true);

    try {
      const permission = await requestLocationPermissionAndPosition();
      if (!permission.granted) {
        const message = permission.message ?? "Location access not available.";
        if (source === "map") setMapMessage(message);
        else setHomeActionMessage(message);
      } else {
        setHomeActionMessage(null);
        if (source === "map") setMapMessage(null);
      }

      const nextState: NativeOnboardingState = {
        ...state,
        locationCompleted: true,
        locationMode: "share",
        postalCode: permission.granted ? null : state.postalCode,
        locationLatitude: permission.latitude ?? null,
        locationLongitude: permission.longitude ?? null,
        alertsCompleted: source === "onboarding" ? false : state.alertsCompleted,
        alertsEnabled: state.alertsEnabled,
      };
      setMessage(permission.message ?? null);
      if (source === "settings") setMoreMessage(permission.message ?? null);
      if (permission.granted) {
        setMapQuery("");
        if (
          source === "map" &&
          permission.latitude !== undefined &&
          permission.longitude !== undefined
        ) {
          focusMapOnUser(permission.latitude, permission.longitude);
        }
      }

      await persist(nextState);
      if (source === "onboarding") setStep("alerts");
      showToast(
        permission.granted
          ? source === "map"
            ? "Map centered on your location."
            : "Using live location mode."
          : "Location not granted. Continue with alerts.",
      );
    } catch {
      const message = "Location permission could not be checked.";
      setHomeActionMessage(message);
      if (source === "settings") setMoreMessage(message);
      else if (source === "map") setMapMessage(message);
      else setMessage(message);
      showToast(message);
    } finally {
      setRequesting(false);
      if (source === "settings") setMoreLoading(false);
    }
  }, [
    focusMapOnUser,
    persist,
    setHomeActionMessage,
    setMapMessage,
    setMapQuery,
    setMessage,
    setMoreLoading,
    setMoreMessage,
    setStep,
    showToast,
    state,
  ]);

  const usePostalLocation = React.useCallback(async (
    source: "onboarding" | "settings" = "onboarding",
  ) => {
    const normalized = postalCode.trim();
    if (!normalized) {
      const message = "Please enter postal code.";
      setHomeActionMessage(message);
      if (source === "settings") setMoreMessage(message);
      return;
    }

    const nextState: NativeOnboardingState = {
      ...state,
      locationCompleted: true,
      locationMode: "postal",
      postalCode: normalized,
      locationLatitude: null,
      locationLongitude: null,
      alertsCompleted: source === "onboarding" ? false : state.alertsCompleted,
      alertsEnabled: state.alertsEnabled,
    };
    setMessage(null);
    if (source === "settings") setMoreMessage(`Saved postal code ${normalized}.`);
    await persist(nextState);
    setMapQuery(normalized);
    if (source === "onboarding") setStep("alerts");
    showToast(`Saved postal code ${normalized}.`);
  }, [
    persist,
    postalCode,
    setHomeActionMessage,
    setMapQuery,
    setMessage,
    setMoreMessage,
    setStep,
    showToast,
    state,
  ]);

  const enableAlerts = React.useCallback(async (
    source: "onboarding" | "settings" = "onboarding",
  ) => {
    setRequesting(true);
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
      setRequesting(false);
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
    setMoreMessage(
      "In-app alert prompts are off. You can also change OS notification access in Settings.",
    );
    await persist({
      ...state,
      alertsCompleted: true,
      alertsEnabled: false,
    });
    showToast("Alerts disabled.");
  }, [persist, setMoreMessage, showToast, state]);

  const skipLocation = React.useCallback(async () => {
    setMessage(null);
    await persist({
      ...state,
      locationCompleted: true,
      locationMode: "skip",
      postalCode: null,
      locationLatitude: null,
      locationLongitude: null,
      alertsCompleted: false,
      alertsEnabled: state.alertsEnabled,
    });
    setStep("alerts");
    showToast("Location setup skipped. You can set it later.");
  }, [persist, setMessage, setStep, showToast, state]);

  const finishAlertsStep = React.useCallback(async () => {
    if (alertsEnabled) {
      await enableAlerts("onboarding");
      return;
    }

    await persist({
      ...state,
      alertsCompleted: true,
      alertsEnabled: false,
    });
    setVisible(false);
    showToast("Alerts disabled.");
  }, [alertsEnabled, enableAlerts, persist, setVisible, showToast, state]);

  return {
    disableAlerts,
    enableAlerts,
    finishAlertsStep,
    locationSettingsLabel,
    requesting,
    shareLocation,
    skipLocation,
    usePostalLocation,
  };
}
