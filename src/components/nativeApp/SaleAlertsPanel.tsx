import React from "react";
import { Pressable, Text, View } from "react-native";
import type { SaleAlert } from "../../services/saleAlerts";
import { st } from "../../screens/nativeAppStyles";

type SaleAlertsPanelProps = {
  alerts: SaleAlert[];
  loading: boolean;
  markingRead: boolean;
  message: string | null;
  unreadCount: number;
  onCheck: () => void;
  onMarkRead: () => void;
};

export function SaleAlertsPanel({
  alerts,
  loading,
  markingRead,
  message,
  unreadCount,
  onCheck,
  onMarkRead,
}: SaleAlertsPanelProps) {
  return (
    <View style={st.sectionStack}>
      <Text style={st.sectionTitle}>Alert</Text>
      <Text style={st.sectionSub}>
        {unreadCount > 0
          ? `${unreadCount} new sale ${unreadCount === 1 ? "alert" : "alerts"}.`
          : "Price alerts and watchlist highlights."}
      </Text>
      <View style={st.detailActionRow}>
        <Pressable
          accessibilityRole="button"
          onPress={onCheck}
          style={[st.authBtn, st.authBtnSecondary, st.detailActionBtn]}
          disabled={loading}
        >
          <Text style={st.authBtnSecondaryText}>
            {loading ? "Checking..." : "Check alerts"}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onMarkRead}
          style={[
            st.authBtn,
            st.authBtnSecondary,
            st.detailActionBtn,
            unreadCount === 0 && st.removeBtnDisabled,
          ]}
          disabled={unreadCount === 0 || markingRead}
        >
          <Text style={st.authBtnSecondaryText}>
            {markingRead ? "Saving..." : "Mark read"}
          </Text>
        </Pressable>
      </View>

      {message ? (
        <View style={st.rowCard}>
          <Text style={st.itemMeta}>{message}</Text>
        </View>
      ) : null}

      {loading && alerts.length === 0 ? (
        <View style={st.rowCard}>
          <Text style={st.itemMeta}>Checking watchlist sales...</Text>
        </View>
      ) : alerts.length === 0 ? (
        <View style={st.rowCard}>
          <Text style={st.alertTitle}>No active alerts</Text>
          <Text style={st.itemMeta}>
            Save items from Home and we will create an alert when a weekly sale is active.
          </Text>
        </View>
      ) : (
        alerts.map((alert) => (
          <View key={alert.id} style={st.rowCard}>
            <View style={st.watchTargetSummary}>
              <Text style={st.alertTitle}>{alert.title}</Text>
              {alert.read_at === null ? (
                <Text style={[st.tag, st.targetBadge]}>New</Text>
              ) : null}
            </View>
            <Text style={st.itemMeta}>{alert.body}</Text>
            <Text style={st.alertTime}>
              {new Date(alert.created_at).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}
