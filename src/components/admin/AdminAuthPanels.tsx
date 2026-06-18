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
  return (
    <View style={st.authCard}>
      <Text style={st.infoTitle}>Admin Sign In</Text>
      <Text style={st.infoBody}>Sign in with your Supabase email/password account.</Text>

      <TextInput
        value={email}
        onChangeText={onEmailChange}
        placeholder="Email"
        placeholderTextColor={C.textMuted}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        style={st.input}
      />
      <TextInput
        value={password}
        onChangeText={onPasswordChange}
        placeholder="Password"
        placeholderTextColor={C.textMuted}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        style={st.input}
      />

      <Pressable
        accessibilityRole="button"
        onPress={onSignIn}
        style={[st.btn, st.btnPrimary]}
        disabled={loading}
      >
        <Text style={st.btnPrimaryText}>{loading ? "Signing in..." : "Sign In"}</Text>
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
