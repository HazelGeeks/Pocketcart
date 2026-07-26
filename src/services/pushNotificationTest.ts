import { Platform } from "react-native";
import type { SaleAlert } from "./saleAlerts";
import { sendSaleAlertPushNotifications } from "./pushNotifications";
import { hasSupabaseEnv, supabase } from "./supabaseClient";

export type PushTestResult = {
  sent: boolean;
  alertId: string | null;
  message: string;
};

async function currentUserId(): Promise<{
  userId: string | null;
  error: string | null;
}> {
  if (!hasSupabaseEnv || !supabase) {
    return { userId: null, error: "Supabase is not configured." };
  }
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) return { userId: null, error: error.message };
  if (!user) return { userId: null, error: "Sign in before testing push alerts." };
  return { userId: user.id, error: null };
}

export async function sendTestSaleAlertPushNotification(): Promise<PushTestResult> {
  if (Platform.OS === "web") {
    return {
      sent: false,
      alertId: null,
      message: "Install the iOS or Android app on a real device to test push delivery.",
    };
  }

  const { userId, error: userError } = await currentUserId();
  if (!userId || !supabase) {
    return {
      sent: false,
      alertId: null,
      message: userError ?? "Sign in before testing push alerts.",
    };
  }

  const tokenResult = await supabase
    .from("user_push_tokens")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("enabled", true);
  if (tokenResult.error) {
    return { sent: false, alertId: null, message: tokenResult.error.message };
  }
  if (!tokenResult.count) {
    return {
      sent: false,
      alertId: null,
      message: "Enable price notifications on this device before sending a test.",
    };
  }

  const nonce = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const inserted = await supabase
    .from("sale_alerts")
    .insert({
      user_id: userId,
      alert_key: `push-test|${nonce}`,
      title: "PocketCart test alert",
      body: "Push delivery is working on this device.",
    })
    .select("*")
    .single();

  if (inserted.error || !inserted.data) {
    return {
      sent: false,
      alertId: null,
      message: inserted.error?.message ?? "Unable to create the test alert.",
    };
  }

  const alert = inserted.data as SaleAlert;
  const delivery = await sendSaleAlertPushNotifications([alert]);
  if (delivery.error) {
    return { sent: false, alertId: alert.id, message: delivery.error };
  }
  if (delivery.sent < 1) {
    return {
      sent: false,
      alertId: alert.id,
      message: "The test alert was created, but no enabled device accepted the push.",
    };
  }

  return {
    sent: true,
    alertId: alert.id,
    message: "Test notification sent. It should arrive on this device shortly.",
  };
}
