import type { NativeOnboardingState } from "./nativeOnboardingState";

export function getLocationSettingsLabel(state: NativeOnboardingState): string {
  if (state.locationMode === "share") {
    if (state.locationLatitude && state.locationLongitude) {
      return `Current location (${state.locationLatitude.toFixed(3)}, ${state.locationLongitude.toFixed(3)})`;
    }
    return "Current location";
  }
  if (state.locationMode === "postal" && state.postalCode) {
    return `Postal code ${state.postalCode}`;
  }
  return "Not set";
}
