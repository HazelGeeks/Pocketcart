import { createClient } from "https://esm.sh/@supabase/supabase-js@2.106.2";
import { verifiedWatchlistPlus } from "../_shared/watchlistAccess.ts";
import { activeWatchlist } from "../_shared/watchlistPlan.ts";
const headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS", "Content-Type": "application/json", "Cache-Control": "no-store" };
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
Deno.serve(async request => {
  if (request.method === "OPTIONS") return new Response(null, { headers });
  if (request.method !== "POST") return reply({ error: "Method not allowed" }, 405);
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return reply({ error: "Please sign in first." }, 401);
  const client = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
  const { data: auth, error: authError } = await client.auth.getUser(token);
  if (authError || !auth.user) return reply({ error: "Please sign in first." }, 401);
  try {
    const body = await request.json().catch(() => ({}));
    const isPlus = await verifiedWatchlistPlus(auth.user.id);
    if (body.action === "add") {
      const item = body.item ?? {};
      if (typeof item.name !== "string" || !item.name.trim() || item.name.length > 300 || typeof item.store !== "string" || item.store.length > 300) return reply({ error: "Invalid product." }, 400);
      const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuid.test(item.productId ?? "") || (item.storeId != null && !uuid.test(item.storeId))) return reply({ error: "Select a catalog product." }, 400);
      if (item.targetPrice != null && (typeof item.targetPrice !== "string" || item.targetPrice.length > 30)) return reply({ error: "Invalid target price." }, 400);
      const { data, error } = await client.rpc("save_watchlist_with_plan", { p_user_id: auth.user.id, p_product_id: item.productId,
        p_store_id: item.storeId ?? null, p_name: item.name.trim(), p_store: item.store, p_target_price: item.targetPrice?.trim() || null, p_plus: isPlus });
      if (error) return reply({ error: error.message.includes("WATCHLIST_LIMIT_REACHED")
        ? "Free accounts can monitor 5 products. Remove a product in Alerts to add another. Plus includes unlimited product alerts." : "Could not save the alert. Please try again." }, error.message.includes("WATCHLIST_LIMIT_REACHED") ? 409 : 500);
      return reply({ data });
    }
    if (body.action && body.action !== "status") return reply({ error: "Unknown action" }, 400);
    const items: { id: string; user_id: string; product_id: string | null; created_at: string }[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await client.from("watchlist_items").select("*").eq("user_id", auth.user.id).order("created_at").order("id").range(from, from + 999);
      if (error) throw new Error("Could not load alert products.");
      const page = (data ?? []) as unknown as typeof items;
      items.push(...page); if (page.length < 1000) break;
    }
    return reply({ items, activeIds: activeWatchlist(items, isPlus).map(item => item.id), isPlus });
  } catch { return reply({ error: "Could not verify your alert plan. Please try again." }, 503); }
});
