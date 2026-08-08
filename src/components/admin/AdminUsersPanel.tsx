import React from "react";
import {
  ActivityIndicator, Platform, Pressable, ScrollView, Text, TextInput, View,
} from "react-native";
import { marketingPalette as C } from "../../shared/design/palette";
import type { AdminDirectoryUser } from "../../services/adminBackoffice";
import {
  filterAdminDirectoryUsers,
  summarizeAdminDirectoryUsers,
  type AdminUserProfileFilter,
  type AdminUserRoleFilter,
} from "../../utils/adminUserDirectory";
import {
  buildAdminProductPagination,
  type AdminProductPageSize,
} from "../../utils/adminProductPagination";
import { WEB_FILTER_SELECT_STYLE } from "../../utils/adminScreenHelpers";
import AdminProductPagination from "./AdminProductPagination";
import AdminUserDirectoryCard from "./AdminUserDirectoryCard";

type Props = {
  users: AdminDirectoryUser[];
  loading: boolean;
  styles: Record<string, any>;
};

function SummaryCard({ label, value, hint, styles: st }: {
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
  const [profileFilter, setProfileFilter] = React.useState<AdminUserProfileFilter>("all");
  const [pageSize, setPageSize] = React.useState<AdminProductPageSize>(20);
  const [requestedPage, setRequestedPage] = React.useState(1);
  const summary = React.useMemo(() => summarizeAdminDirectoryUsers(users), [users]);
  const filteredUsers = React.useMemo(
    () => filterAdminDirectoryUsers(users, searchQuery, roleFilter, profileFilter),
    [profileFilter, roleFilter, searchQuery, users],
  );
  const activeFilterCount = Number(Boolean(searchQuery.trim())) +
    Number(roleFilter !== "all") + Number(profileFilter !== "all");
  const pagination = React.useMemo(
    () => buildAdminProductPagination(filteredUsers.length, requestedPage, pageSize),
    [filteredUsers.length, pageSize, requestedPage],
  );
  const pageUsers = React.useMemo(
    () => filteredUsers.slice(pagination.startIndex, pagination.endIndex),
    [filteredUsers, pagination.endIndex, pagination.startIndex],
  );

  React.useEffect(() => setRequestedPage(1), [profileFilter, roleFilter, searchQuery]);
  React.useEffect(() => {
    if (requestedPage !== pagination.page) setRequestedPage(pagination.page);
  }, [pagination.page, requestedPage]);

  const paginationProps = {
    page: pagination.page,
    pageCount: pagination.pageCount,
    pageSize,
    rangeStart: pagination.rangeStart,
    rangeEnd: pagination.rangeEnd,
    totalItems: filteredUsers.length,
    itemLabel: "users",
    styles: st,
    onPageChange: setRequestedPage,
    onPageSizeChange: (value: AdminProductPageSize) => {
      setPageSize(value);
      setRequestedPage(1);
    },
  };

  return (
    <View style={st.userDirectoryStack}>
      <Text style={st.userDirectoryIntro}>
        Read-only account, profile, and shopping activity summaries. Passwords,
        authentication secrets, and device tokens are never shown.
      </Text>

      <View style={st.statGrid}>
        <SummaryCard label="Registered" value={summary.total} hint="All authentication accounts" styles={st} />
        <SummaryCard label="Admins" value={summary.admins} hint="Accounts with admin access" styles={st} />
        <SummaryCard label="Profiles complete" value={summary.completedProfiles} hint="Onboarding preferences saved" styles={st} />
        <SummaryCard label="Push enabled" value={summary.pushEnabled} hint="Accounts with an active device" styles={st} />
      </View>

      <View style={st.productFilterCard}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.productFilterInlineRow}>
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
              onChange={(event) => setRoleFilter((event.target as HTMLSelectElement).value as AdminUserRoleFilter)}
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
              onChange={(event) => setProfileFilter((event.target as HTMLSelectElement).value as AdminUserProfileFilter)}
              style={WEB_FILTER_SELECT_STYLE}
            >
              <option value="all">Profile: All</option>
              <option value="complete">Complete</option>
              <option value="incomplete">Incomplete</option>
            </select>
          ) : null}
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setSearchQuery("");
              setRoleFilter("all");
              setProfileFilter("all");
            }}
            style={[st.btn, st.btnGhost, activeFilterCount === 0 && st.btnDisabled]}
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

      {filteredUsers.length > 0 ? <AdminProductPagination {...paginationProps} /> : null}
      {loading && users.length === 0 ? (
        <View style={st.userDirectoryLoading}>
          <ActivityIndicator color={C.primaryDark} />
          <Text style={st.dataMuted}>Loading user directory…</Text>
        </View>
      ) : filteredUsers.length === 0 ? (
        <View style={st.emptyStateCard}>
          <Text style={st.emptyStateTitle}>{users.length === 0 ? "No registered users yet" : "No users match"}</Text>
          <Text style={st.dataMuted}>
            {users.length === 0 ? "New accounts will appear here after registration." : "Try changing or resetting the filters."}
          </Text>
        </View>
      ) : (
        <View style={st.userDirectoryGrid}>
          {pageUsers.map((user) => <AdminUserDirectoryCard key={user.id} user={user} styles={st} />)}
        </View>
      )}
      {filteredUsers.length > 0 ? <AdminProductPagination {...paginationProps} compact /> : null}
    </View>
  );
}
