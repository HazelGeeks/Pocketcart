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

  if (step === "location") {
  return (
    <View style={st.onboardingBackdrop}>
      <View style={st.onboardingCard}>
        <Text style={st.sectionSub}>
          Step 1 / 2 · Location setup
        </Text>
        {message ? <Text style={st.itemMeta}>{message}</Text> : null}
        <Text style={st.onboardingTitle}>We can find best deals nearby</Text>
        <Text style={st.onboardingMeta}>
          Continue to choose location access in the system prompt for nearby stores, or use a postal code. Location access is optional.
        </Text>

          <TextInput
            value={locationPostalCode}
            onChangeText={onChangePostalCode}
            placeholder="Postal code (optional)"
            placeholderTextColor={st.onboardingMeta.color}
            autoCapitalize="none"
            autoCorrect={false}
            style={st.formInput}
          />

          <Pressable
            accessibilityRole="button"
            onPress={onShareLocation}
            style={[st.authBtn, st.authBtnPrimary, st.onboardingBtn]}
            disabled={requesting}
          >
            <Text style={st.authBtnPrimaryText}>
              {requesting ? "Checking location..." : "Continue"}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onSetPostalLocation}
            style={[st.authBtn, st.authBtnSecondary, st.onboardingBtn]}
            disabled={requesting}
          >
            <Text style={st.authBtnSecondaryText}>Use postal code</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onSkipLocation}
            style={[st.authBtn, st.authBtnSecondary, st.onboardingBtn]}
            disabled={requesting}
          >
            <Text style={st.authBtnSecondaryText}>Skip</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={st.onboardingBackdrop}>
      <View style={st.onboardingCard}>
        <Text style={st.sectionSub}>
          Step 2 / 2 · Price alerts
        </Text>
        {message ? <Text style={st.itemMeta}>{message}</Text> : null}
        <Text style={st.onboardingTitle}>Don&apos;t miss price drops</Text>
        <Text style={st.onboardingMeta}>
          Choose whether to receive price alerts. With alerts on, Continue opens the system notification prompt.
        </Text>

        <Pressable
          accessibilityRole="button"
          onPress={() => onSetAlerts(!alertsEnabled)}
          style={[st.authBtn, st.authBtnSecondary, st.inlineToggleBtn]}
          disabled={requesting}
        >
          <Text style={st.authBtnSecondaryText}>
            {alertsEnabled ? "Alerts On" : "Alerts Off"}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onFinish}
          style={[st.authBtn, st.authBtnPrimary, st.onboardingBtn]}
          disabled={requesting}
        >
          <Text style={st.authBtnPrimaryText}>
            {requesting ? "Saving..." : "Continue"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
