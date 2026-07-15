import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import type { UserProfile } from "../../services/userProfile";
import { marketingPalette as C } from "../../shared/design/palette";
import { st } from "../../screens/nativeAppStyles";

export function EmailVerificationPanel({
  email,
  onContinue,
  onLater,
}: {
  email: string;
  onContinue: () => void;
  onLater: () => void;
}) {
  return (
    <View style={st.authPage}>
      <View style={st.flowHeroCard}>
        <View style={st.flowHeroIcon}><Text style={st.flowHeroIconText}>✓</Text></View>
        <Text style={st.authTitle}>Check your email</Text>
        <Text style={st.authDescription}>
          We sent a verification link to {email || "your email address"}. Open it to finish securing your account.
        </Text>
      </View>
      <View style={st.authCard}>
        <Text style={st.settingsRowTitle}>While you wait</Text>
        <Text style={st.settingsHelp}>
          You can answer three optional questions now, or finish them later from Account & Settings.
        </Text>
        <Pressable accessibilityRole="button" onPress={onContinue} style={[st.settingsButton, st.settingsButtonPrimary]}>
          <Text style={st.settingsButtonPrimaryText}>Continue to Shopping Profile</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onLater} style={st.authTextButton}>
          <Text style={st.authTextButtonLabel}>I'll do this later</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function EditProfilePanel({
  profile,
  loading,
  message,
  onSave,
}: {
  profile: UserProfile;
  loading: boolean;
  message: string | null;
  onSave: (name: string, email: string) => void;
}) {
  const [name, setName] = React.useState(profile.full_name ?? "");
  const [email, setEmail] = React.useState(profile.email);

  return (
    <View style={st.authPage}>
      <View style={st.authIntro}>
        <Text style={st.authTitle}>Edit profile</Text>
        <Text style={st.authDescription}>Update the name and email associated with your PocketCart account.</Text>
      </View>
      <View style={st.authCard}>
        {message ? <View style={st.settingsMessage} accessibilityRole="alert"><Text style={st.settingsMessageText}>{message}</Text></View> : null}
        <View style={st.authField}>
          <Text style={st.authFieldLabel}>Name</Text>
          <TextInput accessibilityLabel="Name" value={name} onChangeText={setName} autoCapitalize="words" textContentType="name" style={st.settingsInput} />
        </View>
        <View style={st.authField}>
          <Text style={st.authFieldLabel}>Email</Text>
          <TextInput accessibilityLabel="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" style={st.settingsInput} />
        </View>
        <Text style={st.settingsHelp}>Changing your email may require confirmation from both addresses.</Text>
        <Pressable accessibilityRole="button" onPress={() => onSave(name, email)} style={[st.settingsButton, st.settingsButtonPrimary]} disabled={loading}>
          <Text style={st.settingsButtonPrimaryText}>{loading ? "Saving..." : "Save Changes"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function ResetPasswordPanel({
  loading,
  message,
  onSave,
}: {
  loading: boolean;
  message: string | null;
  onSave: (password: string) => void;
}) {
  const [password, setPassword] = React.useState("");
  const [confirmation, setConfirmation] = React.useState("");
  const localMessage = password && confirmation && password !== confirmation ? "Passwords do not match." : null;

  return (
    <View style={st.authPage}>
      <View style={st.authIntro}>
        <Text style={st.authTitle}>Set a new password</Text>
        <Text style={st.authDescription}>Choose a password with at least 8 characters.</Text>
      </View>
      <View style={st.authCard}>
        {message || localMessage ? <View style={st.settingsMessage} accessibilityRole="alert"><Text style={st.settingsMessageText}>{message ?? localMessage}</Text></View> : null}
        <View style={st.authField}>
          <Text style={st.authFieldLabel}>New password</Text>
          <TextInput accessibilityLabel="New password" value={password} onChangeText={setPassword} secureTextEntry textContentType="newPassword" autoComplete="new-password" placeholder="At least 8 characters" placeholderTextColor={C.textMuted} style={st.settingsInput} />
        </View>
        <View style={st.authField}>
          <Text style={st.authFieldLabel}>Confirm password</Text>
          <TextInput accessibilityLabel="Confirm new password" value={confirmation} onChangeText={setConfirmation} secureTextEntry textContentType="newPassword" autoComplete="new-password" placeholder="Enter it again" placeholderTextColor={C.textMuted} style={st.settingsInput} />
        </View>
        <Pressable accessibilityRole="button" onPress={() => onSave(password)} style={[st.settingsButton, st.settingsButtonPrimary]} disabled={loading || password.length < 8 || password !== confirmation}>
          <Text style={st.settingsButtonPrimaryText}>{loading ? "Updating..." : "Update Password"}</Text>
        </Pressable>
      </View>
    </View>
  );
}
