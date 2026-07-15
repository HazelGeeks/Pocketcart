import type {
  ProfilePreferences,
  ShoppingFrequency,
} from "../services/profilePreferences";

const VALID_FREQUENCIES = new Set<ShoppingFrequency>([
  "multiple_weekly",
  "weekly",
  "biweekly",
  "monthly",
]);

export type ProfilePreferenceRow = {
  interested_categories: unknown;
  shopping_frequency: unknown;
  favorite_stores: unknown;
  completed_at: unknown;
};

export function normalizeProfilePreferences(
  value: Partial<ProfilePreferences> | null | undefined,
): ProfilePreferences {
  const frequency = value?.shoppingFrequency;

  return {
    interestedCategories: Array.isArray(value?.interestedCategories)
      ? value.interestedCategories.filter((item): item is string => typeof item === "string")
      : [],
    shoppingFrequency: frequency && VALID_FREQUENCIES.has(frequency) ? frequency : null,
    favoriteStores: Array.isArray(value?.favoriteStores)
      ? value.favoriteStores.filter((item): item is string => typeof item === "string")
      : [],
    completed: value?.completed === true,
  };
}

export function profilePreferencesFromRow(row: ProfilePreferenceRow): ProfilePreferences {
  return normalizeProfilePreferences({
    interestedCategories: row.interested_categories as string[] | undefined,
    shoppingFrequency: row.shopping_frequency as ShoppingFrequency | undefined,
    favoriteStores: row.favorite_stores as string[] | undefined,
    completed: typeof row.completed_at === "string" && row.completed_at.length > 0,
  });
}
