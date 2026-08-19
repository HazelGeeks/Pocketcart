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
  useAdminAccessQuery,
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
  useDeleteAdminPriceEntryMutation,
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
  const emailAllowed = authUser
    ? !allowlistEnabled || ADMIN_EMAIL_ALLOWLIST.includes(authUser.email.trim().toLowerCase())
    : false;
  const adminAccessQuery = useAdminAccessQuery(Boolean(authUser && emailAllowed), authUser?.id ?? "signed-out");
  const hasAdminAccess = Boolean(authUser && emailAllowed && adminAccessQuery.data === true);
  const enabled = hasAdminAccess;
  const activeMenu = state.adminUi.activeMenu;
  const overviewOrProducts = activeMenu === "overview" || activeMenu === "products";
  const needsStoresAndPrices = overviewOrProducts || activeMenu === "stores";

  const usersQuery = useAdminUsersQuery(enabled && activeMenu === "users");
  const productsQuery = useAdminProductsQuery(enabled && overviewOrProducts);
  const storesQuery = useAdminStoresQuery(enabled && needsStoresAndPrices);
  const pricesQuery = useAdminPricesQuery(enabled && needsStoresAndPrices);
  const auditLogsQuery = useAdminAuditLogsQuery(
    enabled && (activeMenu === "overview" || activeMenu === "stores"),
  );
  const reviewsQuery = useProductIdentityReviewsQuery(enabled && activeMenu === "overview");
  const schemaQuery = useAdminSchemaReadinessQuery(enabled && activeMenu === "overview");

  const mutations = {
    signIn: useAdminSignInMutation(),
    signOut: useAdminSignOutMutation(),
    createProduct: useCreateAdminProductMutation(),
    createIdentityReview: useCreateProductIdentityReviewMutation(),
    updateProduct: useUpdateAdminProductMutation(),
    createPrice: useCreateAdminPriceEntryMutation(),
    createAuditLog: useCreateAdminAuditLogMutation(),
    updatePrice: useUpdateAdminPriceEntryMutation(),
    deletePrice: useDeleteAdminPriceEntryMutation(),
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

  const queryErrorNoticeRef = React.useRef<string | null>(null);
  const syncQueryErrorNotice = React.useCallback((errors: string[], clearOtherNotice = false) => {
    if (errors.length) {
      const nextNotice = errors.join(" | ");
      queryErrorNoticeRef.current = nextNotice;
      setNotice(nextNotice);
      return;
    }

    const previousQueryNotice = queryErrorNoticeRef.current;
    queryErrorNoticeRef.current = null;
    if (previousQueryNotice) {
      setNotice((current) => current === previousQueryNotice ? null : current);
    } else if (clearOtherNotice) {
      setNotice(null);
    }
  }, [setNotice]);

  const loadAll = React.useCallback(async (keepNotice = false) => {
    const requests: Array<Promise<{ error: unknown }>> = [];
    if (overviewOrProducts) requests.push(productsQuery.refetch());
    if (needsStoresAndPrices) requests.push(storesQuery.refetch(), pricesQuery.refetch());
    if (activeMenu === "users") requests.push(usersQuery.refetch());
    if (activeMenu === "overview" || activeMenu === "stores") requests.push(auditLogsQuery.refetch());
    if (activeMenu === "overview") requests.push(reviewsQuery.refetch(), schemaQuery.refetch());
    const results = await Promise.all(requests);
    const errors = results
      .map((item) => item.error instanceof Error ? item.error.message : null)
      .filter((item): item is string => Boolean(item));
    syncQueryErrorNotice(errors, !keepNotice);
  }, [activeMenu, auditLogsQuery, needsStoresAndPrices, overviewOrProducts, pricesQuery, productsQuery, reviewsQuery, schemaQuery, storesQuery, syncQueryErrorNotice, usersQuery]);

  const handleRefresh = React.useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await loadAll(false);
    } finally {
      setRefreshing(false);
    }
  }, [loadAll, refreshing, setRefreshing]);

  React.useEffect(() => {
    const errors = [
      adminUserQuery.error, adminAccessQuery.error, usersQuery.error, productsQuery.error,
      storesQuery.error, pricesQuery.error, auditLogsQuery.error, reviewsQuery.error,
    ]
      .map((error) => error instanceof Error ? error.message : null)
      .filter((item): item is string => Boolean(item));
    syncQueryErrorNotice(errors);
  }, [adminAccessQuery.error, adminUserQuery.error, auditLogsQuery.error, pricesQuery.error, productsQuery.error, reviewsQuery.error, storesQuery.error, syncQueryErrorNotice, usersQuery.error]);

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
      audit: auditLogsQuery.isLoading || auditLogsQuery.isFetching,
      auth: adminUserQuery.isLoading || adminAccessQuery.isLoading || adminAccessQuery.isFetching || mutations.signIn.isPending || mutations.signOut.isPending,
    },
    errors: {
      products:
        productsQuery.error instanceof Error
          ? productsQuery.error.message
          : null,
    },
    queries: { productsQuery, pricesQuery, auditLogsQuery, reviewsQuery },
    mutations,
    loadAll,
    handleRefresh,
  };
}

export type AdminWorkspaceQueries = ReturnType<typeof useAdminWorkspaceQueries>;
