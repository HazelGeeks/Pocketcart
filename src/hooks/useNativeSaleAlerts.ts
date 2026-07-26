import React from "react";
import { Platform } from "react-native";
import {
  markSaleAlertsRead,
  syncSaleAlertsForWatchlist,
  type SaleAlert,
} from "../services/saleAlerts";
import { sendSaleAlertPushNotifications } from "../services/pushNotifications";
import { hasSupabaseEnv } from "../services/supabaseClient";
import {
  listWatchlistItems,
  removeWatchlistItem,
  type WatchlistItem,
} from "../services/watchlist";
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
  const [watchlistItems, setWatchlistItems] = React.useState<WatchlistItem[]>([]);
  const [watchLoading, setWatchLoading] = React.useState(false);
  const [watchRemovingId, setWatchRemovingId] = React.useState<string | null>(null);
  const [watchMessage, setWatchMessage] = React.useState<string | null>(null);
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
        if (
          Platform.OS === "web" &&
          notification &&
          notification.permission === "granted"
        ) {
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
        createdAlerts.length === 1
          ? "New sale alert."
          : `${createdAlerts.length} new sale alerts.`,
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

  const loadWatchlist = React.useCallback(async (keepMessage = false) => {
    if (!hasSupabaseEnv) {
      setWatchlistItems([]);
      setSaleAlerts([]);
      return;
    }

    setWatchLoading(true);
    const { data, error } = await listWatchlistItems();
    setWatchlistItems(data);
    setWatchLoading(false);
    if (isSignInRequiredMessage(error)) {
      setWatchMessage(null);
    } else if (error) {
      setWatchMessage(error);
    } else if (!keepMessage) {
      setWatchMessage(null);
    }
    if (!error) {
      await loadSaleAlerts(data, true);
    }
  }, [loadSaleAlerts]);

  React.useEffect(() => {
    if (activeTab !== "home" && activeTab !== "alerts") return;
    void loadWatchlist(true);
  }, [activeTab, loadWatchlist]);

  const removeItem = React.useCallback(
    async (itemId: string) => {
      setWatchRemovingId(itemId);
      const { error } = await removeWatchlistItem(itemId);
      setWatchRemovingId(null);

      if (error) {
        setWatchMessage(error);
        return;
      }

      setWatchMessage(null);
      await loadWatchlist(true);
      showToast("Price alert removed.");
    },
    [loadWatchlist, showToast],
  );

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
    setWatchlistItems([]);
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
    removeItem,
    saleAlerts,
    unreadAlertCount,
    watchLoading,
    watchMessage,
    watchRemovingId,
    watchlistItems,
  };
}
