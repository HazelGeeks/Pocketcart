import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type AdminAuditLog,
  type AdminPriceEntry,
  type AdminProduct,
  type AdminProductIdentityReview,
  type AdminStore,
  type AdminUploadedImage,
  createAdminAuditLog,
  createAdminPriceEntry,
  createAdminProduct,
  createAdminStore,
  createProductIdentityReview,
  deleteAdminPriceEntry,
  deleteAdminProduct,
  deleteAdminStore,
  mergeAdminProducts,
  type ProductMergeResult,
  resolveProductIdentityReview,
  signInAdmin,
  signOutAdmin,
  updateAdminPriceEntry,
  updateAdminProduct,
  updateAdminStore,
  uploadAdminProductImage,
} from "../services/adminBackoffice";

type ServiceResult<T> = { data: T; error: string | null };
type MutationInvalidationOptions = { invalidateOnSuccess?: boolean };

const keys = {
  user: ["admin", "user"] as const,
  products: ["admin", "products"] as const,
  productAliases: ["admin", "productAliases"] as const,
  stores: ["admin", "stores"] as const,
  prices: ["admin", "prices"] as const,
  auditLogs: ["admin", "auditLogs"] as const,
  reviews: ["admin", "productIdentityReviews"] as const,
};

function unwrap<T>(result: ServiceResult<T>): T {
  if (result.error) throw new Error(result.error);
  return result.data;
}

export function useAdminSignInMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { email: string; password: string }) =>
      unwrap(await signInAdmin(params)),
    onSuccess: (user) => queryClient.setQueryData(keys.user, user),
  });
}

export function useAdminSignOutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => unwrap(await signOutAdmin()),
    onSuccess: () => {
      queryClient.setQueryData(keys.user, null);
      queryClient.removeQueries({ queryKey: ["admin"] });
    },
  });
}

export function useCreateAdminProductMutation(options: MutationInvalidationOptions = {}) {
  const queryClient = useQueryClient();
  return useMutation<AdminProduct | null, Error, Parameters<typeof createAdminProduct>[0]>({
    mutationFn: async (params) => unwrap(await createAdminProduct(params)),
    onSuccess: () => {
      if (options.invalidateOnSuccess === false) return;
      void queryClient.invalidateQueries({ queryKey: keys.products });
      void queryClient.invalidateQueries({ queryKey: keys.productAliases });
    },
  });
}

export function useUpdateAdminProductMutation(options: MutationInvalidationOptions = {}) {
  const queryClient = useQueryClient();
  return useMutation<AdminProduct | null, Error, Parameters<typeof updateAdminProduct>[0]>({
    mutationFn: async (params) => unwrap(await updateAdminProduct(params)),
    onSuccess: () => {
      if (options.invalidateOnSuccess === false) return;
      void queryClient.invalidateQueries({ queryKey: keys.products });
      void queryClient.invalidateQueries({ queryKey: keys.productAliases });
    },
  });
}

export function useCreateAdminPriceEntryMutation(options: MutationInvalidationOptions = {}) {
  const queryClient = useQueryClient();
  return useMutation<AdminPriceEntry | null, Error, Parameters<typeof createAdminPriceEntry>[0]>({
    mutationFn: async (params) => unwrap(await createAdminPriceEntry(params)),
    onSuccess: () => {
      if (options.invalidateOnSuccess === false) return;
      void queryClient.invalidateQueries({ queryKey: keys.prices });
    },
  });
}

export function useUpdateAdminPriceEntryMutation(options: MutationInvalidationOptions = {}) {
  const queryClient = useQueryClient();
  return useMutation<AdminPriceEntry | null, Error, Parameters<typeof updateAdminPriceEntry>[0]>({
    mutationFn: async (params) => unwrap(await updateAdminPriceEntry(params)),
    onSuccess: () => {
      if (options.invalidateOnSuccess === false) return;
      void queryClient.invalidateQueries({ queryKey: keys.prices });
    },
  });
}

export function useDeleteAdminPriceEntryMutation(options: MutationInvalidationOptions = {}) {
  const queryClient = useQueryClient();
  return useMutation<null, Error, string>({
    mutationFn: async (id) => unwrap(await deleteAdminPriceEntry(id)),
    onSuccess: () => {
      if (options.invalidateOnSuccess === false) return;
      void queryClient.invalidateQueries({ queryKey: keys.prices });
    },
  });
}

export function useCreateAdminStoreMutation() {
  const queryClient = useQueryClient();
  return useMutation<AdminStore | null, Error, Parameters<typeof createAdminStore>[0]>({
    mutationFn: async (params) => unwrap(await createAdminStore(params)),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: keys.stores }),
  });
}

export function useDeleteAdminStoreMutation() {
  const queryClient = useQueryClient();
  return useMutation<null, Error, string>({
    mutationFn: async (storeId) => unwrap(await deleteAdminStore(storeId)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.stores });
      void queryClient.invalidateQueries({ queryKey: keys.prices });
    },
  });
}

export function useUpdateAdminStoreMutation() {
  const queryClient = useQueryClient();
  return useMutation<AdminStore | null, Error, Parameters<typeof updateAdminStore>[0]>({
    mutationFn: async (params) => unwrap(await updateAdminStore(params)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.stores });
      void queryClient.invalidateQueries({ queryKey: keys.prices });
    },
  });
}

export function useDeleteAdminProductMutation(options: MutationInvalidationOptions = {}) {
  const queryClient = useQueryClient();
  return useMutation<null, Error, string>({
    mutationFn: async (productId) => unwrap(await deleteAdminProduct(productId)),
    onSuccess: () => {
      if (options.invalidateOnSuccess === false) return;
      void queryClient.invalidateQueries({ queryKey: keys.products });
      void queryClient.invalidateQueries({ queryKey: keys.prices });
      void queryClient.invalidateQueries({ queryKey: keys.productAliases });
    },
  });
}

export function useCreateAdminAuditLogMutation() {
  const queryClient = useQueryClient();
  return useMutation<AdminAuditLog | null, Error, Parameters<typeof createAdminAuditLog>[0]>({
    mutationFn: async (params) => unwrap(await createAdminAuditLog(params)),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: keys.auditLogs }),
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
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: keys.reviews }),
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
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: keys.reviews }),
  });
}

export function useMergeAdminProductsMutation() {
  const queryClient = useQueryClient();
  return useMutation<ProductMergeResult | null, Error, Parameters<typeof mergeAdminProducts>[0]>({
    mutationFn: async (params) => unwrap(await mergeAdminProducts(params)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.products });
      void queryClient.invalidateQueries({ queryKey: keys.prices });
      void queryClient.invalidateQueries({ queryKey: keys.reviews });
      void queryClient.invalidateQueries({ queryKey: keys.auditLogs });
      void queryClient.invalidateQueries({ queryKey: keys.productAliases });
    },
  });
}

export function useUploadAdminProductImageMutation() {
  return useMutation<
    AdminUploadedImage | null,
    Error,
    Parameters<typeof uploadAdminProductImage>[0]
  >({
    mutationFn: async (params) => unwrap(await uploadAdminProductImage(params)),
  });
}
