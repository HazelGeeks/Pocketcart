import React from "react";
import { AppState, Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { refreshFreezerReminders, setFreezerReminderUser } from "../services/freezerNotifications";

export default function useFreezerReminders(userId: string | null, openFreezer: () => void) {
  React.useEffect(() => {
    if (Platform.OS === "web") return;
    void setFreezerReminderUser(userId);
    const resume = AppState.addEventListener("change", (state) => {
      if (state === "active") void refreshFreezerReminders(userId);
    });
    let alive = true;
    const open = (response: Notifications.NotificationResponse | null) => {
      const data = response?.notification.request.content.data;
      if (alive && userId && data?.kind === "freezer-expiry" && data.userId === userId) {
        openFreezer();
        void Notifications.clearLastNotificationResponseAsync();
      }
    };
    const response = Notifications.addNotificationResponseReceivedListener(open);
    void Notifications.getLastNotificationResponseAsync().then(open).catch(() => {});
    return () => { alive = false; resume.remove(); response.remove(); };
  }, [userId, openFreezer]);
}
