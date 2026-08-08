import React from "react";
import { Pressable, Text, View } from "react-native";
import type { AdminDirectoryUser } from "../../services/adminBackoffice";
import { shoppingFrequencyLabel } from "../../utils/adminUserDirectory";
import { AdminTechnicalDetailsPanel } from "./AdminTechnicalDetails";

function formatDateTime(value: string | null): string {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unavailable";
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function LabelValue({ label, value, styles: st }: {
  label: string;
  value: string;
  styles: Record<string, any>;
}) {
  return (
    <View style={st.userDirectoryLabelValue}>
      <Text style={st.userDirectoryMetaLabel}>{label}</Text>
      <Text style={st.userDirectoryMetaValue}>{value}</Text>
    </View>
  );
}

export default function AdminUserDirectoryRow({
  user,
  compact,
  styles: st,
}: {
  user: AdminDirectoryUser;
  compact: boolean;
  styles: Record<string, any>;
}) {
  const [detailsExpanded, setDetailsExpanded] = React.useState(false);

  return (
    <View style={st.userDirectoryRow}>
      <View style={[st.userDirectoryRowMain, compact && st.userDirectoryRowMainCompact]}>
        <View style={[st.userDirectoryUserColumn, compact && st.userDirectoryColumnCompact]}>
          <View style={st.userDirectoryIdentityHeader}>
            <View style={st.userDirectoryIdentity}>
              <Text numberOfLines={1} style={st.userDirectoryName}>
                {user.full_name || "Name not provided"}
              </Text>
              <Text numberOfLines={1} selectable style={st.userDirectoryEmail}>
                {user.email || "Email unavailable"}
              </Text>
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
          <View style={st.userDirectoryPreferencesInline}>
            <Text numberOfLines={compact ? 2 : 1} style={st.userDirectoryPreferenceText}>
              <Text style={st.userDirectoryPreferenceLabel}>Interests </Text>
              {user.interested_categories.join(", ") || "Not provided"}
            </Text>
            <Text numberOfLines={compact ? 2 : 1} style={st.userDirectoryPreferenceText}>
              <Text style={st.userDirectoryPreferenceLabel}>Stores </Text>
              {user.favorite_stores.join(", ") || "Not provided"}
            </Text>
          </View>
        </View>

        <View style={[st.userDirectoryAccountColumn, compact && st.userDirectoryCompactMetric]}>
          <LabelValue label="Joined" value={formatDateTime(user.created_at)} styles={st} />
          <LabelValue label="Last sign-in" value={formatDateTime(user.last_sign_in_at)} styles={st} />
        </View>

        <View style={[st.userDirectoryProfileColumn, compact && st.userDirectoryCompactMetric]}>
          <LabelValue
            label="Shopping cadence"
            value={shoppingFrequencyLabel(user.shopping_frequency)}
            styles={st}
          />
          <LabelValue
            label="Profile"
            value={user.preferences_completed ? "Complete" : "Incomplete"}
            styles={st}
          />
        </View>

        <View style={[st.userDirectoryActivityColumn, compact && st.userDirectoryActivityColumnCompact]}>
          <Text style={st.userDirectoryActivityText}>Watchlist {user.watchlist_count}</Text>
          <Text style={st.userDirectoryActivityText}>Shopping list {user.shopping_list_count}</Text>
          <Text style={st.userDirectoryActivityText}>Alerts {user.sale_alert_count}</Text>
          <Text style={st.userDirectoryActivityText}>Active devices {user.active_push_token_count}</Text>
        </View>

        <View style={[st.userDirectoryActionsColumn, compact && st.userDirectoryActionsColumnCompact]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${detailsExpanded ? "Hide" : "Show"} technical details for ${user.email || user.id}`}
            accessibilityState={{ expanded: detailsExpanded }}
            onPress={() => setDetailsExpanded((current) => !current)}
            style={[
              st.btn,
              st.btnGhost,
              st.userDirectoryDetailsButton,
              detailsExpanded && st.userDirectoryDetailsButtonActive,
            ]}
          >
            <Text style={st.btnGhostText}>{detailsExpanded ? "Hide" : "Details"}</Text>
          </Pressable>
        </View>
      </View>

      {detailsExpanded ? (
        <View style={st.userDirectoryDetailsPanel}>
          <AdminTechnicalDetailsPanel
            items={[{ key: "user-id", label: "User ID", value: user.id }]}
            styles={st}
          />
        </View>
      ) : null}
    </View>
  );
}
