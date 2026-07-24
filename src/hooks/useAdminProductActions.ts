import React from "react";
import type {
  AdminPriceEntry,
  AdminProduct,
  AdminProductIdentityReview,
  AdminStore,
} from "../services/adminBackoffice";
import type { ProductPriceStats, StorePriceSetInput } from "../utils/adminScreenHelpers";
import { createStorePriceSet, dateInputValue } from "../utils/adminScreenHelpers";
import {
  gtinValidationMessage,
  isValidGtin,
  normalizeGtin,
  resolveProductMatch,
} from "../utils/productIdentity";
import { prepareProductPriceSets } from "../utils/productStorePriceSets";
import useAdminProductCsvActions from "./useAdminProductCsvActions";
import useAdminProductImageUpload, { extensionFromType } from "./useAdminProductImageUpload";

type Mutation<TParams, TResult> = {
  mutateAsync: (params: TParams) => Promise<TResult>;
};

function findExistingPriceForPeriod(params: {
  prices: AdminPriceEntry[];
  productId: string;
  storeId: string;
  periodStartDate: string;
  periodEndDate: string;
}): AdminPriceEntry | null {
  const targetDate = params.periodStartDate.trim();
  if (!targetDate) return null;
  return (
    params.prices.find((price) => {
      if (price.product_id !== params.productId || price.store_id !== params.storeId) return false;
      return (
        dateInputValue(price.valid_from || price.observed_at) === targetDate &&
        dateInputValue(price.valid_to) === params.periodEndDate.trim()
      );
    }) ?? null
  );
}

function isLikelySupabaseStorageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.pathname.includes("/storage/v1/object/public/") && url.pathname.includes("/product-images/");
  } catch (_error) {
    return false;
  }
}

function safeProductImageName(params: { name: string; contentType: string }): string {
  const base = params.name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${base || "product-image"}-${Date.now()}.${extensionFromType(params.contentType)}`;
}

type UseAdminProductActionsParams = {
  productName: string;
  productEnglishName: string;
  productBrand: string;
  productGtin: string;
  productUnit: string;
  productCategory: string;
  productCategoryCustom: string;
  productThumb: string;
  productStorePriceSets: StorePriceSetInput[];
  editingProductId: string | null;
  products: AdminProduct[];
  prices: AdminPriceEntry[];
  productPriceStats: Map<string, ProductPriceStats>;
  stores: AdminStore[];
  setProductName: (value: string) => void;
  setProductEnglishName: (value: string) => void;
  setProductBrand: (value: string) => void;
  setProductGtin: (value: string) => void;
  setProductUnit: (value: string) => void;
  setProductCategory: (value: string) => void;
  setProductCategoryCustom: (value: string) => void;
  setProductThumb: (value: string) => void;
  setProductStorePriceSets: React.Dispatch<React.SetStateAction<StorePriceSetInput[]>>;
  setProductModalOpen: (value: boolean) => void;
  setEditingProductId: (value: string | null) => void;
  setProductImageUploading: (value: boolean) => void;
  setSubmitting: (value: boolean) => void;
  setDeletingKey: (value: string | null) => void;
  setNotice: (value: string | null) => void;
  resetProductFilters: () => void;
  loadAll: (keepNotice?: boolean) => Promise<void>;
  createProductMutation: Mutation<
    {
      name: string;
      englishName?: string;
      brand?: string;
      gtin?: string;
      category: string;
      unit?: string;
      thumbnailUrl?: string;
    },
    AdminProduct | null
  >;
  updateProductMutation: Mutation<
    {
      id: string;
      name: string;
      englishName?: string;
      brand?: string;
      gtin?: string;
      category: string;
      unit?: string;
      thumbnailUrl?: string;
    },
    AdminProduct | null
  >;
  createIdentityReviewMutation: Mutation<
    {
      rowNumber?: number;
      productId?: string;
      reason: string;
      matchMethod?: string;
      candidateCount?: number;
      payload: Record<string, unknown>;
    },
    AdminProductIdentityReview | null
  >;
  deleteProductMutation: Mutation<string, unknown>;
  createPriceEntryMutation: Mutation<{
    productId: string;
    storeId: string;
    price: string;
    observedAt?: string;
    periodEnd?: string;
  }, unknown>;
  updatePriceEntryMutation: Mutation<{
    id: string;
    productId: string;
    storeId: string;
    price: string;
    observedAt?: string;
    periodEnd?: string;
  }, unknown>;
  uploadProductImageMutation: Mutation<{ file: Blob; fileName?: string; contentType?: string }, { publicUrl: string } | null>;
};

export default function useAdminProductActions({
  productName,
  productEnglishName,
  productBrand,
  productGtin,
  productUnit,
  productCategory,
  productThumb,
  productStorePriceSets,
  editingProductId,
  products,
  prices,
  stores,
  productPriceStats,
  setProductName,
  setProductEnglishName,
  setProductBrand,
  setProductGtin,
  setProductUnit,
  setProductCategory,
  setProductCategoryCustom,
  setProductThumb,
  setProductStorePriceSets,
  setProductModalOpen,
  setEditingProductId,
  setProductImageUploading,
  setSubmitting,
  setDeletingKey,
  setNotice,
  resetProductFilters,
  loadAll,
  createProductMutation,
  updateProductMutation,
  createIdentityReviewMutation,
  deleteProductMutation,
  createPriceEntryMutation,
  updatePriceEntryMutation,
  uploadProductImageMutation,
}: UseAdminProductActionsParams) {
  const updateStorePriceSet = React.useCallback(
    (id: string, field: "brand" | "storeId" | "price" | "periodStartDate" | "periodEndDate", value: string) => {
      setProductStorePriceSets((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
    },
    [setProductStorePriceSets],
  );

  const addStorePriceSet = React.useCallback(() => {
    setProductStorePriceSets((prev) => [...prev, createStorePriceSet()]);
  }, [setProductStorePriceSets]);

  const removeStorePriceSet = React.useCallback(
    (id: string) => {
      setProductStorePriceSets((prev) => {
        if (prev.length <= 1) {
          return prev.map((item) =>
            item.id === id
              ? { ...item, brand: "", storeId: "", price: "", periodStartDate: "", periodEndDate: "" }
              : item,
          );
        }
        return prev.filter((item) => item.id !== id);
      });
    },
    [setProductStorePriceSets],
  );

  const resetProductForm = React.useCallback(() => {
    setEditingProductId(null);
    setProductName("");
    setProductEnglishName("");
    setProductBrand("");
    setProductGtin("");
    setProductUnit("");
    setProductCategory("");
    setProductCategoryCustom("");
    setProductThumb("");
    setProductStorePriceSets([createStorePriceSet()]);
  }, [
    setEditingProductId,
    setProductBrand,
    setProductEnglishName,
    setProductGtin,
    setProductCategory,
    setProductCategoryCustom,
    setProductName,
    setProductUnit,
    setProductStorePriceSets,
    setProductThumb,
  ]);

  const handleOpenAddProduct = React.useCallback(() => {
    resetProductForm();
    setProductModalOpen(true);
  }, [resetProductForm, setProductModalOpen]);

  const handleOpenEditProduct = React.useCallback(
    (product: AdminProduct) => {
      const sortedProductPrices = prices
        .filter((price) => price.product_id === product.id)
        .sort((a, b) => {
          const bTime = new Date(b.valid_from || b.observed_at).getTime();
          const aTime = new Date(a.valid_from || a.observed_at).getTime();
          return bTime - aTime;
        });
      const storeById = new Map(stores.map((store) => [store.id, store]));
      const existingPriceSets = sortedProductPrices.map((price) => {
        const store = storeById.get(price.store_id);
        return createStorePriceSet({
          brand: store?.brand?.trim() || (store ? "Other" : ""),
          storeId: price.store_id,
          price: price.price.toFixed(2),
          periodStartDate: dateInputValue(price.valid_from || price.observed_at),
          periodEndDate: dateInputValue(price.valid_to),
        });
      });

      setEditingProductId(product.id);
      setProductName(product.name);
      setProductEnglishName(product.english_name ?? "");
      setProductBrand(product.brand ?? "");
      setProductGtin(product.gtin ?? "");
      setProductUnit(product.unit ?? "");
      setProductCategory(product.category);
      setProductCategoryCustom(product.category);
      setProductThumb(product.thumbnail_url ?? "");
      setProductStorePriceSets(existingPriceSets.length > 0 ? existingPriceSets : [createStorePriceSet()]);
      setProductModalOpen(true);
    },
    [
      prices,
      setEditingProductId,
      setProductCategory,
      setProductCategoryCustom,
      setProductBrand,
      setProductEnglishName,
      setProductGtin,
      setProductModalOpen,
      setProductName,
      setProductUnit,
      setProductStorePriceSets,
      setProductThumb,
      stores,
    ],
  );

  const handleCreateProduct = React.useCallback(async () => {
    const name = productName.trim();
    const englishName = productEnglishName.trim();
    const brand = productBrand.trim();
    const rawGtin = productGtin.trim();
    const gtin = normalizeGtin(rawGtin);
    const unit = productUnit.trim();
    const category = productCategory.trim();

    if (!name || !category) {
      setNotice("Product name and category are required.");
      return;
    }
    const gtinError = gtinValidationMessage(rawGtin);
    if (gtinError) {
      setNotice(gtinError);
      return;
    }
    const preparedPriceSets = prepareProductPriceSets({
      sets: productStorePriceSets,
      stores,
    });
    if (!preparedPriceSets.ok) {
      setNotice(preparedPriceSets.error);
      return;
    }

    let reusedExistingProduct = false;
    try {
      setSubmitting(true);
      let thumbnailUrl = productThumb.trim();
      if (thumbnailUrl && !isLikelySupabaseStorageUrl(thumbnailUrl)) {
        try {
          setProductImageUploading(true);
          setNotice("Saving product image to Supabase Storage...");
          const response = await fetch(thumbnailUrl);
          if (!response.ok) {
            throw new Error(`Image URL returned ${response.status}.`);
          }
          const blob = await response.blob();
          if (!blob.type.startsWith("image/")) {
            throw new Error("The pasted URL did not return an image file.");
          }
          const uploaded = await uploadProductImageMutation.mutateAsync({
            file: blob,
            fileName: safeProductImageName({ name, contentType: blob.type }),
            contentType: blob.type,
          });
          if (!uploaded?.publicUrl) {
            throw new Error("Image upload returned no public URL.");
          }
          thumbnailUrl = uploaded.publicUrl;
          setProductThumb(thumbnailUrl);
        } catch (error) {
          setNotice(
            error instanceof Error
              ? `Could not save image URL to Supabase Storage. Use Upload image or copy the image itself, then try again. ${error.message}`
              : "Could not save image URL to Supabase Storage. Use Upload image or copy the image itself, then try again.",
          );
          return;
        } finally {
          setProductImageUploading(false);
        }
      }
      const match = editingProductId
        ? null
        : resolveProductMatch(products, {
            name,
            englishName,
            brand,
            gtin,
            unit,
            category,
          });
      if (match?.status === "ambiguous") {
        await createIdentityReviewMutation.mutateAsync({
          reason: "ambiguous_manual_product_match",
          matchMethod: match.method,
          candidateCount: match.candidateCount,
          payload: {
            name,
            english_name: englishName || null,
            product_brand: brand || null,
            gtin: gtin || null,
            unit: unit || null,
            category,
            candidate_product_ids: match.candidateIds,
          },
        });
        setNotice(
          `${match.candidateCount} possible products were found. The item was sent to Dashboard review instead of being merged.`,
        );
        return;
      }

      const matchingProduct = match?.status === "matched" ? match.product : null;
      const rawExistingGtin = matchingProduct?.gtin?.trim() ?? "";
      const existingGtin = isValidGtin(matchingProduct?.gtin)
        ? normalizeGtin(matchingProduct?.gtin)
        : "";
      if (matchingProduct && rawExistingGtin && !existingGtin && !gtin) {
        await createIdentityReviewMutation.mutateAsync({
          productId: matchingProduct.id,
          reason: "invalid_gtin",
          matchMethod: match?.status === "matched" ? match.method : undefined,
          candidateCount: 1,
          payload: {
            name,
            product_brand: brand || null,
            existing_gtin: rawExistingGtin,
            validation_error: gtinValidationMessage(rawExistingGtin),
          },
        });
        setNotice(
          "The matched product has an invalid saved GTIN. It was sent to Dashboard review; correct the GTIN before adding prices.",
        );
        return;
      }
      if (matchingProduct && gtin && existingGtin && gtin !== existingGtin) {
        await createIdentityReviewMutation.mutateAsync({
          productId: matchingProduct.id,
          reason: "gtin_conflict",
          matchMethod: match?.status === "matched" ? match.method : undefined,
          candidateCount: 1,
          payload: {
            name,
            product_brand: brand || null,
            supplied_gtin: gtin,
            existing_gtin: existingGtin,
          },
        });
        setNotice("The GTIN conflicts with the matched product. It was sent to Dashboard review.");
        return;
      }

      reusedExistingProduct = Boolean(matchingProduct);
      const savedProduct = editingProductId
        ? await updateProductMutation.mutateAsync({
            id: editingProductId,
            name,
            englishName,
            brand,
            gtin,
            unit,
            category,
            thumbnailUrl,
          })
        : matchingProduct
          ? await updateProductMutation.mutateAsync({
              id: matchingProduct.id,
              name: matchingProduct.name,
              englishName: matchingProduct.english_name?.trim() || englishName,
              brand: matchingProduct.brand?.trim() || brand,
              gtin: existingGtin || gtin,
              unit: matchingProduct.unit ?? unit,
              category: matchingProduct.category,
              thumbnailUrl: matchingProduct.thumbnail_url?.trim() || thumbnailUrl,
            })
          : await createProductMutation.mutateAsync({
              name,
              englishName,
              brand,
              gtin,
              unit,
              category,
              thumbnailUrl,
            });

      if (!savedProduct) {
        setNotice(editingProductId ? "Product was not updated." : "Product was not created.");
        return;
      }

      const creationErrors: string[] = [];
      for (const item of preparedPriceSets.activeSets) {
        try {
          const existingPrice = findExistingPriceForPeriod({
            prices,
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
          if (existingPrice) {
            await updatePriceEntryMutation.mutateAsync({
              id: existingPrice.id,
              ...payload,
            });
          } else {
            await createPriceEntryMutation.mutateAsync(payload);
          }
        } catch (error) {
          creationErrors.push(`Set ${item.row}: ${error instanceof Error ? error.message : "Price entry failed."}`);
        }
      }

      if (creationErrors.length > 0) {
        setNotice(`Product saved, but ${creationErrors.length} Store | Price set failed. ${creationErrors[0]}`);
        await loadAll(true);
        return;
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Product was not saved.");
      return;
    } finally {
      setSubmitting(false);
    }

    const savedPriceCount = preparedPriceSets.activeSets.length;
    const wasEditing = Boolean(editingProductId);
    resetProductForm();
    setProductModalOpen(false);
    if (reusedExistingProduct) {
      setNotice(
        savedPriceCount > 0
          ? `Existing product reused; ${savedPriceCount} Store Price set added or updated.`
          : "Existing product reused without new price data.",
      );
    } else {
      const productActionLabel = wasEditing ? "updated" : "created";
      setNotice(
        savedPriceCount > 0
          ? `Product ${productActionLabel} with ${savedPriceCount} Store Price set.`
          : `Product ${productActionLabel} without image or price data.`,
      );
    }
    await loadAll(true);
  }, [
    createIdentityReviewMutation,
    createPriceEntryMutation,
    createProductMutation,
    editingProductId,
    loadAll,
    prices,
    products,
    productCategory,
    productBrand,
    productGtin,
    productName,
    productEnglishName,
    productUnit,
    productStorePriceSets,
    productThumb,
    resetProductForm,
    setNotice,
    setProductImageUploading,
    setProductModalOpen,
    setProductThumb,
    setSubmitting,
    stores,
    uploadProductImageMutation,
    updatePriceEntryMutation,
    updateProductMutation,
  ]);

  const { handlePasteProductImage, handleProductImagePasteEvent, handleUploadProductImage } = useAdminProductImageUpload({
    setProductThumb,
    setProductImageUploading,
    setNotice,
    uploadProductImageMutation,
  });

  const { handleDownloadProductCsvTemplate, handleExportProductsCsv, handleImportProductsCsv } = useAdminProductCsvActions({
    products,
    productPriceStats,
    stores,
    setSubmitting,
    setNotice,
    loadAll,
    createProductMutation,
    updateProductMutation,
    createIdentityReviewMutation,
    createPriceEntryMutation,
  });

  const handleDeleteProduct = React.useCallback(
    async (id: string): Promise<boolean> => {
      setDeletingKey(`product:${id}`);
      try {
        await deleteProductMutation.mutateAsync(id);
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Product delete failed.");
        return false;
      } finally {
        setDeletingKey(null);
      }
      setNotice("Product deleted.");
      await loadAll(true);
      return true;
    },
    [deleteProductMutation, loadAll, setDeletingKey, setNotice],
  );

  const handleDeleteProducts = React.useCallback(
    async (ids: string[]): Promise<string[]> => {
      const uniqueIds = Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean)));
      if (uniqueIds.length === 0) return [];
      setDeletingKey("products:bulk");
      const failed: string[] = [];
      const deletedIds: string[] = [];
      try {
        for (const id of uniqueIds) {
          try {
            await deleteProductMutation.mutateAsync(id);
            deletedIds.push(id);
          } catch (error) {
            failed.push(error instanceof Error ? error.message : "Product delete failed.");
          }
        }
      } finally {
        setDeletingKey(null);
      }

      if (failed.length > 0) {
        setNotice(`Deleted ${uniqueIds.length - failed.length} products. Failed ${failed.length}: ${failed[0]}`);
      } else {
        setNotice(`Deleted ${uniqueIds.length} products.`);
      }
      await loadAll(true);
      return deletedIds;
    },
    [deleteProductMutation, loadAll, setDeletingKey, setNotice],
  );

  const handleResetProductFilters = React.useCallback(() => {
    resetProductFilters();
  }, [resetProductFilters]);

  return {
    addStorePriceSet,
    handleCreateProduct,
    handleDeleteProduct,
    handleDeleteProducts,
    handleDownloadProductCsvTemplate,
    handleExportProductsCsv,
    handleImportProductsCsv,
    handleOpenAddProduct,
    handleOpenEditProduct,
    handlePasteProductImage,
    handleProductImagePasteEvent,
    handleResetProductFilters,
    handleUploadProductImage,
    removeStorePriceSet,
    resetProductForm,
    updateStorePriceSet,
  };
}
