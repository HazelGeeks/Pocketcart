import React from "react";
import { useFamily } from "../contexts/FamilyContext";
import { AppState, Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { refreshFreezerReminders, setFreezerReminderUser } from "../services/freezerNotifications";

export default function useFreezerReminders(userId: string | null, openFreezer: () => void) {
  const family = useFamily();
  const scope = React.useMemo(() => ({ userId, familyId: family.family?.id, ready: family.ready }), [userId, family.family?.id, family.ready]);
  React.useEffect(() => {
    const { userId: reminderUserId, ready } = scope;
    if (Platform.OS === "web") return;
    void setFreezerReminderUser(reminderUserId);
    if (ready) void refreshFreezerReminders(reminderUserId);
    const resume = AppState.addEventListener("change", (state) => {
      if (state === "active") void refreshFreezerReminders(reminderUserId);
    });
    let alive = true;
    const open = (response: Notifications.NotificationResponse | null) => {
      const data = response?.notification.request.content.data;
      if (alive && reminderUserId && data?.kind === "freezer-expiry" && data.userId === reminderUserId) {
        openFreezer();
        void Notifications.clearLastNotificationResponseAsync();
      }
    };
    const response = Notifications.addNotificationResponseReceivedListener(open);
    void Notifications.getLastNotificationResponseAsync().then(open).catch(() => {});
    return () => { alive = false; resume.remove(); response.remove(); };
  }, [scope, openFreezer]);
}
