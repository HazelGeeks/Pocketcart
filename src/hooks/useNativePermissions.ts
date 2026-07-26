import React from "react";
import { requestLocationPermissionAndPosition } from "../services/nativePermissions";
import type { UserProfile } from "../services/userProfile";
import { getLocationSettingsLabel } from "../utils/nativeLocationSettings";
import type useNativeOnboarding from "./useNativeOnboarding";
import type { NativeOnboardingState } from "./useNativeOnboarding";
import useNativePushSettings from "./useNativePushSettings";

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
    setMessage,
    setStep,
    setVisible,
    state,
  } = onboarding;

  const locationSettingsLabel = getLocationSettingsLabel(state);
  const pushSettings = useNativePushSettings({
    onboarding,
    profile,
    setMoreLoading,
    setMoreMessage,
    showToast,
  });

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
      setRequesting(true);
      try {
        await pushSettings.enableAlerts("onboarding");
      } finally {
        setRequesting(false);
      }
      return;
    }

    await persist({
      ...state,
      alertsCompleted: true,
      alertsEnabled: false,
    });
    setVisible(false);
    showToast("Alerts disabled.");
  }, [alertsEnabled, persist, pushSettings, setVisible, showToast, state]);

  return {
    finishAlertsStep,
    locationSettingsLabel,
    ...pushSettings,
    requesting,
    shareLocation,
    skipLocation,
    usePostalLocation,
  };
}
