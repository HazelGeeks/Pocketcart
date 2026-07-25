import { supabase } from "../supabaseClient";
import type {
  AdminSchemaCheck,
  AdminSchemaReadiness,
  ServiceResult,
} from "./types";
import { missingEnvResult } from "./shared";

type SchemaProbe = {
  id: string;
  label: string;
  table: string;
  columns: string;
};

const SCHEMA_PROBES: SchemaProbe[] = [
  {
    id: "product_identity",
    label: "Product details",
    table: "products",
    columns: "id,brand,gtin",
  },
  {
    id: "price_history",
    label: "Price history",
    table: "product_prices",
    columns: "id,product_id,store_id,price,valid_from,valid_to,observed_at",
  },
  {
    id: "identity_reviews",
    label: "Products needing review",
    table: "product_identity_reviews",
    columns: "id,status,candidate_product_ids,resolved_product_id,resolution_action",
  },
  {
    id: "favorite_stores",
    label: "My stores",
    table: "user_favorite_stores",
    columns: "user_id,store_id",
  },
];

export async function getAdminSchemaReadiness(): Promise<
  ServiceResult<AdminSchemaReadiness>
> {
  if (!supabase) {
    return missingEnvResult({
      ready: false,
      checks: [],
    });
  }
  const client = supabase;

  const checks: AdminSchemaCheck[] = await Promise.all(
    SCHEMA_PROBES.map(async (probe) => {
      const { error } = await client
        .from(probe.table)
        .select(probe.columns)
        .limit(1);

      return {
        id: probe.id,
        label: probe.label,
        ready: !error,
        detail: error?.message ?? null,
      };
    }),
  );
  const { error: priceSummaryError } = await client.rpc(
    "list_product_price_summaries",
    { p_store_ids: [] },
  );
  checks.push({
    id: "price_summary_rpc",
    label: "Price summaries",
    ready: !priceSummaryError,
    detail: priceSummaryError?.message ?? null,
  });

  return {
    data: {
      ready: checks.every((check) => check.ready),
      checks,
    },
    error: null,
  };
}
