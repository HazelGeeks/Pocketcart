import React from "react";
import { Platform } from "react-native";
import type { AdminWorkspaceData } from "./useAdminWorkspaceData";

export default function useAdminWorkspaceCommands(data: AdminWorkspaceData) {
  const { state, backend } = data;
  const handleOpenMapUrl = React.useCallback((url: string) => {
    if (Platform.OS !== "web") {
      state.status.setNotice("Map helper is currently available on web admin.");
      return;
    }
    const opener = (globalThis as {
      open?: (url: string, target?: string, features?: string) => Window | null;
    }).open;
    if (typeof opener !== "function") {
      state.status.setNotice("Map helper is not available in this browser.");
      return;
    }
    opener(url, "_blank", "noopener,noreferrer");
  }, [state.status]);

  const handleSignIn = React.useCallback(async () => {
    const email = state.auth.authEmail.trim();
    if (!email || !state.auth.authPassword) {
      state.status.setNotice("Email and password are required.");
      return;
    }
    try {
      await backend.mutations.signIn.mutateAsync({
        email,
        password: state.auth.authPassword,
      });
    } catch (error) {
      state.status.setNotice(error instanceof Error ? error.message : "Sign in failed.");
      return;
    }
    state.auth.setAuthPassword("");
    state.adminUi.setActiveMenu("overview");
    state.status.setNotice("Signed in to admin.");
  }, [backend.mutations.signIn, state]);

  const handleSignOut = React.useCallback(async () => {
    try {
      await backend.mutations.signOut.mutateAsync();
    } catch (error) {
      state.status.setNotice(error instanceof Error ? error.message : "Sign out failed.");
      return;
    }
    state.adminUi.resetAdminUi();
    state.status.setNotice("Signed out.");
  }, [backend.mutations.signOut, state]);

  const handleResolveIdentityReview = React.useCallback(async (reviewId: string) => {
    state.status.setResolvingReviewId(reviewId);
    try {
      await backend.mutations.resolveReview.mutateAsync(reviewId);
      await backend.queries.reviewsQuery.refetch();
      state.status.setNotice("Product identity review marked as reviewed.");
    } catch (error) {
      state.status.setNotice(error instanceof Error ? error.message : "Product identity review could not be updated.");
    } finally {
      state.status.setResolvingReviewId(null);
    }
  }, [backend.mutations.resolveReview, backend.queries.reviewsQuery, state.status]);

  const handleMergeProducts = React.useCallback(async (
    productIds: string[],
    targetProductId: string,
    reviewId?: string,
  ): Promise<boolean> => {
    const sourceProductIds = productIds.filter((id) => id !== targetProductId);
    if (!targetProductId || !sourceProductIds.length) {
      state.status.setNotice("Choose one product to keep and at least one product to merge.");
      return false;
    }
    state.status.setSubmitting(true);
    if (reviewId) state.status.setResolvingReviewId(reviewId);
    try {
      const result = await backend.mutations.mergeProducts.mutateAsync({
        sourceProductIds,
        targetProductId,
        reviewId,
      });
      await Promise.all([
        backend.queries.productsQuery.refetch(),
        backend.queries.pricesQuery.refetch(),
        backend.queries.reviewsQuery.refetch(),
        backend.queries.auditLogsQuery.refetch(),
      ]);
      state.status.setNotice(
        `Merged ${sourceProductIds.length} product${sourceProductIds.length === 1 ? "" : "s"}. ` +
        `${result?.moved_prices ?? 0} price rows moved; ` +
        `${result?.merged_price_conflicts ?? 0} same-period price conflicts consolidated.`,
      );
      return true;
    } catch (error) {
      state.status.setNotice(error instanceof Error ? error.message : "Products could not be merged.");
      return false;
    } finally {
      state.status.setSubmitting(false);
      if (reviewId) state.status.setResolvingReviewId(null);
    }
  }, [backend, state.status]);

  return {
    handleOpenMapUrl,
    handleSignIn,
    handleSignOut,
    handleResolveIdentityReview,
    handleMergeProducts,
  };
}
