import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { buildFreezerReminders } from "../utils/freezerReminders";
import { listMyFreezerItems } from "./myFreezer";
import { configurePushNotificationHandler } from "./pushNotifications";

const KIND = "freezer-expiry";
const preferenceKey = (userId: string) => `freezer-reminders:${userId}`;
let activeUserId: string | null = null;
let queue: Promise<unknown> = Promise.resolve();
export type FreezerReminderStatus = { enabled: boolean; granted: boolean; message: string | null };
export async function getFreezerReminderStatus(userId: string): Promise<FreezerReminderStatus> {
  const enabled = (await AsyncStorage.getItem(preferenceKey(userId))) !== "off";
  if (Platform.OS === "web") return { enabled, granted: false, message: "Reminders are available in the mobile app." };
  const permission = await Notifications.getPermissionsAsync();
  return { enabled, granted: permission.granted || permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL, message: null };
}

export function setFreezerReminderUser(userId: string | null) {
  activeUserId = userId;
  return refreshFreezerReminders(userId);
}

// Serialize reconciliation so a save, resume and logout cannot leave stale schedules.
export function refreshFreezerReminders(userId: string | null): Promise<string | null> {
  const run = async (): Promise<string | null> => {
    if (Platform.OS === "web" || userId !== activeUserId) return null;
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      for (const entry of scheduled) {
        if (entry.content.data?.kind === KIND && entry.content.data?.userId !== userId) {
          await Notifications.cancelScheduledNotificationAsync(entry.identifier);
        }
      }
      if (!userId || userId !== activeUserId) return null;
      const status = await getFreezerReminderStatus(userId);
      const existing = scheduled.filter((entry) => entry.content.data?.kind === KIND && entry.content.data?.userId === userId);
      let plans: ReturnType<typeof buildFreezerReminders> = [];
      if (status.enabled && status.granted) {
        const result = await listMyFreezerItems(userId);
        if (result.error) return result.error; // Preserve schedules during a temporary read failure.
        if (userId !== activeUserId) return null;
        plans = buildFreezerReminders(result.data);
      }
      const otherCount = scheduled.filter((entry) => entry.content.data?.kind !== KIND).length;
      // Leave room for other app notifications within iOS's pending request budget.
      const capacity = Math.max(0, 60 - otherCount);
      const desired = plans.slice(0, capacity);
      for (const entry of existing) {
        if (!desired.some((plan) => entry.content.data?.signature === plan.signature)) {
          await Notifications.cancelScheduledNotificationAsync(entry.identifier);
        }
      }
      configurePushNotificationHandler();
      if (Platform.OS === "android") await Notifications.setNotificationChannelAsync(KIND, {
        name: "Food date reminders", importance: Notifications.AndroidImportance.DEFAULT,
      });
      for (const plan of desired) {
        if (userId !== activeUserId) return null;
        if (existing.some((entry) => entry.content.data?.signature === plan.signature)) continue;
        await Notifications.scheduleNotificationAsync({
          identifier: `freezer:${userId}:${plan.key}`,
          content: { title: plan.title, body: plan.body, sound: "default",
            data: { kind: KIND, userId, signature: plan.signature } },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(plan.at), channelId: KIND },
        });
      }
      return plans.length > capacity ? "Nearest reminder dates scheduled. Open the app regularly to schedule later dates." : null;
    } catch { return "Reminders could not be updated. Reopen My Freezer to retry."; }
  };
  const next = queue.then(run, run);
  queue = next;
  return next;
}

export async function setFreezerRemindersEnabled(userId: string, enabled: boolean) {
  if (Platform.OS === "web") return "Reminders are available in the mobile app.";
  if (enabled) {
    if (Platform.OS === "android") await Notifications.setNotificationChannelAsync(KIND, {
      name: "Food date reminders", importance: Notifications.AndroidImportance.DEFAULT,
    });
    const permission = await Notifications.requestPermissionsAsync();
    if (!permission.granted && permission.ios?.status !== Notifications.IosAuthorizationStatus.PROVISIONAL) {
      return "Allow notifications in your device settings to receive food reminders.";
    }
  }
  await AsyncStorage.setItem(preferenceKey(userId), enabled ? "on" : "off");
  return refreshFreezerReminders(userId);
}
