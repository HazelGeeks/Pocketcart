import React from "react";
import {
  Platform,
  Pressable,
  StyleProp,
  Text,
  TextInput,
  View,
  ViewStyle,
} from "react-native";
import { motion } from "framer-motion";
import { isWeb } from "../constants/variants";
import { marketingPalette, semanticPalette } from "../shared/design/palette";

type Tone = "dark" | "light";

type Props = {
  title: string;
  subtitle: string;
  emailPlaceholder: string;
  submitLabel: string;
  successLabel: string;
  tone?: Tone;
  compact?: boolean;
  stackOnDesktop?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
};

const paletteByTone: Record<
  Tone,
  {
    panel: string;
    border: string;
    title: string;
    subtitle: string;
    inputBg: string;
    inputBorder: string;
    inputText: string;
    placeholder: string;
    successBg: string;
    successText: string;
    buttonBg: string;
  }
> = {
  dark: {
    panel: "transparent",
    border: "transparent",
    title: marketingPalette.white,
    subtitle: "rgba(255,255,255,0.55)",
    inputBg: "rgba(255,255,255,0.06)",
    inputBorder: "rgba(255,255,255,0.2)",
    inputText: marketingPalette.white,
    placeholder: "rgba(255,255,255,0.35)",
    successBg: "rgba(97,227,146,0.12)",
    successText: marketingPalette.primary,
    buttonBg: semanticPalette.success,
  },
  light: {
    panel: "rgba(255,255,255,0.86)",
    border: "rgba(97,227,146,0.18)",
    title: marketingPalette.text,
    subtitle: marketingPalette.textSoft,
    inputBg: "rgba(250,252,242,0.92)",
    inputBorder: "rgba(97,227,146,0.22)",
    inputText: marketingPalette.text,
    placeholder: marketingPalette.textMuted,
    successBg: "rgba(97,227,146,0.12)",
    successText: marketingPalette.primaryDeep,
    buttonBg: semanticPalette.success,
  },
};

export default function EmailSignupForm({
  title,
  subtitle,
  emailPlaceholder,
  submitLabel,
  successLabel,
  tone = "dark",
  compact = false,
  stackOnDesktop = false,
  containerStyle,
}: Props) {
  const palette = paletteByTone[tone];
  const [email, setEmail] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmit = React.useCallback(() => {
    if (!email.trim() || !email.includes("@")) return;
    // TODO: hook up to real API / newsletter service
    setSubmitted(true);
  }, [email]);

  return (
    <View
      style={[
        {
          gap: compact ? 8 : 10,
          width: "100%",
          borderWidth: tone === "light" ? 1 : 0,
          borderColor: palette.border,
          borderRadius: compact ? 22 : 28,
          backgroundColor: palette.panel,
          padding: compact ? 0 : 0,
        },
        containerStyle,
      ]}
    >
      <Text
        style={{
          fontSize: compact ? 22 : 26,
          lineHeight: compact ? 30 : 34,
          fontWeight: "800",
          color: palette.title,
          textAlign: "center",
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontSize: 14,
          lineHeight: 21,
          color: palette.subtitle,
          textAlign: "center",
          maxWidth: 520,
          alignSelf: "center",
        }}
      >
        {subtitle}
      </Text>
      {submitted ? (
        <View
          style={{
            marginTop: 8,
            paddingVertical: 12,
            paddingHorizontal: 20,
            borderRadius: 12,
            backgroundColor: palette.successBg,
            alignSelf: "center",
          }}
        >
          <Text
            style={{
              fontSize: 14,
              color: palette.successText,
              fontWeight: "700",
            }}
          >
            {successLabel}
          </Text>
        </View>
      ) : (
        <View
          style={{
            flexDirection: stackOnDesktop ? "column" : "row",
            alignItems: stackOnDesktop ? "stretch" : "center",
            gap: 10,
            marginTop: 8,
            width: "100%",
            maxWidth: stackOnDesktop ? 520 : 420,
            alignSelf: "center",
          }}
        >
          <TextInput
            style={{
              flex: 1,
              height: 46,
              borderWidth: 1,
              borderColor: palette.inputBorder,
              borderRadius: 12,
              paddingHorizontal: 14,
              fontSize: 14,
              color: palette.inputText,
              backgroundColor: palette.inputBg,
              ...(Platform.OS === "web"
                ? ({ outlineStyle: "none" } as any)
                : {}),
            }}
            placeholder={emailPlaceholder}
            placeholderTextColor={palette.placeholder}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
            onSubmitEditing={handleSubmit}
          />
          {isWeb ? (
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Pressable
                style={[
                  {
                    height: 46,
                    paddingHorizontal: 22,
                    borderRadius: 12,
                    backgroundColor: palette.buttonBg,
                    alignItems: "center",
                    justifyContent: "center",
                  },
                  stackOnDesktop && { width: "100%" },
                ]}
                onPress={handleSubmit}
              >
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 14,
                    fontWeight: "700",
                    ...(Platform.OS === "web"
                      ? ({ whiteSpace: "nowrap" } as any)
                      : {}),
                  }}
                >
                  {submitLabel}
                </Text>
              </Pressable>
            </motion.div>
          ) : (
            <Pressable
              style={[
                {
                  height: 46,
                  paddingHorizontal: 22,
                  borderRadius: 12,
                  backgroundColor: palette.buttonBg,
                  alignItems: "center",
                  justifyContent: "center",
                },
                stackOnDesktop && { width: "100%" },
              ]}
              onPress={handleSubmit}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 14,
                  fontWeight: "700",
                }}
              >
                {submitLabel}
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}
