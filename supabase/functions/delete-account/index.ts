import { createClient } from "https://esm.sh/@supabase/supabase-js@2.106.2";
import { revokeAppleAuthorization } from "../_shared/appleRevocation.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const token = bearerToken(request);

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Account deletion is not configured." }, 500);
  }

  if (!token) {
    return jsonResponse({ error: "Please sign in first." }, 401);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data, error: userError } = await adminClient.auth.getUser(token);
  const userId = data.user?.id;

  if (userError || !userId) {
    return jsonResponse({ error: "Invalid or expired session." }, 401);
  }

  const appleIdentity = data.user?.identities?.find(
    (identity: { provider: string }) => identity.provider === "apple",
  );
  let appleAuthorizationRevoked: boolean | null = null;
  if (appleIdentity) {
    appleAuthorizationRevoked = false;
    const body = await request.json().catch(() => null);
    const code = typeof body?.appleAuthorizationCode === "string"
      ? body.appleAuthorizationCode.trim() : "";
    const subject = appleIdentity.identity_data?.sub;
    if (code && typeof subject === "string" && subject) {
      try {
        await revokeAppleAuthorization({
          clientId: Deno.env.get("APPLE_CLIENT_ID") || "com.pocketcart.app",
          teamId: Deno.env.get("APPLE_TEAM_ID") || "",
          keyId: Deno.env.get("APPLE_KEY_ID") || "",
          privateKey: Deno.env.get("APPLE_PRIVATE_KEY") || "",
        }, code, subject);
        appleAuthorizationRevoked = true;
      } catch {
        // Apple TN3194: inability to obtain/revoke a token must not prevent
        // account deletion. Do not log tokens, codes, keys or provider responses.
      }
    }
  }

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);

  if (deleteError) {
    return jsonResponse({ error: deleteError.message }, 500);
  }

  return jsonResponse({ deleted: true, appleAuthorizationRevoked });
});
