import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAdminPriceEntry,
  createAdminProduct,
  deleteAdminProduct,
  getAdminUser,
  listAdminPriceEntries,
  listAdminProducts,
  listAdminStores,
  signInAdmin,
  signOutAdmin,
  updateAdminProduct,
  uploadAdminProductImage,
  type AdminPriceEntry,
  type AdminProduct,
  type AdminStore,
  type AdminUploadedImage,
  type AdminUser,
} from "../services/adminBackoffice";
import { hasSupabaseEnv } from "../services/supabaseClient";

type ServiceResult<T> = {
  data: T;
  error: string | null;
};

export const adminQueryKeys = {
  user: ["admin", "user"] as const,
  products: ["admin", "products"] as const,
  stores: ["admin", "stores"] as const,
  prices: ["admin", "prices"] as const,
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

export function useAdminProductsQuery(enabled: boolean) {
  return useQuery<AdminProduct[]>({
    queryKey: adminQueryKeys.products,
    queryFn: async () => unwrap(await listAdminProducts()),
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

export function useUploadAdminProductImageMutation() {
  return useMutation<AdminUploadedImage | null, Error, Parameters<typeof uploadAdminProductImage>[0]>({
    mutationFn: async (params) => unwrap(await uploadAdminProductImage(params)),
  });
}
