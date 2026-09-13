import { createClient } from "https://esm.sh/@supabase/supabase-js@2.106.2";
import {
  deliverPushAlerts,
  type PushAlertRecord,
  type PushTokenRecord,
} from "../_shared/pushDelivery.ts";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anon || !secret)
    return json({ error: "Notification service is not configured" }, 503);
  const authorization = request.headers.get("Authorization") ?? "";
  const caller = createClient(url, anon, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const user = await caller.auth.getUser(authorization.replace(/^Bearer\s+/i, ""));
  if (user.error || !user.data.user) return json({ error: "Please sign in first" }, 401);
  const access = await caller.rpc("is_admin");
  if (access.error || (access.data as unknown) !== true)
    return json({ error: "Admin access required" }, 403);
  const body = await request.json().catch(() => null);
  if (!body || typeof body.campaignId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.campaignId))
    return json({ error: "Invalid campaign" }, 400);
  const client = createClient(url, secret, { auth: { persistSession: false } });
  try {
    const claimed = await client.rpc("claim_flyer_notification", {
      p_campaign_id: body.campaignId,
    });
    if (claimed.error) throw new Error(claimed.error.message);
    const rows = (claimed.data ?? []) as unknown as { user_id: string; alert_id: string }[];
    for (const row of rows) {
      try {
        const alert = await client
          .from("sale_alerts")
          .select("id,user_id,title,body")
          .eq("id", row.alert_id)
          .single();
        if (alert.error) throw new Error(alert.error.message);
        const tokens: PushTokenRecord[] = [];
        for (let from = 0; ; from += 1000) {
          const page = await client
            .from("user_push_tokens")
            .select("id,user_id,token")
            .eq("user_id", row.user_id)
            .eq("enabled", true)
            .order("id")
            .range(from, from + 999);
          if (page.error) throw new Error(page.error.message);
          const values = (page.data ?? []) as unknown as PushTokenRecord[];
          tokens.push(...values);
          if (values.length < 1000) break;
        }
        const result = await deliverPushAlerts(
          client,
          [alert.data as unknown as PushAlertRecord],
          tokens,
        );
        const saved = await client
          .from("flyer_notification_recipients")
          .update({
            status: !tokens.length ? "skipped" : result.sent > 0 ? "accepted" : "failed",
            accepted: result.sent,
            failed: result.failed,
          })
          .eq("campaign_id", body.campaignId)
          .eq("user_id", row.user_id);
        if (saved.error) throw new Error(saved.error.message);
      } catch (error) {
        const saved = await client
          .from("flyer_notification_recipients")
          .update({
            status: "failed",
            error: error instanceof Error ? error.message : "Delivery outcome unknown",
          })
          .eq("campaign_id", body.campaignId)
          .eq("user_id", row.user_id);
        if (saved.error) throw new Error(saved.error.message);
      }
    }
    return json({ processed: rows.length });
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Notification processing failed" },
      500,
    );
  }
});
