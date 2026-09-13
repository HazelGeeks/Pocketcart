import { revenueCatHasAccess } from "../_shared/billingEntitlement.ts";
const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};
const response = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), { status, headers });
Deno.serve(async request => {
  if (request.method === "OPTIONS") return new Response(null, { headers });
  if (request.method !== "POST") return response({ error: "Method not allowed" }, 405);
  const authorization = request.headers.get("Authorization") ?? "";
  if (!/^Bearer \S+$/i.test(authorization)) return response({ error: "Sign in required" }, 401);
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const key = Deno.env.get("REVENUECAT_SECRET_API_KEY");
  if (!url || !anon || !key) return response({ error: "Subscription verification is not configured" }, 503);
  try {
    // Resolve the caller from their token; never accept a client-supplied user id.
    const auth = await fetch(`${url}/auth/v1/user`, {
      headers: { Authorization: authorization, apikey: anon }, signal: AbortSignal.timeout(10000),
    });
    if (!auth.ok) return response({ error: "Sign in required" }, 401);
    const user = await auth.json() as { id?: string };
    if (!user.id) return response({ error: "Sign in required" }, 401);
    const result = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(user.id)}`, {
      headers: { Authorization: `Bearer ${key}`, Accept: "application/json" }, signal: AbortSignal.timeout(10000),
    });
    if (result.status === 404) return response({ isPlus: false });
    if (!result.ok) return response({ error: "Subscription verification temporarily unavailable" }, 503);
    const payload = await result.json();
    return response({ isPlus: revenueCatHasAccess(payload.subscriber, "pocketcart_plus", Date.now(),
      Deno.env.get("REVENUECAT_ALLOW_SANDBOX") === "true") });
  } catch { return response({ error: "Subscription verification temporarily unavailable" }, 503); }
});
