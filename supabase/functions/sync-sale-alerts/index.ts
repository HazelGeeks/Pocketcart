import { createClient } from "https://esm.sh/@supabase/supabase-js@2.106.2";
import {
  deliverPushAlerts,
  reconcilePushReceipts,
  type PushTokenRecord,
  type ReceiptSyncResult,
} from "../_shared/pushDelivery.ts";

type WatchlistRow = {
  id: string;
  user_id: string;
  product_id: string | null;
  store_id: string | null;
  name: string;
  store: string | null;
};

type ProductRow = {
  id: string;
  name: string;
};

type PriceRow = {
  id: string;
  product_id: string;
  store_id: string;
  price: number | string;
  observed_at: string;
  valid_from: string | null;
  valid_to: string | null;
  stores?: {
    brand?: string | null;
    name?: string | null;
    area?: string | null;
  } | null;
};

type PriceMeta = PriceRow & {
  priceValue: number;
  priceSession: string;
};

type SaleAlertRow = {
  id: string;
  user_id: string;
  alert_key: string;
  title: string;
  body: string;
  push_sent_at: string | null;
};

type AlertPayload = {
  user_id: string;
  watchlist_item_id: string;
  product_id: string;
  store_id: string | null;
  alert_key: string;
  title: string;
  body: string;
  sale_price: number;
  previous_price: number | null;
  sale_started_at: string | null;
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

function uniqueStrings(values: unknown[]): string[] {
  return Array.from(
    new Set(
      values.filter(
        (value): value is string =>
          typeof value === "string" && value.trim().length > 0,
      ),
    ),
  );
}

function parseNumber(value: number | string | null | undefined): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const parsed = Number(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function toPriceSession(row: PriceRow): string {
  const source = row.valid_from?.trim() || row.observed_at;
  const parsed = new Date(source);
  return Number.isNaN(parsed.getTime()) ? row.observed_at : parsed.toISOString();
}

function toPriceMeta(row: PriceRow): PriceMeta | null {
  const priceValue = parseNumber(row.price);
  if (priceValue === null) return null;
  return {
    ...row,
    priceValue,
    priceSession: toPriceSession(row),
  };
}

function sessionTime(session: string): number {
  const parsed = new Date(session).getTime();
  return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
}

function rowEndTime(row: PriceMeta): number {
  if (!row.valid_to) return Number.POSITIVE_INFINITY;
  const parsed = new Date(row.valid_to).getTime();
  return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
}

function currentSession(rows: PriceMeta[], nowMs: number): string | null {
  const orderedSessions: string[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    if (seen.has(row.priceSession)) continue;
    seen.add(row.priceSession);
    orderedSessions.push(row.priceSession);
  }

  return orderedSessions.find((session) =>
    rows.some(
      (row) =>
        row.priceSession === session &&
        sessionTime(row.priceSession) <= nowMs &&
        rowEndTime(row) >= nowMs,
    ),
  ) ?? null;
}

function previousSession(rows: PriceMeta[], current: string | null, nowMs: number): string | null {
  if (!current) return null;
  const currentTime = sessionTime(current);
  const orderedSessions: string[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    if (seen.has(row.priceSession)) continue;
    seen.add(row.priceSession);
    orderedSessions.push(row.priceSession);
  }

  return orderedSessions.find((session) => {
    const time = sessionTime(session);
    return time <= nowMs && time < currentTime;
  }) ?? null;
}

function buildSessionLabel(session: string): string {
  const date = new Date(session);
  if (Number.isNaN(date.getTime())) return "unknown";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function storeDisplayName(store: PriceRow["stores"] | undefined | null): string {
  if (!store) return "Unknown store";
  const name = store.name?.trim() ?? "";
  const brand = store.brand?.trim() ?? "";
  if (brand && name && brand.toLowerCase() !== name.toLowerCase()) {
    return `${brand} - ${name}`;
  }
  return brand || name || "Unknown store";
}

function lowestPrice(rows: PriceMeta[]): PriceMeta | null {
  return rows.reduce<PriceMeta | null>(
    (best, row) => (!best || row.priceValue < best.priceValue ? row : best),
    null,
  );
}

function buildAlertPayload(params: {
  item: WatchlistRow;
  productName: string;
  current: PriceMeta;
  previous: PriceMeta | null;
  currentLabel: string;
}): AlertPayload {
  const storeName = storeDisplayName(params.current.stores);
  const alertKey = [
    params.item.product_id,
    params.currentLabel.toLowerCase(),
    params.current.store_id ?? "any-store",
  ].join("|");
  const previousPrice = params.previous?.priceValue ?? null;
  const hasDrop = previousPrice !== null && params.current.priceValue < previousPrice;

  return {
    user_id: params.item.user_id,
    watchlist_item_id: params.item.id,
    product_id: params.item.product_id!,
    store_id: params.current.store_id ?? null,
    alert_key: alertKey,
    title: hasDrop ? "Sale started" : "Watched item is on sale",
    body: hasDrop
      ? `${params.productName} is now $${params.current.priceValue.toFixed(2)} at ${storeName}, down from $${previousPrice!.toFixed(2)}.`
      : `${params.productName} is currently on sale for $${params.current.priceValue.toFixed(2)} at ${storeName}.`,
    sale_price: params.current.priceValue,
    previous_price: previousPrice,
    sale_started_at: params.currentLabel,
  };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const pushSecret = Deno.env.get("PUSH_FUNCTION_SECRET")?.trim() ?? "";
  const requestSecret = request.headers.get("x-push-secret")?.trim() ?? "";

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Sale alert sync is not configured." }, 500);
  }
  if (!pushSecret || !requestSecret || requestSecret !== pushSecret) {
    return jsonResponse({ error: "Unauthorized." }, 401);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let receiptSync: ReceiptSyncResult;
  try {
    receiptSync = await reconcilePushReceipts(adminClient);
  } catch (error) {
    return jsonResponse({
      error: error instanceof Error ? error.message : "Push receipt sync failed.",
    }, 502);
  }

  const { data: watchlistRows, error: watchlistError } = await adminClient
    .from("watchlist_items")
    .select("id, user_id, product_id, store_id, name, store")
    .not("product_id", "is", null)
    .limit(10000);

  if (watchlistError) return jsonResponse({ error: watchlistError.message }, 500);

  const watchlistItems = (watchlistRows ?? []) as WatchlistRow[];
  const productIds = uniqueStrings(watchlistItems.map((item) => item.product_id));
  if (productIds.length === 0) {
    return jsonResponse({ created: 0, sent: 0, skipped: 0, receipts: receiptSync });
  }

  const [{ data: productRows, error: productError }, { data: priceRows, error: priceError }] =
    await Promise.all([
      adminClient.from("products").select("id, name").in("id", productIds),
      adminClient
        .from("product_prices")
        .select("id, product_id, store_id, price, observed_at, valid_from, valid_to, stores(brand, name, area)")
        .in("product_id", productIds)
        .order("valid_from", { ascending: false })
        .order("observed_at", { ascending: false })
        .limit(10000),
    ]);

  if (productError) return jsonResponse({ error: productError.message }, 500);
  if (priceError) return jsonResponse({ error: priceError.message }, 500);

  const productNameById = new Map(
    ((productRows ?? []) as ProductRow[]).map((product) => [product.id, product.name]),
  );
  const pricesByProduct = new Map<string, PriceMeta[]>();
  for (const row of (priceRows ?? []) as PriceRow[]) {
    const meta = toPriceMeta(row);
    if (!meta) continue;
    const rows = pricesByProduct.get(meta.product_id) ?? [];
    rows.push(meta);
    pricesByProduct.set(meta.product_id, rows);
  }

  const nowMs = Date.now();
  const candidates: AlertPayload[] = [];

  for (const item of watchlistItems) {
    if (!item.product_id) continue;
    const productRowsForItem = pricesByProduct.get(item.product_id) ?? [];
    if (productRowsForItem.length === 0) continue;

    const session = currentSession(productRowsForItem, nowMs);
    if (!session) continue;

    const previous = previousSession(productRowsForItem, session, nowMs);
    const currentRows = productRowsForItem.filter((row) => row.priceSession === session);
    const previousRows = previous
      ? productRowsForItem.filter((row) => row.priceSession === previous)
      : [];

    const current = item.store_id
      ? currentRows.find((row) => row.store_id === item.store_id) ?? null
      : lowestPrice(currentRows);
    if (!current) continue;

    const previousForStoreOrBest = item.store_id
      ? previousRows.find((row) => row.store_id === item.store_id) ?? null
      : lowestPrice(previousRows);

    candidates.push(
      buildAlertPayload({
        item,
        productName: productNameById.get(item.product_id) ?? item.name,
        current,
        previous: previousForStoreOrBest,
        currentLabel: buildSessionLabel(session),
      }),
    );
  }

  if (candidates.length === 0) {
    return jsonResponse({ created: 0, sent: 0, skipped: 0, receipts: receiptSync });
  }

  const userIds = uniqueStrings(candidates.map((candidate) => candidate.user_id));
  const alertKeys = uniqueStrings(candidates.map((candidate) => candidate.alert_key));
  const { data: existingRows, error: existingError } = await adminClient
    .from("sale_alerts")
    .select("id, user_id, alert_key, title, body, push_sent_at")
    .in("user_id", userIds)
    .in("alert_key", alertKeys);

  if (existingError) return jsonResponse({ error: existingError.message }, 500);

  const existingByUserAndKey = new Map(
    ((existingRows ?? []) as SaleAlertRow[]).map((alert) => [
      `${alert.user_id}:${alert.alert_key}`,
      alert,
    ]),
  );
  const payloads = candidates.filter(
    (candidate) => !existingByUserAndKey.has(`${candidate.user_id}:${candidate.alert_key}`),
  );

  let createdAlerts: SaleAlertRow[] = [];
  if (payloads.length > 0) {
    const { data: insertedRows, error: insertError } = await adminClient
      .from("sale_alerts")
      .insert(payloads)
      .select("id, user_id, alert_key, title, body, push_sent_at");

    if (insertError) return jsonResponse({ error: insertError.message }, 500);
    createdAlerts = (insertedRows ?? []) as SaleAlertRow[];
  }

  const unsentExisting = ((existingRows ?? []) as SaleAlertRow[]).filter(
    (alert) => !alert.push_sent_at,
  );
  const alertsToPush = [...createdAlerts, ...unsentExisting];

  if (alertsToPush.length === 0) {
    return jsonResponse({
      created: createdAlerts.length,
      sent: 0,
      skipped: candidates.length - payloads.length,
      receipts: receiptSync,
    });
  }

  const pushUserIds = uniqueStrings(alertsToPush.map((alert) => alert.user_id));
  const { data: tokenRows, error: tokenError } = await adminClient
    .from("user_push_tokens")
    .select("id, user_id, token")
    .in("user_id", pushUserIds)
    .eq("enabled", true);

  if (tokenError) return jsonResponse({ error: tokenError.message }, 500);

  const pushTokens = (tokenRows ?? []) as PushTokenRecord[];
  let delivery;
  try {
    delivery = await deliverPushAlerts(adminClient, alertsToPush, pushTokens);
  } catch (error) {
    return jsonResponse({
      error: error instanceof Error ? error.message : "Push delivery failed.",
    }, 500);
  }

  const responseBody = {
    created: createdAlerts.length,
    ...delivery,
    skipped: candidates.length - payloads.length,
    receipts: receiptSync,
  };

  return jsonResponse(
    responseBody,
    delivery.attempted > 0 && delivery.sent === 0 ? 502 : 200,
  );
});
