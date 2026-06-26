import React from "react";
import { Linking, Pressable, Text, TextInput, View } from "react-native";
import type { UserProfile } from "../../services/userProfile";
import { hasSupabaseEnv } from "../../services/supabaseClient";
import { marketingPalette as C } from "../../shared/design/palette";
import { st } from "../../screens/nativeAppStyles";

const PRIVACY_URL = "https://pocketcart.pages.dev/privacy";
const TERMS_URL = "https://pocketcart.pages.dev/terms";
const SUPPORT_URL = "https://pocketcart.pages.dev/support";
const DELETE_ACCOUNT_URL = "https://pocketcart.pages.dev/delete-account";

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
  deleteConfirming: boolean;
  deletingAccount: boolean;
  onRefreshProfile: () => void;
  onChangeAuthMode: (mode: "signIn" | "signUp") => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onSignUp: () => void;
  onStartDeleteAccount: () => void;
  onCancelDeleteAccount: () => void;
  onConfirmDeleteAccount: () => void;
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
      <AccountDeletionCard {...props} />
      <LegalLinksCard />

      {props.message ? (
        <View style={st.rowCard}>
          <Text style={st.itemMeta}>{props.message}</Text>
        </View>
      ) : null}
    </View>
  );
}

function openExternalUrl(url: string) {
  void Linking.openURL(url);
}

function AccountDeletionCard({
  profile,
  deleteConfirming,
  deletingAccount,
  onStartDeleteAccount,
  onCancelDeleteAccount,
  onConfirmDeleteAccount,
}: MorePanelProps) {
  const signedInEmail = profile?.email ?? null;

  return (
    <View style={st.rowCard}>
      <Text style={st.itemName}>Account deletion</Text>
      <Text style={st.itemMeta}>
        {signedInEmail
          ? `Request deletion for ${signedInEmail}. We delete account-linked data unless retention is required for security or legal reasons.`
          : "Sign in first if you want your request matched to your account email."}
      </Text>
      {signedInEmail ? (
        deleteConfirming ? (
          <>
            <Text style={st.destructiveWarning}>
              This permanently deletes your account profile and saved watchlist data.
            </Text>
            <View style={st.authActionRow}>
              <Pressable
                accessibilityRole="button"
                onPress={onCancelDeleteAccount}
                style={[st.authBtn, st.authBtnSecondary, st.legalActionBtn]}
                disabled={deletingAccount}
              >
                <Text style={st.authBtnSecondaryText}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={onConfirmDeleteAccount}
                style={[st.authBtn, st.authBtnDanger, st.legalActionBtn]}
                disabled={deletingAccount}
              >
                <Text style={st.authBtnDangerText}>
                  {deletingAccount ? "Deleting..." : "Confirm Delete"}
                </Text>
              </Pressable>
            </View>
          </>
        ) : (
          <View style={st.authActionRow}>
            <Pressable
              accessibilityRole="button"
              onPress={onStartDeleteAccount}
              style={[st.authBtn, st.authBtnDanger, st.legalActionBtn]}
              disabled={deletingAccount}
            >
              <Text style={st.authBtnDangerText}>Delete Account</Text>
            </Pressable>
          </View>
        )
      ) : (
        <View style={st.authActionRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() => openExternalUrl(DELETE_ACCOUNT_URL)}
            style={[st.authBtn, st.authBtnSecondary, st.legalActionBtn]}
          >
            <Text style={st.authBtnSecondaryText}>Open Deletion Portal</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function LegalLinksCard() {
  return (
    <View style={st.rowCard}>
      <Text style={st.itemName}>Legal</Text>
      <Text style={st.itemMeta}>Privacy, terms, and data deletion resources.</Text>
      <View style={st.legalLinkRow}>
        <Pressable
          accessibilityRole="link"
          onPress={() => openExternalUrl(PRIVACY_URL)}
          style={[st.authBtn, st.authBtnSecondary, st.legalActionBtn]}
        >
          <Text style={st.authBtnSecondaryText}>Privacy</Text>
        </Pressable>
        <Pressable
          accessibilityRole="link"
          onPress={() => openExternalUrl(TERMS_URL)}
          style={[st.authBtn, st.authBtnSecondary, st.legalActionBtn]}
        >
          <Text style={st.authBtnSecondaryText}>Terms</Text>
        </Pressable>
        <Pressable
          accessibilityRole="link"
          onPress={() => openExternalUrl(SUPPORT_URL)}
          style={[st.authBtn, st.authBtnSecondary, st.legalActionBtn]}
        >
          <Text style={st.authBtnSecondaryText}>Support</Text>
        </Pressable>
      </View>
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
