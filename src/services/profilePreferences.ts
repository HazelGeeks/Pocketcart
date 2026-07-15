import { hasSupabaseEnv, supabase } from "./supabaseClient";
import {
  profilePreferencesFromRow,
  type ProfilePreferenceRow,
} from "../utils/profilePreferenceNormalization";

export type ShoppingFrequency =
  | "multiple_weekly"
  | "weekly"
  | "biweekly"
  | "monthly";

export type ProfilePreferences = {
  interestedCategories: string[];
  shoppingFrequency: ShoppingFrequency | null;
  favoriteStores: string[];
  completed: boolean;
};

export const SHOPPING_FREQUENCY_LABELS: Record<ShoppingFrequency, string> = {
  multiple_weekly: "A few times a week",
  weekly: "About once a week",
  biweekly: "Every two weeks",
  monthly: "About once a month",
};

export const EMPTY_PROFILE_PREFERENCES: ProfilePreferences = {
  interestedCategories: [],
  shoppingFrequency: null,
  favoriteStores: [],
  completed: false,
};

type ServiceResult<T> = {
  data: T;
  error: string | null;
};

export async function getProfilePreferences(): Promise<ServiceResult<ProfilePreferences | null>> {
  if (!hasSupabaseEnv || !supabase) return { data: null, error: null };

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return { data: null, error: userError?.message ?? null };
  }

  const { data, error } = await supabase
    .from("profile_preferences")
    .select("interested_categories, shopping_frequency, favorite_stores, completed_at")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  return {
    data: data ? profilePreferencesFromRow(data as ProfilePreferenceRow) : null,
    error: error?.message ?? null,
  };
}

export async function saveProfilePreferences(
  preferences: ProfilePreferences,
): Promise<ServiceResult<ProfilePreferences>> {
  if (!hasSupabaseEnv || !supabase) return { data: preferences, error: null };

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return { data: preferences, error: userError?.message ?? null };
  }

  const { error } = await supabase.from("profile_preferences").upsert({
    user_id: userData.user.id,
    interested_categories: preferences.interestedCategories,
    shopping_frequency: preferences.shoppingFrequency,
    favorite_stores: preferences.favoriteStores,
    completed_at: preferences.completed ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  });

  return { data: preferences, error: error?.message ?? null };
}
