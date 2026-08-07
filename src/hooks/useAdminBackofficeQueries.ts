import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAdminAuditLog,
  createProductIdentityReview,
  createAdminStore,
  createAdminPriceEntry,
  createAdminProduct,
  deleteAdminProduct,
  deleteAdminStore,
  getAdminAccess,
  getAdminUser,
  getAdminSchemaReadiness,
  listAdminUsers,
  listAdminPriceEntries,
  listAdminAuditLogs,
  listPendingProductIdentityReviews,
  listAdminProducts,
  listAdminStores,
  mergeAdminProducts,
  signInAdmin,
  signOutAdmin,
  updateAdminPriceEntry,
  updateAdminProduct,
  updateAdminStore,
  resolveProductIdentityReview,
  uploadAdminProductImage,
  type AdminAuditLog,
  type AdminProductIdentityReview,
  type AdminPriceEntry,
  type AdminProduct,
  type AdminStore,
  type AdminUploadedImage,
  type AdminDirectoryUser,
  type AdminUser,
  type AdminSchemaReadiness,
  type ProductMergeResult,
} from "../services/adminBackoffice";
import { hasSupabaseEnv } from "../services/supabaseClient";

type ServiceResult<T> = {
  data: T;
  error: string | null;
};

const adminQueryKeys = {
  user: ["admin", "user"] as const,
  access: (userId: string) => ["admin", "access", userId] as const,
  users: ["admin", "users"] as const,
  products: ["admin", "products"] as const,
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
  });
}

export function useAdminUsersQuery(enabled: boolean) {
  return useQuery<AdminDirectoryUser[]>({
    queryKey: adminQueryKeys.users,
    queryFn: async () => unwrap(await listAdminUsers()),
    enabled,
  });
}

export function useAdminStoresQuery(enabled: boolean) {
  return useQuery<AdminStore[]>({
    queryKey: adminQueryKeys.stores,
    queryFn: async () => unwrap(await listAdminStores()),
    enabled,
  });
}

export function useAdminPricesQuery(enabled: boolean) {
  return useQuery<AdminPriceEntry[]>({
    queryKey: adminQueryKeys.prices,
    queryFn: async () => unwrap(await listAdminPriceEntries()),
    enabled,
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

export function useAdminSignInMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { email: string; password: string }) =>
      unwrap(await signInAdmin(params)),
    onSuccess: (user) => {
      queryClient.setQueryData(adminQueryKeys.user, user);
    },
  });
}

export function useAdminSignOutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => unwrap(await signOutAdmin()),
    onSuccess: () => {
      queryClient.setQueryData(adminQueryKeys.user, null);
      queryClient.removeQueries({ queryKey: ["admin"] });
    },
  });
}

export function useCreateAdminProductMutation() {
  const queryClient = useQueryClient();
  return useMutation<AdminProduct | null, Error, Parameters<typeof createAdminProduct>[0]>({
    mutationFn: async (params) => unwrap(await createAdminProduct(params)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.products });
    },
  });
}

export function useUpdateAdminProductMutation() {
  const queryClient = useQueryClient();
  return useMutation<AdminProduct | null, Error, Parameters<typeof updateAdminProduct>[0]>({
    mutationFn: async (params) => unwrap(await updateAdminProduct(params)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.products });
    },
  });
}

export function useCreateAdminPriceEntryMutation() {
  const queryClient = useQueryClient();
  return useMutation<AdminPriceEntry | null, Error, Parameters<typeof createAdminPriceEntry>[0]>({
    mutationFn: async (params) => unwrap(await createAdminPriceEntry(params)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.prices });
    },
  });
}

export function useUpdateAdminPriceEntryMutation() {
  const queryClient = useQueryClient();
  return useMutation<AdminPriceEntry | null, Error, Parameters<typeof updateAdminPriceEntry>[0]>({
    mutationFn: async (params) => unwrap(await updateAdminPriceEntry(params)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.prices });
    },
  });
}

export function useCreateAdminStoreMutation() {
  const queryClient = useQueryClient();
  return useMutation<AdminStore | null, Error, Parameters<typeof createAdminStore>[0]>({
    mutationFn: async (params) => unwrap(await createAdminStore(params)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.stores });
    },
  });
}

export function useDeleteAdminStoreMutation() {
  const queryClient = useQueryClient();
  return useMutation<null, Error, string>({
    mutationFn: async (storeId) => unwrap(await deleteAdminStore(storeId)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.stores });
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.prices });
    },
  });
}

export function useUpdateAdminStoreMutation() {
  const queryClient = useQueryClient();
  return useMutation<AdminStore | null, Error, Parameters<typeof updateAdminStore>[0]>({
    mutationFn: async (params) => unwrap(await updateAdminStore(params)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.stores });
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.prices });
    },
  });
}

export function useDeleteAdminProductMutation() {
  const queryClient = useQueryClient();
  return useMutation<null, Error, string>({
    mutationFn: async (productId) => unwrap(await deleteAdminProduct(productId)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.products });
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.prices });
    },
  });
}

export function useCreateAdminAuditLogMutation() {
  const queryClient = useQueryClient();
  return useMutation<AdminAuditLog | null, Error, Parameters<typeof createAdminAuditLog>[0]>({
    mutationFn: async (params) => unwrap(await createAdminAuditLog(params)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.auditLogs });
    },
  });
}

export function useCreateProductIdentityReviewMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    AdminProductIdentityReview | null,
    Error,
    Parameters<typeof createProductIdentityReview>[0]
  >({
    mutationFn: async (params) => unwrap(await createProductIdentityReview(params)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.productIdentityReviews });
    },
  });
}

export function useResolveProductIdentityReviewMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    AdminProductIdentityReview | null,
    Error,
    Parameters<typeof resolveProductIdentityReview>[0]
  >({
    mutationFn: async (reviewId) => unwrap(await resolveProductIdentityReview(reviewId)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.productIdentityReviews });
    },
  });
}

export function useMergeAdminProductsMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    ProductMergeResult | null,
    Error,
    Parameters<typeof mergeAdminProducts>[0]
  >({
    mutationFn: async (params) => unwrap(await mergeAdminProducts(params)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.products });
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.prices });
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.productIdentityReviews });
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.auditLogs });
    },
  });
}

export function useUploadAdminProductImageMutation() {
  return useMutation<AdminUploadedImage | null, Error, Parameters<typeof uploadAdminProductImage>[0]>({
    mutationFn: async (params) => unwrap(await uploadAdminProductImage(params)),
  });
}
