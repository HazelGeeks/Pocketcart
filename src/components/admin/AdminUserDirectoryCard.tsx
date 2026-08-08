import React from "react";
import { Text, View } from "react-native";
import type { AdminDirectoryUser } from "../../services/adminBackoffice";
import { shoppingFrequencyLabel } from "../../utils/adminUserDirectory";
import AdminTechnicalDetails from "./AdminTechnicalDetails";

function formatDateTime(value: string | null): string {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unavailable";
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function AdminUserDirectoryCard({
  user,
  styles: st,
}: {
  user: AdminDirectoryUser;
  styles: Record<string, any>;
}) {
  return (
    <View style={st.userDirectoryCard}>
      <View style={st.userDirectoryCardHeader}>
        <View style={st.userDirectoryIdentity}>
          <Text style={st.userDirectoryName}>{user.full_name || "Name not provided"}</Text>
          <Text selectable style={st.userDirectoryEmail}>{user.email || "Email unavailable"}</Text>
        </View>
        <View style={st.userDirectoryStatusRow}>
          <View style={[st.userDirectoryStatusChip, user.is_admin && st.userDirectoryStatusChipAdmin]}>
            <Text style={st.userDirectoryStatusText}>{user.is_admin ? "Admin" : "Customer"}</Text>
          </View>
          <View style={[
            st.userDirectoryStatusChip,
            user.email_confirmed_at
              ? st.userDirectoryStatusChipSuccess
              : st.userDirectoryStatusChipWarning,
          ]}>
            <Text style={st.userDirectoryStatusText}>
              {user.email_confirmed_at ? "Email verified" : "Email pending"}
            </Text>
          </View>
        </View>
      </View>

      <View style={st.userDirectoryMetaGrid}>
        <View>
          <Text style={st.userDirectoryMetaLabel}>Joined</Text>
          <Text style={st.userDirectoryMetaValue}>{formatDateTime(user.created_at)}</Text>
        </View>
        <View>
          <Text style={st.userDirectoryMetaLabel}>Last sign-in</Text>
          <Text style={st.userDirectoryMetaValue}>{formatDateTime(user.last_sign_in_at)}</Text>
        </View>
        <View>
          <Text style={st.userDirectoryMetaLabel}>Shopping cadence</Text>
          <Text style={st.userDirectoryMetaValue}>{shoppingFrequencyLabel(user.shopping_frequency)}</Text>
        </View>
        <View>
          <Text style={st.userDirectoryMetaLabel}>Profile</Text>
          <Text style={st.userDirectoryMetaValue}>{user.preferences_completed ? "Complete" : "Incomplete"}</Text>
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
        <Text style={st.userDirectoryActivityText}>Watchlist {user.watchlist_count}</Text>
        <Text style={st.userDirectoryActivityText}>Shopping list {user.shopping_list_count}</Text>
        <Text style={st.userDirectoryActivityText}>Alerts {user.sale_alert_count}</Text>
        <Text style={st.userDirectoryActivityText}>Active devices {user.active_push_token_count}</Text>
      </View>

      <AdminTechnicalDetails
        accessibilityContext={user.email || user.id}
        items={[{ key: "user-id", label: "User ID", value: user.id }]}
        styles={st}
      />
    </View>
  );
}
