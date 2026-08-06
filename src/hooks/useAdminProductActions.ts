import React from "react";
import type { AdminProduct } from "../services/adminBackoffice";
import { createStorePriceSet, dateInputValue } from "../utils/adminScreenHelpers";
import type { UseAdminProductActionsParams } from "./adminProductActionTypes";
import useAdminProductCsvActions from "./useAdminProductCsvActions";
import useAdminProductImageUpload from "./useAdminProductImageUpload";
import useAdminProductSave from "./useAdminProductSave";

export default function useAdminProductActions(params: UseAdminProductActionsParams) {
  const updateStorePriceSet = React.useCallback(
    (id: string, field: "brand" | "storeId" | "price" | "periodStartDate" | "periodEndDate", value: string) => {
      params.setProductStorePriceSets((items) =>
        items.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
      );
    },
    [params.setProductStorePriceSets],
  );
  const addStorePriceSet = React.useCallback(() => {
    params.setProductStorePriceSets((items) => [...items, createStorePriceSet()]);
  }, [params.setProductStorePriceSets]);
  const removeStorePriceSet = React.useCallback((id: string) => {
    params.setProductStorePriceSets((items) => {
      if (items.length > 1) return items.filter((item) => item.id !== id);
      return items.map((item) => item.id === id
        ? { ...item, brand: "", storeId: "", price: "", periodStartDate: "", periodEndDate: "" }
        : item);
    });
  }, [params.setProductStorePriceSets]);

  const resetProductForm = React.useCallback(() => {
    params.setEditingProductId(null);
    params.setProductName("");
    params.setProductEnglishName("");
    params.setProductBrand("");
    params.setProductGtin("");
    params.setProductUnit("");
    params.setProductCategory("");
    params.setProductCategoryCustom("");
    params.setProductThumb("");
    params.setProductStorePriceSets([createStorePriceSet()]);
  }, [params]);
  const handleOpenAddProduct = React.useCallback(() => {
    resetProductForm();
    params.setProductModalOpen(true);
  }, [params.setProductModalOpen, resetProductForm]);
  const handleOpenEditProduct = React.useCallback((product: AdminProduct) => {
    const storeById = new Map(params.stores.map((store) => [store.id, store]));
    const priceSets = params.prices
      .filter((price) => price.product_id === product.id)
      .sort((a, b) => new Date(b.valid_from || b.observed_at).getTime() - new Date(a.valid_from || a.observed_at).getTime())
      .map((price) => {
        const store = storeById.get(price.store_id);
        return createStorePriceSet({
          brand: store?.brand?.trim() || (store ? "Other" : ""),
          storeId: price.store_id,
          price: price.price.toFixed(2),
          periodStartDate: dateInputValue(price.valid_from || price.observed_at),
          periodEndDate: dateInputValue(price.valid_to),
        });
      });
    params.setEditingProductId(product.id);
    params.setProductName(product.name);
    params.setProductEnglishName(product.english_name ?? "");
    params.setProductBrand(product.brand ?? "");
    params.setProductGtin(product.gtin ?? "");
    params.setProductUnit(product.unit ?? "");
    params.setProductCategory(product.category);
    params.setProductCategoryCustom(product.category);
    params.setProductThumb(product.thumbnail_url ?? "");
    params.setProductStorePriceSets(priceSets.length ? priceSets : [createStorePriceSet()]);
    params.setProductModalOpen(true);
  }, [params]);

  const handleCreateProduct = useAdminProductSave({ ...params, resetProductForm });
  const imageActions = useAdminProductImageUpload({
    setProductThumb: params.setProductThumb,
    setProductImageUploading: params.setProductImageUploading,
    setNotice: params.setNotice,
    uploadProductImageMutation: params.uploadProductImageMutation,
  });
  const csvActions = useAdminProductCsvActions({
    products: params.products,
    productPriceStats: params.productPriceStats,
    stores: params.stores,
    setSubmitting: params.setSubmitting,
    setNotice: params.setNotice,
    loadAll: params.loadAll,
    createProductMutation: params.createProductMutation,
    updateProductMutation: params.updateProductMutation,
    createIdentityReviewMutation: params.createIdentityReviewMutation,
    createPriceEntryMutation: params.createPriceEntryMutation,
  });

  const handleDeleteProduct = React.useCallback(async (id: string) => {
    params.setDeletingKey(`product:${id}`);
    try {
      await params.deleteProductMutation.mutateAsync(id);
      params.setNotice("Product deleted.");
      await params.loadAll(true);
      return true;
    } catch (error) {
      params.setNotice(error instanceof Error ? error.message : "Product delete failed.");
      return false;
    } finally {
      params.setDeletingKey(null);
    }
  }, [params]);
  const handleDeleteProducts = React.useCallback(async (ids: string[]) => {
    const uniqueIds = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
    if (!uniqueIds.length) return [];
    params.setDeletingKey("products:bulk");
    const failed: string[] = [];
    const deleted: string[] = [];
    try {
      for (const id of uniqueIds) {
        try {
          await params.deleteProductMutation.mutateAsync(id);
          deleted.push(id);
        } catch (error) {
          failed.push(error instanceof Error ? error.message : "Product delete failed.");
        }
      }
    } finally {
      params.setDeletingKey(null);
    }
    params.setNotice(failed.length
      ? `Deleted ${deleted.length} products. Failed ${failed.length}: ${failed[0]}`
      : `Deleted ${deleted.length} products.`);
    await params.loadAll(true);
    return deleted;
  }, [params]);

  return {
    addStorePriceSet,
    handleCreateProduct,
    handleDeleteProduct,
    handleDeleteProducts,
    ...csvActions,
    handleOpenAddProduct,
    handleOpenEditProduct,
    ...imageActions,
    handleResetProductFilters: params.resetProductFilters,
    removeStorePriceSet,
    resetProductForm,
    updateStorePriceSet,
  };
}
