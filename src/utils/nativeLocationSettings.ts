import type { NativeOnboardingState } from "./nativeOnboardingState";

export function getLocationSettingsLabel(state: NativeOnboardingState): string {
  if (state.locationMode === "share") {
    return "Current location";
  }
  if (state.locationMode === "postal" && state.postalCode) {
    return `Postal code ${state.postalCode}`;
  }
  return "Not set";
}
