import { createClient } from "https://esm.sh/@supabase/supabase-js@2.106.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const allowedPlatforms = new Set(["ios", "android", "web", "unknown"]);

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function cleanText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Account deletion request service is not configured." }, 500);
  }

  const payload = await request.json().catch(() => null) as {
    email?: unknown;
    platform?: unknown;
    details?: unknown;
  } | null;

  const email = cleanText(payload?.email, 320).toLowerCase();
  const platform = cleanText(payload?.platform, 32).toLowerCase();
  const details = cleanText(payload?.details, 2000);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse({ error: "A valid account email is required." }, 400);
  }

  if (!allowedPlatforms.has(platform)) {
    return jsonResponse({ error: "Platform must be ios, android, web, or unknown." }, 400);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data, error } = await adminClient
    .from("account_deletion_requests")
    .insert({
      email,
      platform,
      details: details || null,
      source: "web",
      user_agent: cleanText(request.headers.get("user-agent"), 300) || null,
    })
    .select("id")
    .single();

  if (error) {
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse({ id: data?.id ?? null, received: true });
});
