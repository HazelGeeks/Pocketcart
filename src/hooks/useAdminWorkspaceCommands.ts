import React from "react";
import { Platform } from "react-native";
import type { AdminProductIdentityReview } from "../services/adminBackoffice";
import { createProductCsvStoreResolver, productCsvDateToIso } from "../utils/productCsvImport";
import type { AdminWorkspaceData } from "./useAdminWorkspaceData";

function reviewPayloadText(review: AdminProductIdentityReview, key: string): string {
  const value = review.payload[key];
  return typeof value === "string" ? value.trim() : "";
}

function normalizedReviewPrice(value: string): string {
  return value.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/)?.[0] ?? "";
}

export default function useAdminWorkspaceCommands(data: AdminWorkspaceData) {
  const { state, backend } = data;
  const handleOpenMapUrl = React.useCallback(
    (url: string) => {
      if (Platform.OS !== "web") {
        state.status.setNotice("Map helper is currently available on web admin.");
        return;
      }
      const opener = (
        globalThis as {
          open?: (url: string, target?: string, features?: string) => Window | null;
        }
      ).open;
      if (typeof opener !== "function") {
        state.status.setNotice("Map helper is not available in this browser.");
        return;
      }
      opener(url, "_blank", "noopener,noreferrer");
    },
    [state.status],
  );

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

  const handleResolveIdentityReview = React.useCallback(
    async (reviewId: string) => {
      state.status.setResolvingReviewId(reviewId);
      try {
        await backend.mutations.resolveReview.mutateAsync(reviewId);
        await backend.queries.reviewsQuery.refetch();
        state.status.setNotice("Product identity review marked as reviewed.");
      } catch (error) {
        state.status.setNotice(
          error instanceof Error ? error.message : "Product identity review could not be updated.",
        );
      } finally {
        state.status.setResolvingReviewId(null);
      }
    },
    [backend.mutations.resolveReview, backend.queries.reviewsQuery, state.status],
  );

  const handleMergeProducts = React.useCallback(
    async (productIds: string[], targetProductId: string, reviewId?: string): Promise<boolean> => {
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
            `${result?.merged_price_conflicts ?? 0} same-period price conflicts consolidated; ` +
            `${result?.preserved_aliases ?? 0} names preserved as aliases.`,
        );
        return true;
      } catch (error) {
        state.status.setNotice(
          error instanceof Error ? error.message : "Products could not be merged.",
        );
        return false;
      } finally {
        state.status.setSubmitting(false);
        if (reviewId) state.status.setResolvingReviewId(null);
      }
    },
    [backend, state.status],
  );

  const handleAssignIdentityReview = React.useCallback(
    async (review: AdminProductIdentityReview, productId: string): Promise<boolean> => {
      if (!productId) return false;
      state.status.setResolvingReviewId(review.id);
      state.status.setSubmitting(true);
      try {
        const rawPrice = reviewPayloadText(review, "price");
        let savedPrices = 0;
        if (rawPrice) {
          const price = normalizedReviewPrice(rawPrice);
          const numericPrice = Number(price);
          const observedAt = productCsvDateToIso(
            reviewPayloadText(review, "sale_start_date"),
            false,
          );
          const periodEnd = productCsvDateToIso(reviewPayloadText(review, "sale_end_date"), true);
          const storeIds = createProductCsvStoreResolver(backend.stores).resolveStoreIds(
            reviewPayloadText(review, "store_id"),
            reviewPayloadText(review, "store_name"),
            reviewPayloadText(review, "store_brand"),
          );
          if (
            !Number.isFinite(numericPrice) ||
            numericPrice < 0 ||
            !observedAt ||
            !periodEnd ||
            !storeIds.length
          ) {
            throw new Error(
              "The held row still needs a valid price, sale period, and store before it can be assigned.",
            );
          }
          await Promise.all(
            storeIds.map((storeId) =>
              backend.mutations.createPrice.mutateAsync({
                productId,
                storeId,
                price,
                observedAt,
                periodEnd,
              }),
            ),
          );
          savedPrices = storeIds.length;
        }
        await backend.mutations.resolveReview.mutateAsync({
          reviewId: review.id,
          resolvedProductId: productId,
          resolutionAction: "assigned_csv_row",
        });
        let auditWarning = "";
        try {
          await backend.mutations.createAuditLog.mutateAsync({
            action: "assign_product_import_review",
            entityType: "product_identity_review",
            entityId: review.id,
            summary: `Assigned held CSV row ${review.row_number ?? ""} to product ${productId}.`,
            metadata: { product_id: productId, saved_prices: savedPrices },
          });
        } catch (error) {
          auditWarning = ` Audit log failed: ${error instanceof Error ? error.message : "failed"}.`;
        }
        await Promise.all([
          backend.queries.pricesQuery.refetch(),
          backend.queries.reviewsQuery.refetch(),
          backend.queries.auditLogsQuery.refetch(),
        ]);
        state.status.setNotice(
          savedPrices
            ? `Held row assigned; ${savedPrices} price entr${savedPrices === 1 ? "y" : "ies"} saved.${auditWarning}`
            : `Held row assigned to the selected product.${auditWarning}`,
        );
        return true;
      } catch (error) {
        state.status.setNotice(
          error instanceof Error ? error.message : "Held row could not be assigned.",
        );
        return false;
      } finally {
        state.status.setSubmitting(false);
        state.status.setResolvingReviewId(null);
      }
    },
    [backend, state.status],
  );

  return {
    handleOpenMapUrl,
    handleSignIn,
    handleSignOut,
    handleResolveIdentityReview,
    handleAssignIdentityReview,
    handleMergeProducts,
  };
}
