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
