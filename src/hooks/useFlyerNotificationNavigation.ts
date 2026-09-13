import { useCallback, useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { supabase } from "../services/supabaseClient";

export default function useFlyerNotificationNavigation(
  userId: string | null,
  openStore: (ids: string[], name: string) => void,
  showToast: (message: string) => void,
) {
  const generation = useRef(0);
  useEffect(() => {
    generation.current++;
    return () => {
      generation.current++;
    };
  }, [userId]);
  const openFlyer = useCallback(
    async (alertId: string) => {
      if (!supabase || !userId) return;
      const current = generation.current;
      try {
        const { data, error } = await supabase.rpc("flyer_notification_destination", { p_alert_id: alertId });
        if (current !== generation.current) return;
        if (error || !data?.storeIds?.length) {
          showToast("This retailer is no longer available.");
          return;
        }
        openStore(data.storeIds, data.retailer);
      } catch {
        if (current === generation.current)
          showToast("Could not open this retailer. Please try again.");
      }
    },
    [userId, openStore, showToast],
  );
  useEffect(() => {
    if (Platform.OS === "web" || !userId || !supabase) return;
    let alive = true;
    let lastId = "";
    const open = async (response: Notifications.NotificationResponse | null) => {
      const payload = response?.notification.request.content.data;
      if (
        payload?.route !== "alerts" ||
        typeof payload.alertId !== "string" ||
        payload.alertId === lastId
      )
        return;
      lastId = payload.alertId;
      try {
        const result = await supabase!
          .from("sale_alerts")
          .select("alert_key")
          .eq("id", payload.alertId)
          .eq("user_id", userId)
          .single();
        if (!alive || !result.data?.alert_key.startsWith("flyer|")) return;
        await openFlyer(payload.alertId);
        if (alive) await Notifications.clearLastNotificationResponseAsync();
      } catch {
        /* The inbox remains available if opening a push fails. */
      }
    };
    const listener = Notifications.addNotificationResponseReceivedListener((response) => {
      void open(response);
    });
    void Notifications.getLastNotificationResponseAsync()
      .then(open)
      .catch(() => {});
    return () => {
      alive = false;
      listener.remove();
    };
  }, [userId, openFlyer]);
  return openFlyer;
}
