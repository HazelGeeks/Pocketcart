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

const LOCATION_MODES = new Set<OnboardingLocationMode>(["share", "postal", "skip"]);

export function normalizeStoredOnboardingState(
  stored: Partial<NativeOnboardingState>,
): NativeOnboardingState {
  const locationMode = stored.locationMode;
  return {
    locationCompleted: Boolean(stored.locationCompleted),
    locationMode: locationMode && LOCATION_MODES.has(locationMode) ? locationMode : "skip",
    postalCode: typeof stored.postalCode === "string" ? stored.postalCode : null,
    locationLatitude: typeof stored.locationLatitude === "number" && Number.isFinite(stored.locationLatitude)
      ? stored.locationLatitude
      : null,
    locationLongitude: typeof stored.locationLongitude === "number" && Number.isFinite(stored.locationLongitude)
      ? stored.locationLongitude
      : null,
    alertsCompleted: Boolean(stored.alertsCompleted),
    alertsEnabled: Boolean(stored.alertsEnabled),
  };
}
