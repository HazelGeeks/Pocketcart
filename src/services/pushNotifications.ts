import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { hasSupabaseEnv, supabase, supabaseAnonKey, supabaseUrl } from "./supabaseClient";
import type { SaleAlert } from "./saleAlerts";

type PushRegistrationResult = {
  granted: boolean;
  token: string | null;
  message: string | null;
};

const EAS_PROJECT_ID =
  process.env.EXPO_PUBLIC_EAS_PROJECT_ID?.trim() ||
  "b2c314b8-b5ac-443c-b848-819da5ef3d32";

let notificationHandlerConfigured = false;

function hasNotificationPermission(
  permission: Notifications.NotificationPermissionsStatus,
): boolean {
  const permissionState = permission as unknown as {
    granted?: boolean;
    status?: string;
  };
  return (
    permissionState.granted === true ||
    permissionState.status === Notifications.PermissionStatus.GRANTED
  );
}

export function configurePushNotificationHandler(): void {
  if (notificationHandlerConfigured || Platform.OS === "web") return;
  notificationHandlerConfigured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

async function currentUserId(): Promise<{ userId: string | null; error: string | null }> {
  if (!hasSupabaseEnv || !supabase) {
    return {
      userId: null,
      error: "Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.",
    };
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) return { userId: null, error: error.message };
  if (!user) return { userId: null, error: "Sign in to link push alerts to this device." };
  return { userId: user.id, error: null };
}

export async function registerPushTokenForCurrentUser(): Promise<PushRegistrationResult> {
  if (Platform.OS === "web") {
    return {
      granted: false,
      token: null,
      message: "Native push notifications are available in the iOS/Android app.",
    };
  }

  configurePushNotificationHandler();

  const existingPermission = await Notifications.getPermissionsAsync();
  const finalPermission = hasNotificationPermission(existingPermission)
    ? existingPermission
    : await Notifications.requestPermissionsAsync();

  if (!hasNotificationPermission(finalPermission)) {
    return {
      granted: false,
      token: null,
      message: "Notification permission denied. You can enable it later in system settings.",
    };
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("sale-alerts", {
      name: "Sale alerts",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#ABC900",
    });
  }

  let token = "";
  try {
    token = (await Notifications.getExpoPushTokenAsync({ projectId: EAS_PROJECT_ID })).data;
  } catch (error) {
    return {
      granted: true,
      token: null,
      message: error instanceof Error ? error.message : "Unable to create Expo push token.",
    };
  }

  const { userId, error: userError } = await currentUserId();
  if (!userId) {
    return {
      granted: true,
      token,
      message: userError ?? "Sign in to link push alerts to this device.",
    };
  }

  const { error } = await supabase!
    .from("user_push_tokens")
    .upsert(
      {
        user_id: userId,
        token,
        platform: Platform.OS,
        enabled: true,
        last_seen_at: new Date().toISOString(),
        last_error: null,
      },
      { onConflict: "user_id,token" },
    );

  if (error) {
    return {
      granted: true,
      token,
      message: error.message.includes("user_push_tokens")
        ? "Push token table is missing. Run the user_push_tokens migration in Supabase."
        : error.message,
    };
  }

  return {
    granted: true,
    token,
    message: "Push sale alerts are enabled for this device.",
  };
}

export async function sendSaleAlertPushNotifications(alerts: SaleAlert[]): Promise<string | null> {
  if (!hasSupabaseEnv || !supabase || alerts.length === 0) return null;
  const alertIds = alerts.map((alert) => alert.id).filter(Boolean);
  if (alertIds.length === 0) return null;

  const session = (await supabase.auth.getSession()).data.session;
  if (!session?.access_token) return "Sign in to send push alerts.";

  const endpoint = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/send-sale-alert-push`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ alertIds }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    return payload.error ?? `Push alert request failed with ${response.status}.`;
  }

  return null;
}
