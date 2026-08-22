import { createClient } from "https://esm.sh/@supabase/supabase-js@2.106.2";
import {
  deliverPushAlerts,
  type PushDeliveryResult,
  type PushTokenRecord,
} from "../_shared/pushDelivery.ts";

type SaleAlertRow = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  push_sent_at: string | null;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-push-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function bearerToken(request: Request): string {
  return request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ?? "";
}

function uniqueStrings(values: unknown[]): string[] {
  return Array.from(new Set(values.filter((value): value is string => typeof value === "string" && value.trim().length > 0)));
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const pushSecret = Deno.env.get("PUSH_FUNCTION_SECRET")?.trim() ?? "";
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Push service is not configured." }, 500);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const body = await request.json().catch(() => ({})) as {
    alertIds?: string[];
    record?: { id?: string };
  };
  const alertIds = uniqueStrings([...(body.alertIds ?? []), body.record?.id]);
  if (alertIds.length === 0) return jsonResponse({ sent: 0, skipped: 0 });

  const requestSecret = request.headers.get("x-push-secret")?.trim() ?? "";
  const secretAuthorized = Boolean(pushSecret && requestSecret && requestSecret === pushSecret);

  let authedUserId: string | null = null;
  if (!secretAuthorized) {
    const token = bearerToken(request);
    if (!token) return jsonResponse({ error: "Please sign in first." }, 401);
    const { data, error } = await adminClient.auth.getUser(token);
    if (error || !data.user?.id) return jsonResponse({ error: "Invalid or expired session." }, 401);
    authedUserId = data.user.id;
  }

  let alertQuery = adminClient
    .from("sale_alerts")
    .select("id, user_id, title, body, push_sent_at")
    .in("id", alertIds);
  if (authedUserId) {
    alertQuery = alertQuery.eq("user_id", authedUserId);
  }

  const { data: alertRows, error: alertError } = await alertQuery;
  if (alertError) return jsonResponse({ error: alertError.message }, 500);

  const alerts = ((alertRows ?? []) as SaleAlertRow[]).filter((alert) => !alert.push_sent_at);
  if (alerts.length === 0) return jsonResponse({ sent: 0, skipped: alertIds.length });

  const userIds = uniqueStrings(alerts.map((alert) => alert.user_id));
  const { data: tokenRows, error: tokenError } = await adminClient
    .from("user_push_tokens")
    .select("id, user_id, token")
    .in("user_id", userIds)
    .eq("enabled", true);
  if (tokenError) return jsonResponse({ error: tokenError.message }, 500);

  const pushTokens = (tokenRows ?? []) as PushTokenRecord[];
  let delivery: PushDeliveryResult;
  try {
    delivery = await deliverPushAlerts(adminClient, alerts, pushTokens);
  } catch (error) {
    return jsonResponse({
      error: error instanceof Error ? error.message : "Push delivery failed.",
    }, 500);
  }

  const responseBody = {
    ...delivery,
    skipped: alerts.length - delivery.alerts,
  };

  return jsonResponse(
    responseBody,
    delivery.attempted > 0 && delivery.sent === 0 ? 502 : 200,
  );
});
