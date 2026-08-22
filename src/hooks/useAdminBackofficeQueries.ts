import { useQuery } from "@tanstack/react-query";
import {
  type AdminAuditLog,
  type AdminDirectoryUser,
  type AdminPriceEntry,
  type AdminProduct,
  type AdminProductAlias,
  type AdminProductIdentityReview,
  type AdminSchemaReadiness,
  type AdminStore,
  type AdminUser,
  getAdminAccess,
  getAdminSchemaReadiness,
  getAdminUser,
  listAdminAuditLogs,
  listAdminPriceEntries,
  listAdminProductAliases,
  listAdminProducts,
  listAdminStores,
  listAdminUsers,
  listPendingProductIdentityReviews,
} from "../services/adminBackoffice";
import { hasSupabaseEnv } from "../services/supabaseClient";

export * from "./useAdminBackofficeMutations";

type ServiceResult<T> = {
  data: T;
  error: string | null;
};

const adminQueryKeys = {
  user: ["admin", "user"] as const,
  access: (userId: string) => ["admin", "access", userId] as const,
  users: ["admin", "users"] as const,
  products: ["admin", "products"] as const,
  productAliases: ["admin", "productAliases"] as const,
  stores: ["admin", "stores"] as const,
  prices: ["admin", "prices"] as const,
  auditLogs: ["admin", "auditLogs"] as const,
  productIdentityReviews: ["admin", "productIdentityReviews"] as const,
  schemaReadiness: ["admin", "schemaReadiness"] as const,
};

function unwrap<T>(result: ServiceResult<T>): T {
  if (result.error) {
    throw new Error(result.error);
  }
  return result.data;
}

export function useAdminUserQuery() {
  return useQuery<AdminUser | null>({
    queryKey: adminQueryKeys.user,
    queryFn: async () => unwrap(await getAdminUser()),
    enabled: hasSupabaseEnv,
    staleTime: 1000 * 60 * 5,
  });
}

export function useAdminAccessQuery(enabled: boolean, userId: string) {
  return useQuery<boolean>({
    queryKey: adminQueryKeys.access(userId),
    queryFn: async () => unwrap(await getAdminAccess()),
    enabled,
    staleTime: 1000 * 60 * 5,
  });
}

export function useAdminProductsQuery(enabled: boolean) {
  return useQuery<AdminProduct[]>({
    queryKey: adminQueryKeys.products,
    queryFn: async () => unwrap(await listAdminProducts()),
    enabled,
    staleTime: 1000 * 30,
  });
}

export function useAdminProductAliasesQuery(enabled: boolean) {
  return useQuery<AdminProductAlias[]>({
    queryKey: adminQueryKeys.productAliases,
    queryFn: async () => unwrap(await listAdminProductAliases()),
    enabled,
    staleTime: 1000 * 30,
  });
}

export function useAdminUsersQuery(enabled: boolean) {
  return useQuery<AdminDirectoryUser[]>({
    queryKey: adminQueryKeys.users,
    queryFn: async () => unwrap(await listAdminUsers()),
    enabled,
    staleTime: 1000 * 30,
  });
}

export function useAdminStoresQuery(enabled: boolean) {
  return useQuery<AdminStore[]>({
    queryKey: adminQueryKeys.stores,
    queryFn: async () => unwrap(await listAdminStores()),
    enabled,
    staleTime: 1000 * 30,
  });
}

export function useAdminPricesQuery(enabled: boolean) {
  return useQuery<AdminPriceEntry[]>({
    queryKey: adminQueryKeys.prices,
    queryFn: async () => unwrap(await listAdminPriceEntries()),
    enabled,
    staleTime: 1000 * 30,
  });
}

export function useAdminAuditLogsQuery(enabled: boolean) {
  return useQuery<AdminAuditLog[]>({
    queryKey: adminQueryKeys.auditLogs,
    queryFn: async () => unwrap(await listAdminAuditLogs()),
    enabled,
  });
}

export function useProductIdentityReviewsQuery(enabled: boolean) {
  return useQuery<AdminProductIdentityReview[]>({
    queryKey: adminQueryKeys.productIdentityReviews,
    queryFn: async () => unwrap(await listPendingProductIdentityReviews()),
    enabled,
  });
}

export function useAdminSchemaReadinessQuery(enabled: boolean) {
  return useQuery<AdminSchemaReadiness>({
    queryKey: adminQueryKeys.schemaReadiness,
    queryFn: async () => unwrap(await getAdminSchemaReadiness()),
    enabled,
    staleTime: 1000 * 60 * 5,
  });
}
