import { hasSupabaseEnv, supabase } from "../supabaseClient";
import { collectPagedRows } from "../../utils/paginatedQuery";
import { FALLBACK_PRODUCTS } from "./fallbacks";
import {
  buildSessionLabel,
  formatComparisonLabel,
  getCurrentSaleSession,
  getPreviousVisibleSession,
  getStoreNameFromRow,
  isMissingPriceSummaryRpcError,
  rowToMeta,
  storeDisplayName,
  toPriceDelta,
  type PriceRowWithMeta,
  type PriceSummaryRpcRow,
  type QueryError,
} from "./priceDataHelpers";
import { fetchPriceRows } from "./priceRowQueries";
import { parseNumber } from "./shared";
import type { ServiceResult } from "./types";

export type ProductPriceSummary = {
  product_id: string;
  current_price: number | null;
  previous_price: number | null;
  price_delta: number | null;
  price_delta_percent: number | null;
  price_compare_label: string;
  price_compare_current_batch: string | null;
  price_compare_previous_batch: string | null;
  best_store_id: string | null;
  best_store_name: string | null;
  best_store_area: string | null;
  best_store_price: number | null;
};

const PRICE_SUMMARY_CACHE_TTL_MS = 60_000;
const priceSummaryCache = new Map<
  string,
  { expiresAt: number; result: ServiceResult<Map<string, ProductPriceSummary>> }
>();
const priceSummaryRequestCache = new Map<
  string,
  Promise<ServiceResult<Map<string, ProductPriceSummary>>>
>();

function fallbackSummaries(): Map<string, ProductPriceSummary> {
  return new Map(
    FALLBACK_PRODUCTS.map((product) => [product.id, {
      product_id: product.id,
      current_price: product.current_price,
      previous_price: product.previous_price,
      price_delta: product.price_delta,
      price_delta_percent: product.price_delta_percent,
      price_compare_label: product.price_compare_label,
      price_compare_current_batch: product.price_compare_current_batch,
      price_compare_previous_batch: product.price_compare_previous_batch,
      best_store_id: product.best_store_id,
      best_store_name: product.best_store_name,
      best_store_area: product.best_store_area,
      best_store_price: product.best_store_price,
    }]),
  );
}

function summariesFromRpc(rows: PriceSummaryRpcRow[]) {
  const summaries = new Map<string, ProductPriceSummary>();
  for (const row of rows) {
    const currentPrice = parseNumber(row.current_price);
    const previousPrice = parseNumber(row.previous_price);
    if (currentPrice === null) continue;
    const delta = toPriceDelta(currentPrice, previousPrice);
    const currentLabel = buildSessionLabel(row.current_session_start);
    const previousLabel = row.previous_session_start
      ? buildSessionLabel(row.previous_session_start)
      : null;
    const comparison = formatComparisonLabel(currentLabel, previousLabel);
    const bestStoreName = storeDisplayName({
      brand: row.best_store_brand,
      name: row.best_store_name,
      area: row.best_store_area,
    });
    summaries.set(row.product_id, {
      product_id: row.product_id,
      current_price: currentPrice,
      previous_price: previousPrice,
      price_delta: delta.priceDelta,
      price_delta_percent: delta.percentDelta,
      price_compare_label: comparison.includes("vs")
        ? `${comparison} (Current lowest: ${bestStoreName})`
        : comparison,
      price_compare_current_batch: currentLabel,
      price_compare_previous_batch: previousLabel,
      best_store_id: row.best_store_id,
      best_store_name: bestStoreName,
      best_store_area: row.best_store_area,
      best_store_price: currentPrice,
    });
  }
  return summaries;
}

function summariesFromRows(rows: PriceRowWithMeta[]) {
  const byProduct = new Map<string, PriceRowWithMeta[]>();
  for (const row of rows) {
    const list = byProduct.get(row.product_id) ?? [];
    list.push(row);
    byProduct.set(row.product_id, list);
  }

  const summaries = new Map<string, ProductPriceSummary>();
  for (const [productId, productRows] of byProduct) {
    const bestBySession = new Map<string, PriceRowWithMeta>();
    for (const row of productRows) {
      const existing = bestBySession.get(row.priceSession);
      if (!existing || row.price < existing.price) bestBySession.set(row.priceSession, row);
    }
    const currentSession = getCurrentSaleSession(productRows);
    const previousSession = getPreviousVisibleSession(productRows, currentSession);
    if (!currentSession) continue;
    const currentBest = bestBySession.get(currentSession);
    const previousBest = previousSession ? bestBySession.get(previousSession) : null;
    const currentPrice = currentBest?.price ?? null;
    const previousPrice = previousBest?.price ?? null;
    const delta = toPriceDelta(currentPrice, previousPrice);
    const currentLabel = buildSessionLabel(currentSession);
    const previousLabel = previousSession ? buildSessionLabel(previousSession) : null;
    const comparison = formatComparisonLabel(currentLabel, previousLabel);
    summaries.set(productId, {
      product_id: productId,
      current_price: currentPrice,
      previous_price: previousPrice,
      price_delta: delta.priceDelta,
      price_delta_percent: delta.percentDelta,
      price_compare_label: comparison.includes("vs")
        ? `${comparison} (Current lowest: ${getStoreNameFromRow(currentBest)}, Last lowest: ${getStoreNameFromRow(previousBest)})`
        : comparison,
      price_compare_current_batch: currentLabel,
      price_compare_previous_batch: previousLabel,
      best_store_id: currentBest?.store_id ?? null,
      best_store_name: currentBest ? storeDisplayName(currentBest.stores) : null,
      best_store_area: currentBest?.stores?.area ?? null,
      best_store_price: currentBest?.price ?? null,
    });
  }
  return summaries;
}

async function loadProductPriceSummaries(
  storeIds?: string[],
): Promise<ServiceResult<Map<string, ProductPriceSummary>>> {
  if (!hasSupabaseEnv || !supabase) {
    return { data: storeIds?.length ? new Map() : fallbackSummaries(), error: null };
  }
  const client = supabase;
  const normalizedStoreIds = [...new Set((storeIds ?? []).map((id) => id.trim()).filter(Boolean))];
  const rpcResponse = await collectPagedRows<PriceSummaryRpcRow, QueryError>(
    async (from, to) => {
      const response = await client
        .rpc("list_product_price_summaries", {
          p_store_ids: normalizedStoreIds.length ? normalizedStoreIds : null,
        })
        .range(from, to);
      return {
        data: ((response.data ?? []) as unknown) as PriceSummaryRpcRow[],
        error: response.error,
      };
    },
  );
  if (!rpcResponse.error) return { data: summariesFromRpc(rpcResponse.data), error: null };
  if (!isMissingPriceSummaryRpcError(rpcResponse.error.message)) {
    return { data: new Map(), error: rpcResponse.error.message };
  }

  const response = await fetchPriceRows({
    storeIds: normalizedStoreIds,
    ascending: false,
  });
  if (response.error) return { data: new Map(), error: response.error.message };
  const rows = response.data
    .map(rowToMeta)
    .filter((row): row is PriceRowWithMeta => row !== null);
  return { data: summariesFromRows(rows), error: null };
}

export async function listProductPriceSummaries(
  storeIds?: string[],
): Promise<ServiceResult<Map<string, ProductPriceSummary>>> {
  const normalizedStoreIds = [...new Set((storeIds ?? []).map((id) => id.trim()).filter(Boolean))]
    .sort();
  const key = normalizedStoreIds.join("|");
  const cached = priceSummaryCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.result;
  const pending = priceSummaryRequestCache.get(key);
  if (pending) return pending;

  const request = loadProductPriceSummaries(normalizedStoreIds)
    .then((result) => {
      if (!result.error) {
        priceSummaryCache.set(key, {
          expiresAt: Date.now() + PRICE_SUMMARY_CACHE_TTL_MS,
          result,
        });
      }
      return result;
    })
    .finally(() => priceSummaryRequestCache.delete(key));
  priceSummaryRequestCache.set(key, request);
  return request;
}
