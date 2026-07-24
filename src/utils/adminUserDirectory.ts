import type {
  AdminDirectoryUser,
  AdminDirectoryUserRow,
} from "../services/adminBackoffice/types";

export type AdminUserRoleFilter = "all" | "admin" | "customer";
export type AdminUserProfileFilter = "all" | "complete" | "incomplete";

export type AdminUserDirectorySummary = {
  total: number;
  admins: number;
  completedProfiles: number;
  pushEnabled: number;
};

function optionalText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function textArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function countValue(value: unknown): number {
  const count = Number(value);
  return Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
}

export function adminDirectoryUserFromRow(
  row: AdminDirectoryUserRow,
): AdminDirectoryUser | null {
  const id = optionalText(row.id);
  const createdAt = optionalText(row.created_at);
  if (!id || !createdAt) return null;

  return {
    id,
    email: optionalText(row.email) ?? "",
    full_name: optionalText(row.full_name),
    created_at: createdAt,
    last_sign_in_at: optionalText(row.last_sign_in_at),
    email_confirmed_at: optionalText(row.email_confirmed_at),
    is_admin: row.is_admin === true,
    preferences_completed: row.preferences_completed === true,
    shopping_frequency: optionalText(row.shopping_frequency),
    interested_categories: textArray(row.interested_categories),
    favorite_stores: textArray(row.favorite_stores),
    watchlist_count: countValue(row.watchlist_count),
    shopping_list_count: countValue(row.shopping_list_count),
    sale_alert_count: countValue(row.sale_alert_count),
    active_push_token_count: countValue(row.active_push_token_count),
  };
}

export function filterAdminDirectoryUsers(
  users: AdminDirectoryUser[],
  searchQuery: string,
  roleFilter: AdminUserRoleFilter,
  profileFilter: AdminUserProfileFilter,
): AdminDirectoryUser[] {
  const needle = searchQuery.trim().toLowerCase();

  return users.filter((user) => {
    if (roleFilter === "admin" && !user.is_admin) return false;
    if (roleFilter === "customer" && user.is_admin) return false;
    if (profileFilter === "complete" && !user.preferences_completed) return false;
    if (profileFilter === "incomplete" && user.preferences_completed) return false;
    if (!needle) return true;

    return [
      user.email,
      user.full_name ?? "",
      user.id,
      user.shopping_frequency ?? "",
      ...user.interested_categories,
      ...user.favorite_stores,
    ].some((value) => value.toLowerCase().includes(needle));
  });
}

export function summarizeAdminDirectoryUsers(
  users: AdminDirectoryUser[],
): AdminUserDirectorySummary {
  return users.reduce<AdminUserDirectorySummary>(
    (summary, user) => ({
      total: summary.total + 1,
      admins: summary.admins + Number(user.is_admin),
      completedProfiles:
        summary.completedProfiles + Number(user.preferences_completed),
      pushEnabled:
        summary.pushEnabled + Number(user.active_push_token_count > 0),
    }),
    { total: 0, admins: 0, completedProfiles: 0, pushEnabled: 0 },
  );
}

export function shoppingFrequencyLabel(value: string | null): string {
  switch (value) {
    case "multiple_weekly":
      return "Several times a week";
    case "weekly":
      return "Weekly";
    case "biweekly":
      return "Every two weeks";
    case "monthly":
      return "Monthly";
    default:
      return "Not provided";
  }
}
