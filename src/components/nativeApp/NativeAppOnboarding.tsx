import { Pressable, Text, TextInput, View } from "react-native";
import { st } from "../../screens/nativeAppStyles";

type Step = "location" | "alerts";

type NativeAppOnboardingProps = {
  visible: boolean;
  step: Step;
  locationPostalCode: string;
  alertsEnabled: boolean;
  requesting?: boolean;
  message?: string | null;
  onChangePostalCode: (value: string) => void;
  onShareLocation: () => void;
  onSetPostalLocation: () => void;
  onSkipLocation: () => void;
  onSetAlerts: (enabled: boolean) => void;
  onFinish: () => void;
};

export function NativeAppOnboarding({
  visible,
  step,
  locationPostalCode,
  alertsEnabled,
  requesting = false,
  message,
  onChangePostalCode,
  onShareLocation,
  onSetPostalLocation,
  onSkipLocation,
  onSetAlerts,
  onFinish,
}: NativeAppOnboardingProps) {
  if (!visible) return null;

  const location = step === "location";
  return (
    <View style={st.onboardingBackdrop}>
      <View style={st.onboardingCard}>
        <Text style={st.sectionSub}>
          {location ? "Step 1 / 2 · Location" : "Step 2 / 2 · Price alerts"}
        </Text>
        <Text style={st.onboardingTitle}>
          {location ? "Find deals near you" : "Get price alerts"}
        </Text>
        <Text style={st.onboardingMeta}>
          {location
            ? "Continue to choose location access, or enter your postal code to find nearby stores."
            : "Choose whether to receive price alerts. With alerts on, Continue opens your notification settings prompt."}
        </Text>
        {location && (
          <TextInput
            accessibilityLabel="Postal code"
            value={locationPostalCode}
            onChangeText={onChangePostalCode}
            placeholder="Postal code"
            placeholderTextColor={st.onboardingMeta.color}
            autoCapitalize="characters"
            autoCorrect={false}
            style={st.formInput}
          />
        )}
        {message ? (
          <Text accessibilityRole="alert" style={st.itemMeta}>
            {message}
          </Text>
        ) : null}
        <View style={st.onboardingActions}>
          {!location && (
            <Pressable
              accessibilityRole="switch"
              accessibilityLabel="Price alerts"
              accessibilityState={{ checked: alertsEnabled, disabled: requesting }}
              disabled={requesting}
              onPress={() => onSetAlerts(!alertsEnabled)}
              style={[st.authBtn, st.authBtnSecondary, st.onboardingBtn]}
            >
              <Text style={st.authBtnSecondaryText}>
                {alertsEnabled ? "Alerts on" : "Alerts off"}
              </Text>
            </Pressable>
          )}
          <Pressable
            accessibilityRole="button"
            disabled={requesting}
            onPress={location ? onShareLocation : onFinish}
            style={[st.authBtn, st.authBtnPrimary, st.onboardingBtn]}
          >
            <Text style={st.authBtnPrimaryText}>
              {requesting ? (location ? "Locating…" : "Saving…") : "Continue"}
            </Text>
          </Pressable>
          {location && (
            <Pressable
              accessibilityRole="button"
              disabled={requesting}
              onPress={onSetPostalLocation}
              style={[st.authBtn, st.authBtnSecondary, st.onboardingBtn]}
            >
              <Text style={st.authBtnSecondaryText}>Use my postal code</Text>
            </Pressable>
          )}
        </View>
        {location && (
          <Pressable
            accessibilityRole="button"
            disabled={requesting}
            onPress={onSkipLocation}
            style={st.onboardingSkip}
          >
            <Text style={st.onboardingSkipText}>Skip</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
