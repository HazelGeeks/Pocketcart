import React from "react";
import type {
  AdminAuditLog,
  AdminDirectoryUser,
  AdminPriceEntry,
  AdminProduct,
  AdminProductIdentityReview,
  AdminSchemaReadiness,
  AdminStore,
} from "../services/adminBackoffice";
import { ADMIN_EMAIL_ALLOWLIST } from "../utils/adminScreenHelpers";
import {
  useAdminAuditLogsQuery,
  useAdminPricesQuery,
  useAdminProductsQuery,
  useAdminSchemaReadinessQuery,
  useAdminSignInMutation,
  useAdminSignOutMutation,
  useAdminStoresQuery,
  useAdminUserQuery,
  useAdminUsersQuery,
  useCreateAdminAuditLogMutation,
  useCreateAdminPriceEntryMutation,
  useCreateAdminProductMutation,
  useCreateAdminStoreMutation,
  useCreateProductIdentityReviewMutation,
  useDeleteAdminProductMutation,
  useDeleteAdminStoreMutation,
  useMergeAdminProductsMutation,
  useProductIdentityReviewsQuery,
  useResolveProductIdentityReviewMutation,
  useUpdateAdminPriceEntryMutation,
  useUpdateAdminProductMutation,
  useUpdateAdminStoreMutation,
  useUploadAdminProductImageMutation,
} from "./useAdminBackofficeQueries";
import type { AdminWorkspaceState } from "./useAdminWorkspaceState";

export default function useAdminWorkspaceQueries(state: AdminWorkspaceState) {
  const { setNotice, refreshing, setRefreshing } = state.status;
  const adminUserQuery = useAdminUserQuery();
  const authUser = adminUserQuery.data ?? null;
  const allowlistEnabled = ADMIN_EMAIL_ALLOWLIST.length > 0;
  const hasAdminAccess = authUser
    ? !allowlistEnabled || ADMIN_EMAIL_ALLOWLIST.includes(authUser.email.trim().toLowerCase())
    : false;
  const enabled = Boolean(authUser && hasAdminAccess);

  const usersQuery = useAdminUsersQuery(enabled);
  const productsQuery = useAdminProductsQuery(enabled);
  const storesQuery = useAdminStoresQuery(enabled);
  const pricesQuery = useAdminPricesQuery(enabled);
  const auditLogsQuery = useAdminAuditLogsQuery(enabled);
  const reviewsQuery = useProductIdentityReviewsQuery(enabled);
  const schemaQuery = useAdminSchemaReadinessQuery(enabled);

  const mutations = {
    signIn: useAdminSignInMutation(),
    signOut: useAdminSignOutMutation(),
    createProduct: useCreateAdminProductMutation(),
    createIdentityReview: useCreateProductIdentityReviewMutation(),
    updateProduct: useUpdateAdminProductMutation(),
    createPrice: useCreateAdminPriceEntryMutation(),
    createAuditLog: useCreateAdminAuditLogMutation(),
    updatePrice: useUpdateAdminPriceEntryMutation(),
    createStore: useCreateAdminStoreMutation(),
    deleteStore: useDeleteAdminStoreMutation(),
    updateStore: useUpdateAdminStoreMutation(),
    deleteProduct: useDeleteAdminProductMutation(),
    uploadProductImage: useUploadAdminProductImageMutation(),
    resolveReview: useResolveProductIdentityReviewMutation(),
    mergeProducts: useMergeAdminProductsMutation(),
  };

  const products = React.useMemo<AdminProduct[]>(() => productsQuery.data ?? [], [productsQuery.data]);
  const users = React.useMemo<AdminDirectoryUser[]>(() => usersQuery.data ?? [], [usersQuery.data]);
  const stores = React.useMemo<AdminStore[]>(() => storesQuery.data ?? [], [storesQuery.data]);
  const prices = React.useMemo<AdminPriceEntry[]>(() => pricesQuery.data ?? [], [pricesQuery.data]);
  const auditLogs = React.useMemo<AdminAuditLog[]>(() => auditLogsQuery.data ?? [], [auditLogsQuery.data]);
  const reviews = React.useMemo<AdminProductIdentityReview[]>(() => reviewsQuery.data ?? [], [reviewsQuery.data]);
  const schemaReadiness = React.useMemo<AdminSchemaReadiness | null>(() => schemaQuery.data ?? null, [schemaQuery.data]);

  const loadAll = React.useCallback(async (keepNotice = false) => {
    const results = await Promise.all([
      usersQuery.refetch(), productsQuery.refetch(), storesQuery.refetch(),
      pricesQuery.refetch(), auditLogsQuery.refetch(), reviewsQuery.refetch(),
      schemaQuery.refetch(),
    ]);
    const errors = results
      .map((item) => item.error instanceof Error ? item.error.message : null)
      .filter((item): item is string => Boolean(item));
    if (errors.length) setNotice(errors.join(" | "));
    else if (!keepNotice) setNotice(null);
  }, [auditLogsQuery, pricesQuery, productsQuery, reviewsQuery, schemaQuery, setNotice, storesQuery, usersQuery]);

  const handleRefresh = React.useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await loadAll(true);
    } finally {
      setRefreshing(false);
    }
  }, [loadAll, refreshing, setRefreshing]);

  React.useEffect(() => {
    const errors = [
      adminUserQuery.error, usersQuery.error, productsQuery.error,
      storesQuery.error, pricesQuery.error, auditLogsQuery.error, reviewsQuery.error,
    ]
      .map((error) => error instanceof Error ? error.message : null)
      .filter((item): item is string => Boolean(item));
    if (errors.length) setNotice(errors.join(" | "));
  }, [adminUserQuery.error, auditLogsQuery.error, pricesQuery.error, productsQuery.error, reviewsQuery.error, setNotice, storesQuery.error, usersQuery.error]);

  return {
    authUser,
    hasAdminAccess,
    products,
    users,
    stores,
    prices,
    auditLogs,
    reviews,
    schemaReadiness,
    loading: {
      products: productsQuery.isLoading || productsQuery.isFetching,
      users: usersQuery.isLoading || usersQuery.isFetching,
      reviews: reviewsQuery.isLoading || reviewsQuery.isFetching,
      schema: schemaQuery.isLoading || schemaQuery.isFetching,
      auth: adminUserQuery.isLoading || mutations.signIn.isPending || mutations.signOut.isPending,
    },
    queries: { productsQuery, pricesQuery, auditLogsQuery, reviewsQuery },
    mutations,
    loadAll,
    handleRefresh,
  };
}

export type AdminWorkspaceQueries = ReturnType<typeof useAdminWorkspaceQueries>;
