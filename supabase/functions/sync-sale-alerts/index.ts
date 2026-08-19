import { createClient } from "https://esm.sh/@supabase/supabase-js@2.106.2";
import {
  deliverPushAlerts,
  reconcilePushReceipts,
  type PushTokenRecord,
  type ReceiptSyncResult,
} from "../_shared/pushDelivery.ts";
import { dedupeSaleAlertPayloads } from "../_shared/saleAlertDeduplication.ts";
import { buildCanonicalSaleAlertIdentity } from "../_shared/saleAlertIdentity.ts";
import { selectSaleAlertPrices } from "../_shared/saleAlertSelection.ts";

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
  korean_name: string;
  english_name?: string | null;
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
};

type FavoriteStoreRow = {
  user_id: string;
  store_id: string;
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

function chunkStrings(values: string[], size = 200): string[][] {
  const chunks: string[][] = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

function parseNumber(value: number | string | null | undefined): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const parsed = Number(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function toPriceMeta(row: PriceRow): PriceMeta | null {
  const priceValue = parseNumber(row.price);
  if (priceValue === null) return null;
  return {
    ...row,
    priceValue,
  };
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

function buildAlertPayload(params: {
  item: WatchlistRow;
  productName: string;
  current: PriceMeta;
  previous: PriceMeta | null;
}): AlertPayload {
  const storeName = storeDisplayName(params.current.stores);
  const identity = buildCanonicalSaleAlertIdentity({
    productId: params.item.product_id!,
    storeId: params.current.store_id,
    session: {
      validFrom: params.current.valid_from,
      validTo: params.current.valid_to,
      observedAt: params.current.observed_at,
    },
  });
  if (!identity) throw new Error("Selected sale session has no valid start timestamp.");
  const previousPrice = params.previous?.priceValue ?? null;
  const hasDrop = previousPrice !== null && params.current.priceValue < previousPrice;

  return {
    user_id: params.item.user_id,
    watchlist_item_id: params.item.id,
    product_id: params.item.product_id!,
    store_id: params.current.store_id ?? null,
    alert_key: identity.alertKey,
    title: hasDrop ? "Sale started" : "Watched item is on sale",
    body: hasDrop
      ? `${params.productName} is now $${params.current.priceValue.toFixed(2)} at ${storeName}, down from $${previousPrice!.toFixed(2)}.`
      : `${params.productName} is currently on sale for $${params.current.priceValue.toFixed(2)} at ${storeName}.`,
    sale_price: params.current.priceValue,
    previous_price: previousPrice,
    sale_started_at: identity.saleStartedAt,
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

  const pageSize = 1000;
  const watchlistItems: WatchlistRow[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await adminClient
      .from("watchlist_items")
      .select("id, user_id, product_id, store_id, name, store")
      .not("product_id", "is", null)
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) return jsonResponse({ error: error.message }, 500);
    const page = (data ?? []) as WatchlistRow[];
    watchlistItems.push(...page);
    if (page.length < pageSize) break;
  }

  const productIds = uniqueStrings(watchlistItems.map((item) => item.product_id));
  if (productIds.length === 0) {
    return jsonResponse({ created: 0, sent: 0, skipped: 0, receipts: receiptSync });
  }

  const productRows: ProductRow[] = [];
  const priceRows: PriceRow[] = [];
  for (const productIdChunk of chunkStrings(productIds)) {
    const { data: productPage, error: productError } = await adminClient
      .from("products")
      .select("id, korean_name, english_name")
      .in("id", productIdChunk);
    if (productError) return jsonResponse({ error: productError.message }, 500);
    productRows.push(...((productPage ?? []) as ProductRow[]));

    for (let from = 0; ; from += pageSize) {
      const { data: pricePage, error: priceError } = await adminClient
        .from("product_prices")
        .select("id, product_id, store_id, price, observed_at, valid_from, valid_to, stores(brand, name, area)")
        .in("product_id", productIdChunk)
        .order("valid_from", { ascending: false })
        .order("observed_at", { ascending: false })
        .order("id", { ascending: true })
        .range(from, from + pageSize - 1);
      if (priceError) return jsonResponse({ error: priceError.message }, 500);
      const page = (pricePage ?? []) as PriceRow[];
      priceRows.push(...page);
      if (page.length < pageSize) break;
    }
  }

  const watchlistUserIds = uniqueStrings(watchlistItems.map((item) => item.user_id));
  const favoriteStoreIdsByUser = new Map<string, Set<string>>();
  for (const userIdChunk of chunkStrings(watchlistUserIds)) {
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await adminClient
        .from("user_favorite_stores")
        .select("user_id, store_id")
        .in("user_id", userIdChunk)
        .order("user_id", { ascending: true })
        .order("store_id", { ascending: true })
        .range(from, from + pageSize - 1);
      if (error) return jsonResponse({ error: error.message }, 500);
      const page = (data ?? []) as FavoriteStoreRow[];
      for (const favorite of page) {
        const storeIds = favoriteStoreIdsByUser.get(favorite.user_id) ?? new Set<string>();
        storeIds.add(favorite.store_id);
        favoriteStoreIdsByUser.set(favorite.user_id, storeIds);
      }
      if (page.length < pageSize) break;
    }
  }

  const productNameById = new Map(
    productRows.map((product) => [
      product.id,
      product.english_name?.trim() || product.korean_name.trim() || "Unnamed product",
    ]),
  );
  const pricesByProduct = new Map<string, PriceMeta[]>();
  for (const row of priceRows) {
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

    const selection = selectSaleAlertPrices({
      rows: productRowsForItem,
      explicitStoreId: item.store_id,
      favoriteStoreIds: favoriteStoreIdsByUser.get(item.user_id),
      nowMs,
    });
    if (!selection) continue;

    candidates.push(
      buildAlertPayload({
        item,
        productName: productNameById.get(item.product_id) ?? item.name,
        current: selection.current,
        previous: selection.previous,
      }),
    );
  }

  if (candidates.length === 0) {
    return jsonResponse({ created: 0, sent: 0, skipped: 0, receipts: receiptSync });
  }

  const uniqueCandidates = dedupeSaleAlertPayloads(candidates);
  const userIds = uniqueStrings(uniqueCandidates.map((candidate) => candidate.user_id));
  const alertKeys = uniqueStrings(uniqueCandidates.map((candidate) => candidate.alert_key));
  const existingRows: SaleAlertRow[] = [];
  for (const userIdChunk of chunkStrings(userIds)) {
    for (const alertKeyChunk of chunkStrings(alertKeys)) {
      const { data, error } = await adminClient
        .from("sale_alerts")
        .select("id, user_id, alert_key, title, body, push_sent_at")
        .in("user_id", userIdChunk)
        .in("alert_key", alertKeyChunk);
      if (error) return jsonResponse({ error: error.message }, 500);
      existingRows.push(...((data ?? []) as SaleAlertRow[]));
    }
  }

  const existingByUserAndKey = new Map(
    existingRows.map((alert) => [
      `${alert.user_id}:${alert.alert_key}`,
      alert,
    ]),
  );
  const payloads = uniqueCandidates.filter(
    (candidate) => !existingByUserAndKey.has(`${candidate.user_id}:${candidate.alert_key}`),
  );

  let createdAlerts: SaleAlertRow[] = [];
  for (let index = 0; index < payloads.length; index += 500) {
    const { data: insertedRows, error: insertError } = await adminClient
      .from("sale_alerts")
      .upsert(payloads.slice(index, index + 500), {
        onConflict: "user_id,alert_key",
        ignoreDuplicates: true,
      })
      .select("id, user_id, alert_key, title, body, push_sent_at");

    if (insertError) return jsonResponse({ error: insertError.message }, 500);
    createdAlerts.push(...((insertedRows ?? []) as SaleAlertRow[]));
  }

  const unsentExisting = existingRows.filter(
    (alert) => !alert.push_sent_at,
  );
  const alertsToPush = [...createdAlerts, ...unsentExisting];

  if (alertsToPush.length === 0) {
    return jsonResponse({
      created: createdAlerts.length,
      sent: 0,
      skipped: uniqueCandidates.length - payloads.length,
      receipts: receiptSync,
    });
  }

  const pushUserIds = uniqueStrings(alertsToPush.map((alert) => alert.user_id));
  const pushTokens: PushTokenRecord[] = [];
  for (const userIdChunk of chunkStrings(pushUserIds)) {
    const { data, error } = await adminClient
      .from("user_push_tokens")
      .select("id, user_id, token")
      .in("user_id", userIdChunk)
      .eq("enabled", true);
    if (error) return jsonResponse({ error: error.message }, 500);
    pushTokens.push(...((data ?? []) as PushTokenRecord[]));
  }
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
    skipped: uniqueCandidates.length - payloads.length,
    receipts: receiptSync,
  };

  return jsonResponse(
    responseBody,
    delivery.attempted > 0 && delivery.sent === 0 ? 502 : 200,
  );
});
