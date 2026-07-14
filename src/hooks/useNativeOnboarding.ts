import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import type { OnboardingLocationMode } from "../services/nativePermissions";

export type NativeOnboardingState = {
  locationCompleted: boolean;
  locationMode: OnboardingLocationMode;
  postalCode: string | null;
  locationLatitude: number | null;
  locationLongitude: number | null;
  alertsCompleted: boolean;
  alertsEnabled: boolean;
};

type OnboardingStep = "location" | "alerts";

const STORAGE_KEY = "pc-native-onboarding-v1";

const INITIAL_STATE: NativeOnboardingState = {
  locationCompleted: false,
  locationMode: "skip",
  postalCode: null,
  locationLatitude: null,
  locationLongitude: null,
  alertsCompleted: false,
  alertsEnabled: false,
};

function normalizeStoredState(
  stored: Partial<NativeOnboardingState>,
): NativeOnboardingState {
  return {
    locationCompleted: Boolean(stored.locationCompleted),
    locationMode: stored.locationMode ?? "skip",
    postalCode: stored.postalCode ?? null,
    locationLatitude: stored.locationLatitude ?? null,
    locationLongitude: stored.locationLongitude ?? null,
    alertsCompleted: Boolean(stored.alertsCompleted),
    alertsEnabled: Boolean(stored.alertsEnabled),
  };
}

export default function useNativeOnboarding() {
  const [state, setState] = React.useState(INITIAL_STATE);
  const [visible, setVisible] = React.useState(false);
  const [step, setStep] = React.useState<OnboardingStep>("location");
  const [postalCode, setPostalCode] = React.useState("");
  const [alertsEnabled, setAlertsEnabled] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  const persist = React.useCallback(async (nextState: NativeOnboardingState) => {
    setState(nextState);
    setAlertsEnabled(nextState.alertsEnabled);
    setPostalCode(nextState.postalCode ?? "");
    setMessage(null);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextState)).catch(() => {});
  }, []);

  React.useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!active) return;

        if (!raw) {
          setVisible(true);
          setStep("location");
          return;
        }

        const normalized = normalizeStoredState(
          JSON.parse(raw) as Partial<NativeOnboardingState>,
        );
        setState(normalized);
        setPostalCode(normalized.postalCode ?? "");
        setAlertsEnabled(normalized.alertsEnabled);

        if (!normalized.locationCompleted) {
          setVisible(true);
          setStep("location");
        } else if (!normalized.alertsCompleted) {
          setVisible(true);
          setStep("alerts");
        } else {
          setVisible(false);
        }
      } catch {
        if (!active) return;
        setVisible(true);
        setStep("location");
        await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, []);

  return {
    alertsEnabled,
    message,
    persist,
    postalCode,
    setAlertsEnabled,
    setMessage,
    setPostalCode,
    setStep,
    setVisible,
    state,
    step,
    visible,
  };
}
