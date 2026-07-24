import React from "react";
import {
  ActivityIndicator, Platform, Pressable, ScrollView, Text, TextInput, View,
} from "react-native";
import { marketingPalette as C } from "../../shared/design/palette";
import type { AdminDirectoryUser } from "../../services/adminBackoffice";
import {
  filterAdminDirectoryUsers, shoppingFrequencyLabel,
  summarizeAdminDirectoryUsers, type AdminUserProfileFilter,
  type AdminUserRoleFilter,
} from "../../utils/adminUserDirectory";
import { WEB_FILTER_SELECT_STYLE } from "../../utils/adminScreenHelpers";
import AdminTechnicalDetails from "./AdminTechnicalDetails";

type Props = {
  users: AdminDirectoryUser[];
  loading: boolean;
  styles: Record<string, any>;
};

function formatDateTime(value: string | null): string {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unavailable";
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function SummaryCard({
  label,
  value,
  hint,
  styles: st,
}: {
  label: string;
  value: number;
  hint: string;
  styles: Record<string, any>;
}) {
  return (
    <View style={st.statCard}>
      <Text style={st.statLabel}>{label}</Text>
      <Text style={st.statValue}>{value}</Text>
      <Text style={st.statHint}>{hint}</Text>
    </View>
  );
}

export default function AdminUsersPanel({ users, loading, styles: st }: Props) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<AdminUserRoleFilter>("all");
  const [profileFilter, setProfileFilter] =
    React.useState<AdminUserProfileFilter>("all");
  const summary = React.useMemo(() => summarizeAdminDirectoryUsers(users), [users]);
  const filteredUsers = React.useMemo(
    () =>
      filterAdminDirectoryUsers(
        users,
        searchQuery,
        roleFilter,
        profileFilter,
      ),
    [profileFilter, roleFilter, searchQuery, users],
  );
  const activeFilterCount =
    Number(Boolean(searchQuery.trim())) +
    Number(roleFilter !== "all") +
    Number(profileFilter !== "all");

  const resetFilters = React.useCallback(() => {
    setSearchQuery("");
    setRoleFilter("all");
    setProfileFilter("all");
  }, []);

  return (
    <View style={st.userDirectoryStack}>
      <Text style={st.userDirectoryIntro}>
        Read-only account, profile, and shopping activity summaries. Passwords,
        authentication secrets, and device tokens are never shown.
      </Text>

      <View style={st.statGrid}>
        <SummaryCard
          label="Registered"
          value={summary.total}
          hint="All authentication accounts"
          styles={st}
        />
        <SummaryCard
          label="Admins"
          value={summary.admins}
          hint="Accounts with admin access"
          styles={st}
        />
        <SummaryCard
          label="Profiles complete"
          value={summary.completedProfiles}
          hint="Onboarding preferences saved"
          styles={st}
        />
        <SummaryCard
          label="Push enabled"
          value={summary.pushEnabled}
          hint="Accounts with an active device"
          styles={st}
        />
      </View>

      <View style={st.productFilterCard}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={st.productFilterInlineRow}
        >
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search name, email, user ID, interest, or store"
            placeholderTextColor={C.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            style={[st.input, st.userDirectorySearch]}
          />
          {Platform.OS === "web" ? (
            <select
              aria-label="User role filter"
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(
                  (event.target as HTMLSelectElement)
                    .value as AdminUserRoleFilter,
                )
              }
              style={WEB_FILTER_SELECT_STYLE}
            >
              <option value="all">Role: All</option>
              <option value="admin">Admins</option>
              <option value="customer">Customers</option>
            </select>
          ) : null}
          {Platform.OS === "web" ? (
            <select
              aria-label="Profile status filter"
              value={profileFilter}
              onChange={(event) =>
                setProfileFilter(
                  (event.target as HTMLSelectElement)
                    .value as AdminUserProfileFilter,
                )
              }
              style={WEB_FILTER_SELECT_STYLE}
            >
              <option value="all">Profile: All</option>
              <option value="complete">Complete</option>
              <option value="incomplete">Incomplete</option>
            </select>
          ) : null}
          <Pressable
            accessibilityRole="button"
            onPress={resetFilters}
            style={[
              st.btn,
              st.btnGhost,
              activeFilterCount === 0 && st.btnDisabled,
            ]}
            disabled={activeFilterCount === 0}
          >
            <Text style={st.btnGhostText}>Reset</Text>
          </Pressable>
        </ScrollView>
        <Text style={st.dataMuted}>
          Showing {filteredUsers.length} / {users.length} users
          {activeFilterCount ? ` | Filters ${activeFilterCount}` : ""}
        </Text>
      </View>

      {loading && users.length === 0 ? (
        <View style={st.userDirectoryLoading}>
          <ActivityIndicator color={C.primaryDark} />
          <Text style={st.dataMuted}>Loading user directory…</Text>
        </View>
      ) : filteredUsers.length === 0 ? (
        <View style={st.emptyStateCard}>
          <Text style={st.emptyStateTitle}>
            {users.length === 0 ? "No registered users yet" : "No users match"}
          </Text>
          <Text style={st.dataMuted}>
            {users.length === 0
              ? "New accounts will appear here after registration."
              : "Try changing or resetting the filters."}
          </Text>
        </View>
      ) : (
        <View style={st.userDirectoryGrid}>
          {filteredUsers.map((user) => (
            <View key={user.id} style={st.userDirectoryCard}>
              <View style={st.userDirectoryCardHeader}>
                <View style={st.userDirectoryIdentity}>
                  <Text style={st.userDirectoryName}>
                    {user.full_name || "Name not provided"}
                  </Text>
                  <Text selectable style={st.userDirectoryEmail}>
                    {user.email || "Email unavailable"}
                  </Text>
                </View>
                <View style={st.userDirectoryStatusRow}>
                  <View
                    style={[
                      st.userDirectoryStatusChip,
                      user.is_admin && st.userDirectoryStatusChipAdmin,
                    ]}
                  >
                    <Text style={st.userDirectoryStatusText}>
                      {user.is_admin ? "Admin" : "Customer"}
                    </Text>
                  </View>
                  <View
                    style={[
                      st.userDirectoryStatusChip,
                      user.email_confirmed_at
                        ? st.userDirectoryStatusChipSuccess
                        : st.userDirectoryStatusChipWarning,
                    ]}
                  >
                    <Text style={st.userDirectoryStatusText}>
                      {user.email_confirmed_at ? "Email verified" : "Email pending"}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={st.userDirectoryMetaGrid}>
                <View>
                  <Text style={st.userDirectoryMetaLabel}>Joined</Text>
                  <Text style={st.userDirectoryMetaValue}>
                    {formatDateTime(user.created_at)}
                  </Text>
                </View>
                <View>
                  <Text style={st.userDirectoryMetaLabel}>Last sign-in</Text>
                  <Text style={st.userDirectoryMetaValue}>
                    {formatDateTime(user.last_sign_in_at)}
                  </Text>
                </View>
                <View>
                  <Text style={st.userDirectoryMetaLabel}>Shopping cadence</Text>
                  <Text style={st.userDirectoryMetaValue}>
                    {shoppingFrequencyLabel(user.shopping_frequency)}
                  </Text>
                </View>
                <View>
                  <Text style={st.userDirectoryMetaLabel}>Profile</Text>
                  <Text style={st.userDirectoryMetaValue}>
                    {user.preferences_completed ? "Complete" : "Incomplete"}
                  </Text>
                </View>
              </View>

              <View style={st.userDirectoryPreferenceGroup}>
                <Text style={st.userDirectoryMetaLabel}>Interests</Text>
                <Text style={st.userDirectoryMetaValue}>
                  {user.interested_categories.join(", ") || "Not provided"}
                </Text>
                <Text style={st.userDirectoryMetaLabel}>Favorite stores</Text>
                <Text style={st.userDirectoryMetaValue}>
                  {user.favorite_stores.join(", ") || "Not provided"}
                </Text>
              </View>

              <View style={st.userDirectoryActivityRow}>
                <Text style={st.userDirectoryActivityText}>
                  Watchlist {user.watchlist_count}
                </Text>
                <Text style={st.userDirectoryActivityText}>
                  Shopping list {user.shopping_list_count}
                </Text>
                <Text style={st.userDirectoryActivityText}>
                  Alerts {user.sale_alert_count}
                </Text>
                <Text style={st.userDirectoryActivityText}>
                  Active devices {user.active_push_token_count}
                </Text>
              </View>

              <AdminTechnicalDetails
                accessibilityContext={user.email || user.id}
                items={[{ key: "user-id", label: "User ID", value: user.id }]}
                styles={st}
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
