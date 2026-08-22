import React from "react";
import { Platform } from "react-native";
import {
  markSaleAlertsRead,
  syncSaleAlertsForWatchlist,
  type SaleAlert,
} from "../services/saleAlerts";
import { sendSaleAlertPushNotifications } from "../services/pushNotifications";
import { hasSupabaseEnv } from "../services/supabaseClient";
import { listWatchlistItems, type WatchlistItem } from "../services/watchlist";
import type { NativeTabId } from "../screens/nativeAppData";
import { isSignInRequiredMessage } from "../utils/serviceErrors";

type UseNativeSaleAlertsOptions = {
  activeTab: NativeTabId;
  alertsEnabled: boolean;
  showToast: (message: string) => void;
};

export default function useNativeSaleAlerts({
  activeTab,
  alertsEnabled,
  showToast,
}: UseNativeSaleAlertsOptions) {
  const [saleAlerts, setSaleAlerts] = React.useState<SaleAlert[]>([]);
  const [alertsLoading, setAlertsLoading] = React.useState(false);
  const [alertsMessage, setAlertsMessage] = React.useState<string | null>(null);
  const [alertsMarkingRead, setAlertsMarkingRead] = React.useState(false);

  const notifyCreatedSaleAlerts = React.useCallback(
    (createdAlerts: SaleAlert[]) => {
      if (createdAlerts.length === 0) return;
      if (alertsEnabled) {
        void sendSaleAlertPushNotifications(createdAlerts);
        const notification = (globalThis as { Notification?: any }).Notification;
        if (Platform.OS === "web" && notification && notification.permission === "granted") {
          createdAlerts.slice(0, 3).forEach((alert) => {
            try {
              new notification(alert.title, { body: alert.body });
            } catch {
              // Browser notification availability varies by runtime.
            }
          });
        }
      }
      showToast(
        createdAlerts.length === 1 ? "New sale alert." : `${createdAlerts.length} new sale alerts.`,
      );
    },
    [alertsEnabled, showToast],
  );

  const loadSaleAlerts = React.useCallback(
    async (items: WatchlistItem[], keepMessage = false) => {
      if (!hasSupabaseEnv) {
        setSaleAlerts([]);
        return;
      }

      setAlertsLoading(true);
      const { data, error } = await syncSaleAlertsForWatchlist(items);
      setSaleAlerts(data.alerts);
      setAlertsLoading(false);
      if (isSignInRequiredMessage(error)) {
        setAlertsMessage(null);
      } else if (error) {
        setAlertsMessage(error);
      } else if (!keepMessage) {
        setAlertsMessage(null);
      }
      notifyCreatedSaleAlerts(data.created);
    },
    [notifyCreatedSaleAlerts],
  );

  const loadWatchlist = React.useCallback(
    async (keepMessage = false) => {
      if (!hasSupabaseEnv) {
        setSaleAlerts([]);
        return;
      }

      const { data, error } = await listWatchlistItems();
      if (isSignInRequiredMessage(error)) {
        setAlertsMessage(null);
      } else if (error) {
        setAlertsMessage(error);
      } else if (!keepMessage) {
        setAlertsMessage(null);
      }
      if (!error) {
        await loadSaleAlerts(data, true);
      }
    },
    [loadSaleAlerts],
  );

  React.useEffect(() => {
    if (activeTab !== "home" && activeTab !== "alerts") return;
    void loadWatchlist(true);
  }, [activeTab, loadWatchlist]);

  const markAlertsRead = React.useCallback(async () => {
    setAlertsMarkingRead(true);
    const { error } = await markSaleAlertsRead();
    setAlertsMarkingRead(false);

    if (error) {
      setAlertsMessage(error);
      return;
    }

    setAlertsMessage(null);
    setSaleAlerts((current) =>
      current.map((alert) => ({
        ...alert,
        read_at: alert.read_at ?? new Date().toISOString(),
      })),
    );
    showToast("Alerts marked as read.");
  }, [showToast]);

  const clearWatchlist = React.useCallback(() => {
    setSaleAlerts([]);
  }, []);

  const unreadAlertCount = React.useMemo(
    () => saleAlerts.filter((alert) => alert.read_at === null).length,
    [saleAlerts],
  );

  return {
    alertsLoading,
    alertsMarkingRead,
    alertsMessage,
    clearWatchlist,
    loadWatchlist,
    markAlertsRead,
    saleAlerts,
    unreadAlertCount,
  };
}
