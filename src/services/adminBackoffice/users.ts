import { collectPagedRows } from "../../utils/paginatedQuery";
import { adminDirectoryUserFromRow } from "../../utils/adminUserDirectory";
import { hasSupabaseEnv, supabase } from "../supabaseClient";
import { missingEnvResult } from "./shared";
import type {
  AdminDirectoryUser,
  AdminDirectoryUserRow,
  ServiceResult,
} from "./types";

type RpcError = { message: string };

export async function listAdminUsers(): Promise<
  ServiceResult<AdminDirectoryUser[]>
> {
  if (!hasSupabaseEnv || !supabase) return missingEnvResult([]);
  const client = supabase;

  const result = await collectPagedRows<AdminDirectoryUserRow, RpcError>(
    async (from, to) => {
      const response = await client
        .rpc("admin_list_users")
        .range(from, to);
      return {
        data: (response.data ?? []) as AdminDirectoryUserRow[],
        error: response.error,
      };
    },
  );

  if (result.error) {
    const errorText = result.error.message.toLowerCase();
    if (
      errorText.includes("admin_list_users") ||
      errorText.includes("schema cache")
    ) {
      return {
        data: [],
        error:
          "Admin user directory is not installed yet. Apply the latest Supabase schema migration.",
      };
    }
    return { data: [], error: result.error.message };
  }

  return {
    data: result.data
      .map(adminDirectoryUserFromRow)
      .filter((user): user is AdminDirectoryUser => Boolean(user)),
    error: null,
  };
}
