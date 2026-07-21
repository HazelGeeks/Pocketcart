import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { marketingPalette as C } from "../../shared/design/palette";
import WebLink from "../WebLink";

type AdminAuthPanelsProps = {
  styles: Record<string, any>;
};

type AdminSignInPanelProps = AdminAuthPanelsProps & {
  email: string;
  password: string;
  loading: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSignIn: () => void;
};

type AdminNoAccessPanelProps = AdminAuthPanelsProps & {
  onBack: () => void;
  onSignOut: () => void;
};

export function AdminSignInPanel({
  email,
  password,
  loading,
  styles: st,
  onEmailChange,
  onPasswordChange,
  onSignIn,
}: AdminSignInPanelProps) {
  const passwordInputRef = React.useRef<TextInput>(null);
  const [passwordVisible, setPasswordVisible] = React.useState(false);

  return (
    <View style={st.authCard}>
      <Text accessibilityRole="header" aria-level={2} style={st.infoTitle}>
        Admin Sign In
      </Text>
      <Text style={st.infoBody}>Use your authorized PocketCart admin account.</Text>

      <View style={st.authField}>
        <Text style={st.authFieldLabel}>Email</Text>
        <TextInput
          value={email}
          onChangeText={onEmailChange}
          accessibilityLabel="Admin email"
          placeholder="name@example.com"
          placeholderTextColor={C.textMuted}
          keyboardType="email-address"
          autoComplete="email"
          textContentType="username"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
          returnKeyType="next"
          onSubmitEditing={() => passwordInputRef.current?.focus()}
          style={[st.input, st.authInput]}
        />
      </View>

      <View style={st.authField}>
        <Text style={st.authFieldLabel}>Password</Text>
        <View style={st.authPasswordField}>
          <TextInput
            ref={passwordInputRef}
            value={password}
            onChangeText={onPasswordChange}
            accessibilityLabel="Admin password"
            placeholder="Enter your password"
            placeholderTextColor={C.textMuted}
            secureTextEntry={!passwordVisible}
            autoComplete="current-password"
            textContentType="password"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
            returnKeyType="go"
            onSubmitEditing={onSignIn}
            style={[st.input, st.authInput, st.authPasswordInput]}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={passwordVisible ? "Hide password" : "Show password"}
            accessibilityState={{ expanded: passwordVisible }}
            onPress={() => setPasswordVisible((visible) => !visible)}
            style={st.authPasswordToggle}
            disabled={loading}
          >
            <Text style={st.authPasswordToggleText}>{passwordVisible ? "Hide" : "Show"}</Text>
          </Pressable>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: loading, busy: loading }}
        onPress={onSignIn}
        style={[st.btn, st.btnPrimary, st.authSubmitButton, loading && st.btnDisabled]}
        disabled={loading}
      >
        <Text style={st.btnPrimaryText}>{loading ? "Signing in…" : "Sign In"}</Text>
      </Pressable>
    </View>
  );
}

export function AdminNoAccessPanel({
  styles: st,
  onBack,
  onSignOut,
}: AdminNoAccessPanelProps) {
  return (
    <View style={st.infoCard}>
      <Text style={st.infoTitle}>No admin access</Text>
      <Text style={st.infoBody}>This account is signed in but not on admin allowlist.</Text>
      <Text style={st.infoBody}>
        Set EXPO_PUBLIC_ADMIN_EMAILS with comma-separated admin emails.
      </Text>
      <View style={st.inlineRow}>
        <Pressable accessibilityRole="button" onPress={onSignOut} style={[st.btn, st.btnGhost]}>
          <Text style={st.btnGhostText}>Sign Out</Text>
        </Pressable>
        <WebLink href="/" onPress={onBack}>
          <View style={[st.btn, st.btnGhost]}>
            <Text style={st.btnGhostText}>Back Home</Text>
          </View>
        </WebLink>
      </View>
    </View>
  );
}
