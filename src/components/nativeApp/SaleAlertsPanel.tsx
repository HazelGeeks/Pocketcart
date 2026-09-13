import { AlertManager } from "./AlertManager";
import { Pressable, Text, View } from "react-native";
import type { SaleAlert } from "../../services/saleAlerts";
import { st } from "../../screens/nativeAppStyles";
import { marketingPalette as C } from "../../shared/design/palette";
import { formatAlertActivityTime } from "../../utils/alertActivity";
import { AppIcon } from "../icons/AppIcon";
import type { WatchlistItem } from "../../services/watchlist";

type SaleAlertsPanelProps = {
  onOpenFlyerStore: (id: string) => void;
  onOpenProduct: (id: string) => void;
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
  onOpenProduct, onOpenFlyerStore, monitoredItems, activeIds, unlimited, removingId, onRemoveProduct,
  alerts,
  loading,
  markingRead,
  message,
  unreadCount,
  onMarkRead,
}: SaleAlertsPanelProps) {
  return (
    <View style={st.alertActivity}>
      <AlertManager items={monitoredItems} activeIds={activeIds} unlimited={unlimited} removingId={removingId} onRemove={onRemoveProduct} onOpenProduct={onOpenProduct} />
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
            Flyer updates and sale alerts for products you monitor will appear here.
          </Text>
        </View>
      ) : (
        alerts.map((alert) => (
          <Pressable accessibilityRole={(alert.product_id || alert.alert_key.startsWith("flyer|")) ? "button" : undefined} disabled={!alert.product_id && !alert.alert_key.startsWith("flyer|")}
            accessibilityLabel={alert.product_id ? `${alert.title}. ${alert.body}. ${formatAlertActivityTime(alert.created_at)}. View current price` : alert.alert_key.startsWith("flyer|") ? `${alert.title}. ${alert.body}. View retailer deals` : undefined}
            onPress={() => { if (alert.product_id) onOpenProduct(alert.product_id); else if (alert.alert_key.startsWith("flyer|")) onOpenFlyerStore(alert.id); }}
            key={alert.id}
            style={[st.alertActivityRow, alert.read_at === null && st.alertActivityRowUnread]}
          >
            <View style={st.alertActivityIcon}>
              <AppIcon name="bell" color={C.primaryDeep} size={21} />
            </View>
            <View style={st.alertActivityCopy}>
              <View style={st.alertActivityMetaRow}>
                <Text numberOfLines={1} style={st.alertActivitySource}>
                  {alert.alert_key.startsWith("flyer|") ? "PocketCart flyer update" : "Pocketcart price alert"}
                </Text>
                <Text style={st.alertActivityTime}>
                  {formatAlertActivityTime(alert.created_at)}
                </Text>
              </View>
              <Text style={st.alertActivityTitle}>{alert.title}</Text>
              <Text style={st.alertActivityBody}>{alert.body}</Text>
            </View>
          </Pressable>
        ))
      )}
    </View>
  );
}
