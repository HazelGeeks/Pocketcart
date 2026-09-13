import { Pressable, Text, View } from "react-native";
import type { SaleAlert } from "../../services/saleAlerts";
import { st } from "../../screens/nativeAppStyles";
import { marketingPalette as C } from "../../shared/design/palette";
import { formatAlertActivityTime } from "../../utils/alertActivity";
import { AppIcon } from "../icons/AppIcon";
import type { WatchlistItem } from "../../services/watchlist";

type SaleAlertsPanelProps = {
  monitoredItems: WatchlistItem[];
  activeIds: string[];
  unlimited: boolean;
  removingId: string | null;
  onRemoveProduct: (id: string) => void;
  alerts: SaleAlert[];
  loading: boolean;
  markingRead: boolean;
  message: string | null;
  unreadCount: number;
  onMarkRead: () => void;
};

export function SaleAlertsPanel({
  monitoredItems, activeIds, unlimited, removingId, onRemoveProduct,
  alerts,
  loading,
  markingRead,
  message,
  unreadCount,
  onMarkRead,
}: SaleAlertsPanelProps) {
  return (
    <View style={st.alertActivity}>
      <View style={st.shoppingRecommendationCard}>
        <Text style={st.shoppingSectionTitle}>Product alerts · {unlimited ? "Unlimited" : `${activeIds.length}/5`}</Text>
        <Text style={st.shoppingFootnote}>Free: 5 products · Plus: unlimited. My Freezer is unlimited on both plans.</Text>
        {monitoredItems.map(item => <View key={item.id} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ flex: 1 }}><Text style={st.shoppingBodyText}>{item.name}</Text>
            {!activeIds.includes(item.id) ? <Text style={st.shoppingFootnote}>Paused · free plan limit</Text> : null}
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={`Remove alert for ${item.name}`}
            disabled={Boolean(removingId)} onPress={() => onRemoveProduct(item.id)} style={st.shoppingAddButton}>
            <Text style={st.shoppingRefreshText}>{removingId === item.id ? "Removing…" : "Remove"}</Text>
          </Pressable>
        </View>)}
      </View>
      <View style={st.alertActivityHeader}>
        <Text accessibilityRole="header" style={st.alertActivityHeading}>
          Activity
        </Text>
        {unreadCount > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Mark ${unreadCount} notifications as read`}
            disabled={markingRead}
            onPress={onMarkRead}
            style={st.alertActivityMarkRead}
          >
            <Text style={st.alertActivityMarkReadText}>
              {markingRead ? "Saving…" : "Mark all read"}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {message ? <Text style={st.alertActivityMessage}>{message}</Text> : null}

      {loading && alerts.length === 0 ? (
        <View style={st.alertActivityEmpty}>
          <View style={st.alertActivityIcon}>
            <AppIcon name="bell" color={C.primaryDeep} size={21} />
          </View>
          <Text style={st.alertActivityEmptyCopy}>Checking recent price activity…</Text>
        </View>
      ) : alerts.length === 0 ? (
        <View style={st.alertActivityEmpty}>
          <View style={st.alertActivityIcon}>
            <AppIcon name="bell" color={C.primaryDeep} size={21} />
          </View>
          <Text style={st.alertActivityEmptyTitle}>No activity yet</Text>
          <Text style={st.alertActivityEmptyCopy}>
            Sale updates for products you monitor will appear here.
          </Text>
        </View>
      ) : (
        alerts.map((alert) => (
          <View
            key={alert.id}
            style={[st.alertActivityRow, alert.read_at === null && st.alertActivityRowUnread]}
          >
            <View style={st.alertActivityIcon}>
              <AppIcon name="bell" color={C.primaryDeep} size={21} />
            </View>
            <View style={st.alertActivityCopy}>
              <View style={st.alertActivityMetaRow}>
                <Text numberOfLines={1} style={st.alertActivitySource}>
                  Pocketcart price alert
                </Text>
                <Text style={st.alertActivityTime}>
                  {formatAlertActivityTime(alert.created_at)}
                </Text>
              </View>
              <Text style={st.alertActivityTitle}>{alert.title}</Text>
              <Text style={st.alertActivityBody}>{alert.body}</Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
}
