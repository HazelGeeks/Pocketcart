import React from "react";
import * as AppleAuthentication from "expo-apple-authentication";
import { Linking, Pressable, Text, TextInput, View } from "react-native";
import { marketingPalette as C } from "../../shared/design/palette";
import { st } from "../../screens/nativeAppStyles";

type AccountAuthPanelProps = {
  mode: "signIn" | "signUp";
  loading: boolean;
  socialLoading: "apple" | "google" | null;
  message: string | null;
  signInEmail: string;
  signInPassword: string;
  signUpName: string;
  signUpEmail: string;
  signUpPassword: string;
  onChangeMode: (mode: "signIn" | "signUp") => void;
  onSignIn: () => void;
  onSignUp: () => void;
  onSignInWithApple: () => void;
  onSignInWithGoogle: () => void;
  onForgotPassword: (email: string) => void;
  onChangeSignInEmail: (value: string) => void;
  onChangeSignInPassword: (value: string) => void;
  onChangeSignUpName: (value: string) => void;
  onChangeSignUpEmail: (value: string) => void;
  onChangeSignUpPassword: (value: string) => void;
};

export function AccountAuthPanel(props: AccountAuthPanelProps) {
  const isSignIn = props.mode === "signIn";
  const [appleAvailable, setAppleAvailable] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    void AppleAuthentication.isAvailableAsync()
      .then((available) => {
        if (active) setAppleAvailable(available);
      })
      .catch(() => {
        if (active) setAppleAvailable(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <View style={st.authPage}>
      <View style={st.authIntro}>
        <Text style={st.authTitle}>{isSignIn ? "Welcome back" : "Create your account"}</Text>
        <Text style={st.authDescription}>
          {isSignIn
            ? "Sign in to sync your profile and price alert subscriptions."
            : "Save your shopping preferences and keep price alerts available across devices."}
        </Text>
      </View>

      <View style={st.authCard}>
        {props.message ? (
          <View style={st.settingsMessage} accessibilityRole="alert">
            <Text style={st.settingsMessageText}>{props.message}</Text>
          </View>
        ) : null}

        <View style={st.authSocialGroup}>
          {appleAvailable ? (
            <AppleAuthentication.AppleAuthenticationButton
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
              cornerRadius={12}
              onPress={() => {
                if (!props.loading && !props.socialLoading) props.onSignInWithApple();
              }}
              style={st.authAppleButton}
            />
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
            disabled={props.loading || props.socialLoading !== null}
            onPress={props.onSignInWithGoogle}
            style={({ pressed }) => [
              st.authGoogleButton,
              pressed && st.authGoogleButtonPressed,
            ]}
          >
            <Text style={st.authGoogleMark}>G</Text>
            <Text style={st.authGoogleButtonText}>
              {props.socialLoading === "google" ? "Connecting to Google..." : "Continue with Google"}
            </Text>
          </Pressable>
          {props.socialLoading === "apple" ? (
            <Text style={st.authSocialStatus}>Connecting to Apple...</Text>
          ) : null}
        </View>

        <View style={st.authDividerRow}>
          <View style={st.authDividerLine} />
          <Text style={st.authDividerText}>or continue with email</Text>
          <View style={st.authDividerLine} />
        </View>

        {isSignIn ? (
          <>
            <AuthField label="Email">
              <TextInput
                accessibilityLabel="Email"
                value={props.signInEmail}
                onChangeText={props.onChangeSignInEmail}
                placeholder="you@example.com"
                placeholderTextColor={C.textMuted}
                keyboardType="email-address"
                textContentType="emailAddress"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect={false}
                style={st.settingsInput}
              />
            </AuthField>
            <AuthField label="Password">
              <TextInput
                accessibilityLabel="Password"
                value={props.signInPassword}
                onChangeText={props.onChangeSignInPassword}
                placeholder="Password"
                placeholderTextColor={C.textMuted}
                secureTextEntry
                textContentType="password"
                autoComplete="current-password"
                autoCapitalize="none"
                autoCorrect={false}
                style={st.settingsInput}
              />
            </AuthField>
            <Pressable
              accessibilityRole="button"
              onPress={() => props.onForgotPassword(props.signInEmail)}
              style={st.authInlineButton}
            >
              <Text style={st.authTextButtonLabel}>Forgot password?</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={props.onSignIn}
              style={[st.settingsButton, st.settingsButtonPrimary]}
              disabled={props.loading}
            >
              <Text style={st.settingsButtonPrimaryText}>{props.loading ? "Signing in..." : "Sign In"}</Text>
            </Pressable>
          </>
        ) : (
          <>
            <AuthField label="Name">
              <TextInput
                accessibilityLabel="Name"
                value={props.signUpName}
                onChangeText={props.onChangeSignUpName}
                placeholder="Your name"
                placeholderTextColor={C.textMuted}
                textContentType="name"
                autoComplete="name"
                autoCapitalize="words"
                autoCorrect={false}
                style={st.settingsInput}
              />
            </AuthField>
            <AuthField label="Email">
              <TextInput
                accessibilityLabel="Email"
                value={props.signUpEmail}
                onChangeText={props.onChangeSignUpEmail}
                placeholder="you@example.com"
                placeholderTextColor={C.textMuted}
                keyboardType="email-address"
                textContentType="emailAddress"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect={false}
                style={st.settingsInput}
              />
            </AuthField>
            <AuthField label="Password">
              <TextInput
                accessibilityLabel="Password, minimum 8 characters"
                value={props.signUpPassword}
                onChangeText={props.onChangeSignUpPassword}
                placeholder="At least 8 characters"
                placeholderTextColor={C.textMuted}
                secureTextEntry
                textContentType="newPassword"
                autoComplete="new-password"
                autoCapitalize="none"
                autoCorrect={false}
                style={st.settingsInput}
              />
            </AuthField>
            <Pressable
              accessibilityRole="button"
              onPress={props.onSignUp}
              style={[st.settingsButton, st.settingsButtonPrimary]}
              disabled={props.loading}
            >
              <Text style={st.settingsButtonPrimaryText}>{props.loading ? "Creating account..." : "Create Account"}</Text>
            </Pressable>
            <Text style={st.authFinePrint}>By creating an account, you agree to PocketCart's</Text>
            <View style={st.authLegalRow}>
              <Pressable accessibilityRole="link" onPress={() => void Linking.openURL("https://pocketcart.pages.dev/terms")} style={st.authLegalLink}>
                <Text style={st.authLegalLinkText}>Terms of Service</Text>
              </Pressable>
              <Text style={st.authFinePrint}>and</Text>
              <Pressable accessibilityRole="link" onPress={() => void Linking.openURL("https://pocketcart.pages.dev/privacy")} style={st.authLegalLink}>
                <Text style={st.authLegalLinkText}>Privacy Policy</Text>
              </Pressable>
            </View>
          </>
        )}
      </View>

      <View style={st.authSwitchRow}>
        <Text style={st.authSwitchCopy}>{isSignIn ? "New to PocketCart?" : "Already have an account?"}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => props.onChangeMode(isSignIn ? "signUp" : "signIn")}
          style={st.authTextButton}
        >
          <Text style={st.authTextButtonLabel}>{isSignIn ? "Create an account" : "Sign in instead"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function AuthField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={st.authField}>
      <Text style={st.authFieldLabel}>{label}</Text>
      {children}
    </View>
  );
}
