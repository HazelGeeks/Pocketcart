import { Pressable, Text, TextInput, View } from "react-native";
import type { AccountAuthPanelProps } from "./AccountAuthPanel";
import { st } from "../../screens/nativeAppStyles";
import { marketingPalette as C } from "../../shared/design/palette";

export function AccountEmailForm(props: AccountAuthPanelProps) {
  const signIn = props.mode === "signIn";
  const busy = props.loading || props.socialLoading !== null;
  return <View style={{ gap: 16 }}>
    {!signIn ? <View style={st.authField}>
      <Text style={st.authFieldLabel}>Name</Text>
      <TextInput accessibilityLabel="Name" value={props.signUpName} onChangeText={props.onChangeSignUpName}
        placeholder="Your name" placeholderTextColor={C.textMuted} textContentType="name" autoComplete="name"
        autoCapitalize="words" autoCorrect={false} editable={!busy} style={st.settingsInput} />
    </View> : null}
    <View style={st.authField}>
      <Text style={st.authFieldLabel}>Email</Text>
      <TextInput accessibilityLabel="Email" value={signIn ? props.signInEmail : props.signUpEmail}
        onChangeText={signIn ? props.onChangeSignInEmail : props.onChangeSignUpEmail} placeholder="you@example.com"
        placeholderTextColor={C.textMuted} keyboardType="email-address" textContentType="emailAddress" autoComplete="email"
        autoCapitalize="none" autoCorrect={false} editable={!busy} style={st.settingsInput} />
    </View>
    <View style={st.authField}>
      <Text style={st.authFieldLabel}>Password</Text>
      <TextInput key={props.mode} accessibilityLabel={signIn ? "Password" : "Password, minimum 8 characters"}
        value={signIn ? props.signInPassword : props.signUpPassword}
        onChangeText={signIn ? props.onChangeSignInPassword : props.onChangeSignUpPassword}
        placeholder={signIn ? "Your password" : "At least 8 characters"} placeholderTextColor={C.textMuted}
        secureTextEntry textContentType={signIn ? "password" : "newPassword"} autoComplete={signIn ? "current-password" : "new-password"}
        autoCapitalize="none" autoCorrect={false} editable={!busy} returnKeyType="done"
        onSubmitEditing={() => { if (!busy) (signIn ? props.onSignIn : props.onSignUp)(); }} style={st.settingsInput} />
    </View>
    {signIn ? <Pressable accessibilityRole="button" disabled={busy} onPress={() => props.onForgotPassword(props.signInEmail)} style={st.authInlineButton}>
      <Text style={st.authTextButtonLabel}>Forgot password?</Text>
    </Pressable> : null}
    <Pressable accessibilityRole="button" disabled={busy} onPress={signIn ? props.onSignIn : props.onSignUp}
      style={[st.settingsButton, st.settingsButtonPrimary, { minHeight: 52, borderRadius: 14, opacity: busy ? 0.6 : 1 }]}>
      <Text style={st.settingsButtonPrimaryText}>{props.loading ? (signIn ? "Signing in…" : "Creating account…") : (signIn ? "Sign in" : "Create account")}</Text>
    </Pressable>
  </View>;
}
