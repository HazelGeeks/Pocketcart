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
  adminMessage: string | null;
  signUpName: string;
  signUpEmail: string;
  signUpPassword: string;
  adminProductName: string;
  adminProductCategory: string;
  adminProductThumb: string;
  adminStoreName: string;
  adminStoreArea: string;
  adminStoreLat: string;
  adminStoreLng: string;
  adminStoreNote: string;
  adminPriceProductId: string;
  adminPriceStoreId: string;
  adminPriceValue: string;
  adminPriceObservedAt: string;
  adminSubmitting: boolean;
  onRefreshProfile: () => void;
  onSignOut: () => void;
  onSignUp: () => void;
  onChangeSignUpName: (value: string) => void;
  onChangeSignUpEmail: (value: string) => void;
  onChangeSignUpPassword: (value: string) => void;
  onChangeAdminProductName: (value: string) => void;
  onChangeAdminProductCategory: (value: string) => void;
  onChangeAdminProductThumb: (value: string) => void;
  onChangeAdminStoreName: (value: string) => void;
  onChangeAdminStoreArea: (value: string) => void;
  onChangeAdminStoreLat: (value: string) => void;
  onChangeAdminStoreLng: (value: string) => void;
  onChangeAdminStoreNote: (value: string) => void;
  onChangeAdminPriceProductId: (value: string) => void;
  onChangeAdminPriceStoreId: (value: string) => void;
  onChangeAdminPriceValue: (value: string) => void;
  onChangeAdminPriceObservedAt: (value: string) => void;
  onCreateProduct: () => void;
  onCreateStore: () => void;
  onCreatePrice: () => void;
};

export function MorePanel(props: MorePanelProps) {
  return (
    <View style={st.sectionStack}>
      <Text style={st.sectionTitle}>More</Text>
      <Text style={st.sectionSub}>Create account and manage your profile/data.</Text>

      <ProfileCard {...props} />
      {props.profile ? <AdminDataEntryCard {...props} /> : null}

      {props.message ? (
        <View style={st.rowCard}>
          <Text style={st.itemMeta}>{props.message}</Text>
        </View>
      ) : null}

      {props.adminMessage ? (
        <View style={st.rowCard}>
          <Text style={st.itemMeta}>{props.adminMessage}</Text>
        </View>
      ) : null}
    </View>
  );
}

function ProfileCard({
  profile,
  loading,
  signUpName,
  signUpEmail,
  signUpPassword,
  onRefreshProfile,
  onSignOut,
  onSignUp,
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
      <Text style={st.itemName}>Sign Up</Text>
      <Text style={st.itemMeta}>Create your account with email and password.</Text>

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
    </View>
  );
}

function AdminDataEntryCard({
  adminProductName,
  adminProductCategory,
  adminProductThumb,
  adminStoreName,
  adminStoreArea,
  adminStoreLat,
  adminStoreLng,
  adminStoreNote,
  adminPriceProductId,
  adminPriceStoreId,
  adminPriceValue,
  adminPriceObservedAt,
  adminSubmitting,
  onChangeAdminProductName,
  onChangeAdminProductCategory,
  onChangeAdminProductThumb,
  onChangeAdminStoreName,
  onChangeAdminStoreArea,
  onChangeAdminStoreLat,
  onChangeAdminStoreLng,
  onChangeAdminStoreNote,
  onChangeAdminPriceProductId,
  onChangeAdminPriceStoreId,
  onChangeAdminPriceValue,
  onChangeAdminPriceObservedAt,
  onCreateProduct,
  onCreateStore,
  onCreatePrice,
}: MorePanelProps) {
  return (
    <View style={st.rowCard}>
      <Text style={st.itemName}>Admin Data Entry (MVP)</Text>
      <Text style={st.itemMeta}>Add product, store, and price records manually.</Text>

      <Text style={st.adminTitle}>Create Product</Text>
      <TextInput
        value={adminProductName}
        onChangeText={onChangeAdminProductName}
        placeholder="Product name"
        placeholderTextColor={C.textMuted}
        style={st.formInput}
      />
      <TextInput
        value={adminProductCategory}
        onChangeText={onChangeAdminProductCategory}
        placeholder="Category"
        placeholderTextColor={C.textMuted}
        style={st.formInput}
      />
      <TextInput
        value={adminProductThumb}
        onChangeText={onChangeAdminProductThumb}
        placeholder="Thumbnail URL (optional)"
        placeholderTextColor={C.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        style={st.formInput}
      />
      <Pressable
        accessibilityRole="button"
        onPress={onCreateProduct}
        style={[st.authBtn, st.authBtnSecondary]}
        disabled={adminSubmitting}
      >
        <Text style={st.authBtnSecondaryText}>Save Product</Text>
      </Pressable>

      <Text style={st.adminTitle}>Create Store</Text>
      <TextInput
        value={adminStoreName}
        onChangeText={onChangeAdminStoreName}
        placeholder="Store name"
        placeholderTextColor={C.textMuted}
        style={st.formInput}
      />
      <TextInput
        value={adminStoreArea}
        onChangeText={onChangeAdminStoreArea}
        placeholder="Area"
        placeholderTextColor={C.textMuted}
        style={st.formInput}
      />
      <TextInput
        value={adminStoreLat}
        onChangeText={onChangeAdminStoreLat}
        placeholder="Latitude"
        placeholderTextColor={C.textMuted}
        keyboardType="decimal-pad"
        style={st.formInput}
      />
      <TextInput
        value={adminStoreLng}
        onChangeText={onChangeAdminStoreLng}
        placeholder="Longitude"
        placeholderTextColor={C.textMuted}
        keyboardType="decimal-pad"
        style={st.formInput}
      />
      <TextInput
        value={adminStoreNote}
        onChangeText={onChangeAdminStoreNote}
        placeholder="Price note (optional)"
        placeholderTextColor={C.textMuted}
        style={st.formInput}
      />
      <Pressable
        accessibilityRole="button"
        onPress={onCreateStore}
        style={[st.authBtn, st.authBtnSecondary]}
        disabled={adminSubmitting}
      >
        <Text style={st.authBtnSecondaryText}>Save Store</Text>
      </Pressable>

      <Text style={st.adminTitle}>Create Price Entry</Text>
      <TextInput
        value={adminPriceProductId}
        onChangeText={onChangeAdminPriceProductId}
        placeholder="Product ID"
        placeholderTextColor={C.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        style={st.formInput}
      />
      <TextInput
        value={adminPriceStoreId}
        onChangeText={onChangeAdminPriceStoreId}
        placeholder="Store ID"
        placeholderTextColor={C.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        style={st.formInput}
      />
      <TextInput
        value={adminPriceValue}
        onChangeText={onChangeAdminPriceValue}
        placeholder="Price"
        placeholderTextColor={C.textMuted}
        keyboardType="decimal-pad"
        style={st.formInput}
      />
      <TextInput
        value={adminPriceObservedAt}
        onChangeText={onChangeAdminPriceObservedAt}
        placeholder="Observed at (optional, ISO date)"
        placeholderTextColor={C.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        style={st.formInput}
      />
      <Pressable
        accessibilityRole="button"
        onPress={onCreatePrice}
        style={[st.authBtn, st.authBtnSecondary]}
        disabled={adminSubmitting}
      >
        <Text style={st.authBtnSecondaryText}>Save Price Entry</Text>
      </Pressable>
    </View>
  );
}
