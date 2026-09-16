import React from "react";
import * as AppleAuthentication from "expo-apple-authentication";
import { Keyboard, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { marketingPalette as C } from "../../shared/design/palette";
import { st } from "../../screens/nativeAppStyles";
import { F } from "../../screens/nativeAppStyles/fonts";
import { AppIcon } from "../icons/AppIcon";
import { AccountEmailForm } from "./AccountEmailForm";

export type AccountAuthPanelProps = {
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
  onClearMessage: () => void;
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
  const signIn = props.mode === "signIn";
  const busy = props.loading || props.socialLoading !== null;
  const [emailForm, setEmailForm] = React.useState(false);
  const [appleAvailable, setAppleAvailable] = React.useState(false);
  React.useEffect(() => {
    let active = true;
    void AppleAuthentication.isAvailableAsync().then(value => { if (active) setAppleAvailable(value); }).catch(() => {});
    return () => { active = false; };
  }, []);

  return <View style={s.content}>
    <View style={s.intro}>
      <Text accessibilityRole="header" style={s.title}>{signIn ? "Welcome back" : "Join PocketCart"}</Text>
      <Text style={s.description}>{signIn ? "Your next grocery run starts here." : "A little planning. More everyday savings."}</Text>
    </View>
    {props.message ? <View style={st.settingsMessage} accessibilityRole="alert"><Text style={st.settingsMessageText}>{props.message}</Text></View> : null}
    {emailForm ? <>
      <AccountEmailForm {...props} />
      <Pressable accessibilityRole="button" disabled={busy} style={st.authTextButton}
        onPress={() => { Keyboard.dismiss(); setEmailForm(false); props.onClearMessage(); }}>
        <Text style={st.authTextButtonLabel}>Other sign-in options</Text>
      </Pressable>
    </> : <View style={s.options}>
      <Pressable accessibilityRole="button" disabled={busy} onPress={() => { setEmailForm(true); props.onClearMessage(); }}
        style={({ pressed }) => [s.email, pressed && s.pressed, busy && s.disabled]}>
        <AppIcon name="mail" color={C.white} size={21} />
        <Text style={s.emailText}>Continue with email</Text>
      </Pressable>
      {appleAvailable ? <View pointerEvents={busy ? "none" : "auto"} style={busy ? s.disabled : undefined}>
        <AppleAuthentication.AppleAuthenticationButton
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
          cornerRadius={14} onPress={() => { if (!busy) props.onSignInWithApple(); }} style={s.apple} />
      </View> : null}
      <Pressable accessibilityRole="button" accessibilityLabel="Continue with Google" disabled={busy}
        onPress={props.onSignInWithGoogle} style={({ pressed }) => [s.google, pressed && s.pressed, busy && s.disabled]}>
        <Text style={st.authGoogleMark}>G</Text><Text style={s.googleText}>Continue with Google</Text>
      </Pressable>
      {props.socialLoading ? <Text accessibilityLiveRegion="polite" style={st.authSocialStatus}>
        Connecting to {props.socialLoading === "apple" ? "Apple" : "Google"}…
      </Text> : null}
    </View>}
    {!signIn ? <View style={s.legal}>
      <Text style={st.authFinePrint}>By continuing, you agree to PocketCart's</Text>
      <View style={s.legalLinks}>
        <Pressable accessibilityRole="link" onPress={() => void Linking.openURL("https://pocketcart.app/terms")} style={st.authLegalLink}>
          <Text style={st.authLegalLinkText}>Terms of Service</Text>
        </Pressable>
        <Text style={st.authFinePrint}>and</Text>
        <Pressable accessibilityRole="link" onPress={() => void Linking.openURL("https://pocketcart.app/privacy")} style={st.authLegalLink}>
          <Text style={st.authLegalLinkText}>Privacy Policy</Text>
        </Pressable>
      </View>
    </View> : null}
    <Pressable accessibilityRole="button" accessibilityLabel={signIn ? "Create an account" : "Sign in instead"} disabled={busy}
      style={s.switchButton} onPress={() => {
        Keyboard.dismiss(); setEmailForm(false); props.onChangeMode(signIn ? "signUp" : "signIn");
      }}>
      <Text style={s.switchCopy}>{signIn ? "New to PocketCart? " : "Already have an account? "}
        <Text style={s.switchLabel}>{signIn ? "Sign up" : "Sign in"}</Text>
      </Text>
    </Pressable>
  </View>;
}

const s = StyleSheet.create({
  content: { gap: 20 },
  intro: { gap: 8, alignItems: "center", paddingBottom: 4 },
  title: { color: C.text, fontFamily: F.extraBold, fontSize: 26, lineHeight: 33, textAlign: "center", letterSpacing: -0.5 },
  description: { color: C.textSoft, fontFamily: F.regular, fontSize: 14, lineHeight: 21, textAlign: "center" },
  options: { gap: 12 },
  email: { flexDirection: "row", gap: 10, alignItems: "center", justifyContent: "center", minHeight: 52, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 14, backgroundColor: C.primaryDeep },
  emailText: { color: C.white, fontFamily: F.bold, fontSize: 16, flexShrink: 1 },
  apple: { width: "100%", height: 52 },
  google: { flexDirection: "row", gap: 10, alignItems: "center", justifyContent: "center", minHeight: 52, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: "#DDE5DF", backgroundColor: C.white },
  googleText: { color: C.text, fontFamily: F.bold, fontSize: 16, flexShrink: 1 },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.5 },
  legal: { alignItems: "center", gap: 0 },
  legalLinks: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 5 },
  switchButton: { minHeight: 48, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  switchCopy: { color: C.textSoft, fontFamily: F.regular, fontSize: 14, textAlign: "center", lineHeight: 22 },
  switchLabel: { color: C.primaryDeep, fontFamily: F.extraBold },
});
