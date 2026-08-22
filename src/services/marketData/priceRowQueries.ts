import { supabase } from "../supabaseClient";
import { collectPagedRows } from "../../utils/paginatedQuery";
import {
  isMissingPriceQueryColumnError,
  type QueryError,
} from "./priceDataHelpers";
import type { PriceRow } from "./types";

type FetchPriceRowsParams = {
  productId?: string;
  storeIds?: string[];
  ascending: boolean;
};

type RecentPriceRpcRow = PriceRow & {
  store_brand?: string | null;
  store_name?: string | null;
  store_area?: string | null;
};

export async function fetchPriceRows({
  productId,
  storeIds,
  ascending,
}: FetchPriceRowsParams) {
  const client = supabase!;

  async function fetchRows(selectClause: string, orderByValidFrom: boolean) {
    return collectPagedRows<PriceRow, QueryError>(async (from, to) => {
      let query = client.from("product_prices").select(selectClause);
      if (productId) query = query.eq("product_id", productId);
      if (storeIds && storeIds.length > 0) query = query.in("store_id", storeIds);
      if (orderByValidFrom) {
        query = query.order("valid_from", { ascending });
      }
      const response = await query
        .order("observed_at", { ascending })
        .order("id", { ascending: true })
        .range(from, to);
      return {
        data: ((response.data ?? []) as unknown) as PriceRow[],
        error: response.error,
      };
    });
  }

  let response = await fetchRows(
    "id, product_id, store_id, price, observed_at, valid_from, valid_to, stores(brand, name, area)",
    true,
  );
  if (response.error && isMissingPriceQueryColumnError(response.error.message)) {
    response = await fetchRows(
      "id, product_id, store_id, price, observed_at, valid_from, stores(name, area)",
      true,
    );
  }
  if (response.error && isMissingPriceQueryColumnError(response.error.message)) {
    response = await fetchRows(
      "id, product_id, store_id, price, observed_at, stores(name, area)",
      false,
    );
  }
  return response;
}

export async function fetchRecentPriceRows(productIds: string[]) {
  const client = supabase!;
  const normalizedProductIds = [...new Set(productIds.map((id) => id.trim()).filter(Boolean))];
  if (normalizedProductIds.length === 0) {
    return { data: [] as PriceRow[], error: null as QueryError | null };
  }

  const rpcResponse = await collectPagedRows<RecentPriceRpcRow, QueryError>(
    async (from, to) => {
      const response = await client
        .rpc("list_product_recent_price_rows", { p_product_ids: normalizedProductIds })
        .range(from, to);
      return {
        data: ((response.data ?? []) as unknown) as RecentPriceRpcRow[],
        error: response.error,
      };
    },
  );

  if (!rpcResponse.error) {
    return {
      data: rpcResponse.data.map((row) => ({
        id: row.id,
        product_id: row.product_id,
        store_id: row.store_id,
        price: row.price,
        observed_at: row.observed_at,
        valid_from: row.valid_from ?? null,
        valid_to: row.valid_to ?? null,
        stores: {
          brand: row.store_brand ?? null,
          name: row.store_name ?? null,
          area: row.store_area ?? null,
        },
      })),
      error: null as QueryError | null,
    };
  }

  const text = rpcResponse.error.message.toLowerCase();
  const isMissingRpc =
    text.includes("list_product_recent_price_rows") &&
    (text.includes("does not exist") ||
      text.includes("could not find") ||
      text.includes("schema cache") ||
      text.includes("pgrst202"));
  if (!isMissingRpc) return rpcResponse;

  const fallbackRows: PriceRow[] = [];
  for (const productId of normalizedProductIds) {
    const response = await fetchPriceRows({ productId, ascending: false });
    if (response.error) return response;
    fallbackRows.push(...response.data);
  }
  return { data: fallbackRows, error: null as QueryError | null };
}
