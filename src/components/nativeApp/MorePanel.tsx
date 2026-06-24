import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import type { UserProfile } from "../../services/userProfile";
import { hasSupabaseEnv } from "../../services/supabaseClient";
import { marketingPalette as C } from "../../shared/design/palette";
import { st } from "../../screens/nativeAppStyles";

type MorePanelProps = {
  profile: UserProfile | null;
  loading: boolean;
  message: string | null;
  authMode: "signIn" | "signUp";
  signInEmail: string;
  signInPassword: string;
  signUpName: string;
  signUpEmail: string;
  signUpPassword: string;
  onRefreshProfile: () => void;
  onChangeAuthMode: (mode: "signIn" | "signUp") => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onSignUp: () => void;
  onChangeSignInEmail: (value: string) => void;
  onChangeSignInPassword: (value: string) => void;
  onChangeSignUpName: (value: string) => void;
  onChangeSignUpEmail: (value: string) => void;
  onChangeSignUpPassword: (value: string) => void;
};

export function MorePanel(props: MorePanelProps) {
  return (
    <View style={st.sectionStack}>
      <Text style={st.sectionTitle}>More</Text>
      <Text style={st.sectionSub}>Create account and manage your profile/data.</Text>

      <ProfileCard {...props} />

      {props.message ? (
        <View style={st.rowCard}>
          <Text style={st.itemMeta}>{props.message}</Text>
        </View>
      ) : null}
    </View>
  );
}

function ProfileCard({
  profile,
  loading,
  authMode,
  signInEmail,
  signInPassword,
  signUpName,
  signUpEmail,
  signUpPassword,
  onRefreshProfile,
  onChangeAuthMode,
  onSignIn,
  onSignOut,
  onSignUp,
  onChangeSignInEmail,
  onChangeSignInPassword,
  onChangeSignUpName,
  onChangeSignUpEmail,
  onChangeSignUpPassword,
}: MorePanelProps) {
  if (!hasSupabaseEnv) {
    return (
      <View style={st.rowCard}>
        <Text style={st.itemName}>Supabase configuration required</Text>
        <Text style={st.itemMeta}>
          Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.
        </Text>
      </View>
    );
  }

  if (profile) {
    return (
      <View style={st.rowCard}>
        <Text style={st.itemName}>Profile</Text>
        <Text style={st.itemMeta}>Name: {profile.full_name ?? "-"}</Text>
        <Text style={st.itemMeta}>Email: {profile.email || "-"}</Text>
        <Text style={st.itemMeta}>User ID: {profile.id}</Text>
        <View style={st.authActionRow}>
          <Pressable
            accessibilityRole="button"
            onPress={onRefreshProfile}
            style={[st.authBtn, st.authBtnSecondary]}
            disabled={loading}
          >
            <Text style={st.authBtnSecondaryText}>
              {loading ? "Loading..." : "Refresh"}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onSignOut}
            style={[st.authBtn, st.authBtnPrimary]}
            disabled={loading}
          >
            <Text style={st.authBtnPrimaryText}>Sign Out</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={st.rowCard}>
      <Text style={st.itemName}>{authMode === "signIn" ? "Sign In" : "Sign Up"}</Text>
      <Text style={st.itemMeta}>
        {authMode === "signIn"
          ? "Sign in to manage your watchlist and profile."
          : "Create your account with email and password."}
      </Text>

      <View style={st.authModeRow}>
        <Pressable
          accessibilityRole="button"
          onPress={() => onChangeAuthMode("signIn")}
          style={[st.authModeBtn, authMode === "signIn" && st.authModeBtnActive]}
        >
          <Text style={[st.authModeText, authMode === "signIn" && st.authModeTextActive]}>
            Sign In
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => onChangeAuthMode("signUp")}
          style={[st.authModeBtn, authMode === "signUp" && st.authModeBtnActive]}
        >
          <Text style={[st.authModeText, authMode === "signUp" && st.authModeTextActive]}>
            Sign Up
          </Text>
        </Pressable>
      </View>

      {authMode === "signIn" ? (
        <>
          <TextInput
            value={signInEmail}
            onChangeText={onChangeSignInEmail}
            placeholder="Email"
            placeholderTextColor={C.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={st.formInput}
          />
          <TextInput
            value={signInPassword}
            onChangeText={onChangeSignInPassword}
            placeholder="Password"
            placeholderTextColor={C.textMuted}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            style={st.formInput}
          />
          <Pressable
            accessibilityRole="button"
            onPress={onSignIn}
            style={[st.authBtn, st.authBtnPrimary]}
            disabled={loading}
          >
            <Text style={st.authBtnPrimaryText}>
              {loading ? "Signing in..." : "Sign In"}
            </Text>
          </Pressable>
        </>
      ) : (
        <>

          <TextInput
            value={signUpName}
            onChangeText={onChangeSignUpName}
            placeholder="Name"
            placeholderTextColor={C.textMuted}
            autoCapitalize="words"
            autoCorrect={false}
            style={st.formInput}
          />
          <TextInput
            value={signUpEmail}
            onChangeText={onChangeSignUpEmail}
            placeholder="Email"
            placeholderTextColor={C.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={st.formInput}
          />
          <TextInput
            value={signUpPassword}
            onChangeText={onChangeSignUpPassword}
            placeholder="Password (min 8)"
            placeholderTextColor={C.textMuted}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            style={st.formInput}
          />
          <Pressable
            accessibilityRole="button"
            onPress={onSignUp}
            style={[st.authBtn, st.authBtnPrimary]}
            disabled={loading}
          >
            <Text style={st.authBtnPrimaryText}>
              {loading ? "Creating..." : "Create Account"}
            </Text>
          </Pressable>
        </>
      )}
    </View>
  );
}
