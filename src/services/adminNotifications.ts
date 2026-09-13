import { notificationLoadError } from "../utils/notificationForm";
import { supabase } from "./supabaseClient";

export type FlyerNotification = {
  id: string;
  retailer: string;
  flyer_date: string;
  title: string;
  body: string;
  test: boolean;
  actor_email: string | null;
  created_at: string;
  users: number;
  pending: number;
  processing: number;
  accepted: number;
  failed: number;
  errors: number;
  skipped: number;
};
export async function loadNotificationDashboard() {
  if (!supabase) throw new Error("Supabase is not configured.");
  const [audienceResult, historyResult] = await Promise.allSettled([
    supabase.rpc("flyer_notification_audience"),
    supabase.rpc("flyer_notification_history"),
  ]);
  const audience =
    audienceResult.status === "fulfilled"
      ? audienceResult.value
      : {
          data: null,
          error: { message: "Unable to load the notification audience. Please refresh." },
        };
  const history =
    historyResult.status === "fulfilled"
      ? historyResult.value
      : { data: null, error: { message: "Unable to load send history. Please refresh." } };
  return {
    audience: audience.error
      ? null
      : (audience.data as { users: number; pushUsers: number } | null),
    history: (history.data ?? []) as FlyerNotification[],
    audienceError: notificationLoadError(audience.error),
    historyError: notificationLoadError(history.error),
  };
}
export async function createFlyerNotification(retailer: string, date: string, test: boolean) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const result = await supabase.rpc("create_flyer_notification", {
    p_retailer: retailer,
    p_flyer_date: date,
    p_test: test,
  });
  if (result.error)
    throw new Error(
      result.error.code === "23505"
        ? "This retailer's Flyer has already been announced for this start date. Check the send history."
        : result.error.message,
    );
  return result.data as string;
}
export async function processFlyerNotification(campaignId: string) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.functions.invoke("admin-flyer-notification", {
    body: { campaignId },
  });
  if (error) {
    const details = await error.context?.json?.().catch(() => null);
    throw new Error(details?.error ?? error.message);
  }
  if (data?.error) throw new Error(data.error);
  return data.processed as number;
}
