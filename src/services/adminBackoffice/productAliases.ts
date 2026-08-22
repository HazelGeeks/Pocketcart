import { collectPagedRows } from "../../utils/paginatedQuery";
import { hasSupabaseEnv, supabase } from "../supabaseClient";
import { missingEnvResult } from "./shared";
import type { AdminProductAlias, ServiceResult } from "./types";

const ALIAS_SELECT = "id, product_id, alias_name, unit, created_at";

type AliasQueryError = { message: string };

export async function listAdminProductAliases(): Promise<ServiceResult<AdminProductAlias[]>> {
  if (!hasSupabaseEnv || !supabase) return missingEnvResult([]);
  const client = supabase;
  const result = await collectPagedRows<AdminProductAlias, AliasQueryError>(async (from, to) => {
    const response = await client
      .from("product_aliases")
      .select(ALIAS_SELECT)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, to);
    return {
      data: (response.data ?? []) as AdminProductAlias[],
      error: response.error,
    };
  });
  return {
    data: result.data,
    error: result.error?.message ?? null,
  };
}
