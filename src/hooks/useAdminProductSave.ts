import React from "react";
import { normalizeGtin } from "../utils/productIdentity";
import {
  excludeReusedPersistedPriceIds,
  getRemovedPersistedPriceIds,
  prepareProductPriceSets,
} from "../utils/productStorePriceSets";
import type { UseAdminProductActionsParams } from "./adminProductActionTypes";
import {
  findExistingPriceForPeriod,
  isLikelySupabaseStorageUrl,
  type ProductSaveInput,
  resolveProductCandidate,
  safeProductImageName,
} from "./adminProductSaveHelpers";

type Params = UseAdminProductActionsParams & { resetProductForm: () => void };

export default function useAdminProductSave(params: Params) {
  const handleCreateProduct = React.useCallback(async () => {
    const input: ProductSaveInput = {
      koreanName: params.productKoreanName.trim(),
      englishName: params.productEnglishName.trim(),
      brand: params.productBrand.trim(),
      gtin: normalizeGtin(params.productGtin.trim()),
      unit: params.productUnit.trim(),
      category: params.productCategory.trim(),
    };
    if (!input.englishName || !input.koreanName || !input.category) {
      params.setNotice("English name, Korean name, and category are required.");
      return;
    }
    const prepared = prepareProductPriceSets({
      sets: params.productStorePriceSets,
      stores: params.stores,
    });
    if (!prepared.ok) {
      params.setNotice(prepared.error);
      return;
    }
    const removedPriceIds = params.editingProductId
      ? getRemovedPersistedPriceIds(
          params.prices
            .filter((price) => price.product_id === params.editingProductId)
            .map((price) => price.id),
          params.productStorePriceSets,
        )
      : [];

    let reusedExistingProduct = false;
    let auditWarning = "";
    try {
      params.setSubmitting(true);
      let thumbnailUrl = params.productThumb.trim();
      if (thumbnailUrl && !isLikelySupabaseStorageUrl(thumbnailUrl)) {
        try {
          params.setProductImageUploading(true);
          params.setNotice("Saving product image to Supabase Storage...");
          const response = await fetch(thumbnailUrl);
          if (!response.ok) throw new Error(`Image URL returned ${response.status}.`);
          const blob = await response.blob();
          if (!blob.type.startsWith("image/")) {
            throw new Error("The pasted URL did not return an image file.");
          }
          const uploaded = await params.uploadProductImageMutation.mutateAsync({
            file: blob,
            fileName: safeProductImageName(input.englishName, blob.type),
            contentType: blob.type,
          });
          if (!uploaded?.publicUrl) throw new Error("Image upload returned no public URL.");
          thumbnailUrl = uploaded.publicUrl;
          params.setProductThumb(thumbnailUrl);
        } catch (error) {
          const detail = error instanceof Error ? ` ${error.message}` : "";
          params.setNotice(
            `Could not save image URL to Supabase Storage. Use Upload image or copy the image itself, then try again.${detail}`,
          );
          return;
        } finally {
          params.setProductImageUploading(false);
        }
      }

      const candidate = await resolveProductCandidate({
        editingProductId: params.editingProductId,
        products: params.products,
        productAliases: params.productAliases,
        input,
        createIdentityReviewMutation: params.createIdentityReviewMutation,
      });
      if (candidate.blocked) {
        params.setNotice(candidate.notice);
        return;
      }

      const matchingProduct = candidate.product;
      reusedExistingProduct = Boolean(matchingProduct);
      const savedProduct = params.editingProductId
        ? await params.updateProductMutation.mutateAsync({
            id: params.editingProductId,
            ...input,
            thumbnailUrl,
          })
        : matchingProduct
          ? await params.updateProductMutation.mutateAsync({
              id: matchingProduct.id,
              koreanName: matchingProduct.korean_name,
              englishName: matchingProduct.english_name?.trim() || input.englishName,
              brand: matchingProduct.brand?.trim() || input.brand,
              gtin: candidate.existingGtin || input.gtin,
              unit: matchingProduct.unit ?? input.unit,
              category: matchingProduct.category,
              thumbnailUrl: matchingProduct.thumbnail_url?.trim() || thumbnailUrl,
            })
          : await params.createProductMutation.mutateAsync({ ...input, thumbnailUrl });
      if (!savedProduct) {
        params.setNotice(
          params.editingProductId ? "Product was not updated." : "Product was not created.",
        );
        return;
      }

      const errors: string[] = [];
      const reusedPriceIds = new Set<string>();
      let deletedPriceCount = 0;
      for (const item of prepared.activeSets) {
        try {
          const existing = item.persistedPriceId
            ? (params.prices.find((price) => price.id === item.persistedPriceId) ?? null)
            : findExistingPriceForPeriod({
                prices: params.prices,
                productId: savedProduct.id,
                storeId: item.storeId,
                periodStartDate: item.periodStartDate,
                periodEndDate: item.periodEndDate,
              });
          const payload = {
            productId: savedProduct.id,
            storeId: item.storeId,
            price: item.price,
            observedAt: item.periodStartIso,
            periodEnd: item.periodEndIso,
          };
          if (existing) {
            await params.updatePriceEntryMutation.mutateAsync({ id: existing.id, ...payload });
            reusedPriceIds.add(existing.id);
          } else {
            await params.createPriceEntryMutation.mutateAsync(payload);
          }
        } catch (error) {
          errors.push(
            `Set ${item.row}: ${error instanceof Error ? error.message : "Price entry failed."}`,
          );
        }
      }
      if (!errors.length) {
        const priceIdsToDelete = excludeReusedPersistedPriceIds(removedPriceIds, reusedPriceIds);
        for (const id of priceIdsToDelete) {
          try {
            await params.deletePriceEntryMutation.mutateAsync(id);
            deletedPriceCount += 1;
          } catch (error) {
            errors.push(
              `Remove price row: ${error instanceof Error ? error.message : "Price entry delete failed."}`,
            );
          }
        }
      }
      try {
        await params.createAuditLogMutation.mutateAsync({
          action: params.editingProductId
            ? "update_product"
            : reusedExistingProduct
              ? "reuse_product"
              : "create_product",
          entityType: "product",
          entityId: savedProduct.id,
          summary: `${params.editingProductId ? "Updated" : reusedExistingProduct ? "Reused" : "Created"} ${savedProduct.english_name || savedProduct.korean_name}.`,
          metadata: {
            price_sets: prepared.activeSets.length,
            price_failures: errors.length,
            price_rows_removed: deletedPriceCount,
          },
        });
      } catch (error) {
        auditWarning = ` Audit log failed: ${error instanceof Error ? error.message : "failed"}.`;
      }
      if (errors.length) {
        params.setNotice(
          `Product saved, but ${errors.length} Store | Price set failed. ${errors[0]}${auditWarning}`,
        );
        await params.loadAll(true);
        return;
      }
    } catch (error) {
      params.setNotice(error instanceof Error ? error.message : "Product was not saved.");
      return;
    } finally {
      params.setSubmitting(false);
    }

    const priceCount = prepared.activeSets.length;
    const wasEditing = Boolean(params.editingProductId);
    params.resetProductForm();
    params.setProductModalOpen(false);
    const action = wasEditing ? "updated" : "created";
    const successNotice = reusedExistingProduct
      ? priceCount
        ? `Existing product reused; ${priceCount} Store Price set added or updated.`
        : "Existing product reused without new price data."
      : priceCount
        ? `Product ${action} with ${priceCount} Store Price set.`
        : `Product ${action} without image or price data.`;
    params.setNotice(successNotice + auditWarning);
    await params.loadAll(true);
  }, [params]);

  return handleCreateProduct;
}
