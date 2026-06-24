import React from "react";
import type { AdminPriceEntry, AdminProduct, AdminStore } from "../services/adminBackoffice";
import type { ProductPriceStats, StorePriceSetInput } from "../utils/adminScreenHelpers";
import { createStorePriceSet, dateInputValue } from "../utils/adminScreenHelpers";
import { prepareProductPriceSets } from "../utils/productStorePriceSets";
import { openWebDatePicker } from "../utils/webDatePicker";
import useAdminPriceEntryActions from "./useAdminPriceEntryActions";
import useAdminProductCsvActions from "./useAdminProductCsvActions";
import useAdminProductImageUpload from "./useAdminProductImageUpload";

type Mutation<TParams, TResult> = {
  mutateAsync: (params: TParams) => Promise<TResult>;
};

type UseAdminProductActionsParams = {
  productName: string;
  productEnglishName: string;
  productUnit: string;
  productCategory: string;
  productCategoryCustom: string;
  productThumb: string;
  productStorePriceSets: StorePriceSetInput[];
  productPeriodStartDate: string;
  productPeriodEndDate: string;
  productImageUploading: boolean;
  editingProductId: string | null;
  editingPriceId: string | null;
  priceProductId: string;
  priceStoreId: string;
  priceValue: string;
  priceStartDate: string;
  priceEndDate: string;
  filteredProducts: AdminProduct[];
  productPriceStats: Map<string, ProductPriceStats>;
  stores: AdminStore[];
  setProductName: (value: string) => void;
  setProductEnglishName: (value: string) => void;
  setProductUnit: (value: string) => void;
  setProductCategory: (value: string) => void;
  setProductCategoryCustom: (value: string) => void;
  setProductThumb: (value: string) => void;
  setProductStorePriceSets: React.Dispatch<React.SetStateAction<StorePriceSetInput[]>>;
  setProductPeriodStartDate: (value: string) => void;
  setProductPeriodEndDate: (value: string) => void;
  setProductModalOpen: (value: boolean) => void;
  setEditingProductId: (value: string | null) => void;
  setProductImageUploading: (value: boolean) => void;
  setEditingPriceId: (value: string | null) => void;
  setPriceProductId: (value: string) => void;
  setPriceStoreId: (value: string) => void;
  setPriceValue: (value: string) => void;
  setPriceStartDate: (value: string) => void;
  setPriceEndDate: (value: string) => void;
  setSubmitting: (value: boolean) => void;
  setDeletingKey: (value: string | null) => void;
  setNotice: (value: string | null) => void;
  resetProductFilters: () => void;
  loadAll: (keepNotice?: boolean) => Promise<void>;
  createProductMutation: Mutation<
    { name: string; englishName?: string; category: string; unit?: string; thumbnailUrl?: string },
    AdminProduct | null
  >;
  updateProductMutation: Mutation<
    { id: string; name: string; englishName?: string; category: string; unit?: string; thumbnailUrl?: string },
    AdminProduct | null
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
  deletePriceEntryMutation: Mutation<string, unknown>;
  uploadProductImageMutation: Mutation<{ file: Blob; fileName?: string; contentType?: string }, { publicUrl: string } | null>;
};

export default function useAdminProductActions({
  productName,
  productEnglishName,
  productUnit,
  productCategory,
  productThumb,
  productStorePriceSets,
  productPeriodStartDate,
  productPeriodEndDate,
  editingProductId,
  editingPriceId,
  priceProductId,
  priceStoreId,
  priceValue,
  priceStartDate,
  priceEndDate,
  filteredProducts,
  stores,
  productPriceStats,
  setProductName,
  setProductEnglishName,
  setProductUnit,
  setProductCategory,
  setProductCategoryCustom,
  setProductThumb,
  setProductStorePriceSets,
  setProductPeriodStartDate,
  setProductPeriodEndDate,
  setProductModalOpen,
  setEditingProductId,
  setProductImageUploading,
  setEditingPriceId,
  setPriceProductId,
  setPriceStoreId,
  setPriceValue,
  setPriceStartDate,
  setPriceEndDate,
  setSubmitting,
  setDeletingKey,
  setNotice,
  resetProductFilters,
  loadAll,
  createProductMutation,
  updateProductMutation,
  deleteProductMutation,
  createPriceEntryMutation,
  updatePriceEntryMutation,
  deletePriceEntryMutation,
  uploadProductImageMutation,
}: UseAdminProductActionsParams) {
  const updateStorePriceSet = React.useCallback(
    (id: string, field: "storeId" | "price", value: string) => {
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
          return prev.map((item) => (item.id === id ? { ...item, storeId: "", price: "" } : item));
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
    setProductUnit("");
    setProductCategory("");
    setProductCategoryCustom("");
    setProductThumb("");
    setProductStorePriceSets([createStorePriceSet()]);
    setProductPeriodStartDate("");
    setProductPeriodEndDate("");
  }, [
    setEditingProductId,
    setProductEnglishName,
    setProductCategory,
    setProductCategoryCustom,
    setProductName,
    setProductUnit,
    setProductPeriodEndDate,
    setProductPeriodStartDate,
    setProductStorePriceSets,
    setProductThumb,
  ]);

  const resetPriceForm = React.useCallback(() => {
    setEditingPriceId(null);
    setPriceProductId("");
    setPriceStoreId("");
    setPriceValue("");
    setPriceStartDate("");
    setPriceEndDate("");
  }, [setEditingPriceId, setPriceEndDate, setPriceProductId, setPriceStartDate, setPriceStoreId, setPriceValue]);

  const handleOpenAddProduct = React.useCallback(() => {
    resetProductForm();
    setProductModalOpen(true);
  }, [resetProductForm, setProductModalOpen]);

  const handleOpenEditProduct = React.useCallback(
    (product: AdminProduct) => {
      setEditingProductId(product.id);
      setProductName(product.name);
      setProductEnglishName(product.english_name ?? "");
      setProductUnit(product.unit ?? "");
      setProductCategory(product.category);
      setProductCategoryCustom(product.category);
      setProductThumb(product.thumbnail_url ?? "");
      setProductStorePriceSets([createStorePriceSet()]);
      setProductPeriodStartDate("");
      setProductPeriodEndDate("");
      setProductModalOpen(true);
    },
    [
      setEditingProductId,
      setProductCategory,
      setProductCategoryCustom,
      setProductEnglishName,
      setProductModalOpen,
      setProductName,
      setProductUnit,
      setProductPeriodEndDate,
      setProductPeriodStartDate,
      setProductStorePriceSets,
      setProductThumb,
    ],
  );

  const handleOpenEditPrice = React.useCallback(
    (price: AdminPriceEntry) => {
      setEditingPriceId(price.id);
      setPriceProductId(price.product_id);
      setPriceStoreId(price.store_id);
      setPriceValue(price.price.toFixed(2));
      setPriceStartDate(dateInputValue(price.valid_from || price.observed_at));
      setPriceEndDate(dateInputValue(price.valid_to));
    },
    [setEditingPriceId, setPriceEndDate, setPriceProductId, setPriceStartDate, setPriceStoreId, setPriceValue],
  );

  const handleCreateProduct = React.useCallback(async () => {
    const name = productName.trim();
    const englishName = productEnglishName.trim();
    const unit = productUnit.trim();
    const category = productCategory.trim();

    if (!name || !category) {
      setNotice("Product name and category are required.");
      return;
    }
    const preparedPriceSets = prepareProductPriceSets({
      sets: productStorePriceSets,
      periodStartDate: productPeriodStartDate,
      periodEndDate: productPeriodEndDate,
    });
    if (!preparedPriceSets.ok) {
      setNotice(preparedPriceSets.error);
      return;
    }

    try {
      setSubmitting(true);
      const savedProduct = editingProductId
        ? await updateProductMutation.mutateAsync({
            id: editingProductId,
            name,
            englishName,
            unit,
            category,
            thumbnailUrl: productThumb,
          })
        : await createProductMutation.mutateAsync({ name, englishName, unit, category, thumbnailUrl: productThumb });

      if (!savedProduct) {
        setNotice(editingProductId ? "Product was not updated." : "Product was not created.");
        return;
      }

      const creationErrors: string[] = [];
      for (const item of preparedPriceSets.activeSets) {
        try {
          await createPriceEntryMutation.mutateAsync({
            productId: savedProduct.id,
            storeId: item.storeId,
            price: item.price,
            observedAt: preparedPriceSets.periodStartIso ?? undefined,
            periodEnd: preparedPriceSets.periodEndIso ?? undefined,
          });
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
    setNotice(
      savedPriceCount > 0
        ? `Product ${wasEditing ? "updated" : "created"} with ${savedPriceCount} Store | Price set.`
        : `Product ${wasEditing ? "updated" : "created"} without image or price data.`,
    );
    await loadAll(true);
  }, [
    createPriceEntryMutation,
    createProductMutation,
    editingProductId,
    loadAll,
    productCategory,
    productName,
    productEnglishName,
    productUnit,
    productPeriodEndDate,
    productPeriodStartDate,
    productStorePriceSets,
    productThumb,
    resetProductForm,
    setNotice,
    setProductModalOpen,
    setSubmitting,
    updateProductMutation,
  ]);

  const handlePickPeriodDate = React.useCallback(
    (type: "start" | "end") => {
      const result = openWebDatePicker({
        value: type === "start" ? productPeriodStartDate : productPeriodEndDate,
        onChange: type === "start" ? setProductPeriodStartDate : setProductPeriodEndDate,
        nativeMessage: "Date picker is currently available on web admin. On native app, use YYYY-MM-DD.",
      });
      if (!result.ok) setNotice(result.error);
    },
    [productPeriodEndDate, productPeriodStartDate, setNotice, setProductPeriodEndDate, setProductPeriodStartDate],
  );

  const handleUploadProductImage = useAdminProductImageUpload({
    setProductThumb,
    setProductImageUploading,
    setNotice,
    uploadProductImageMutation,
  });

  const { handleExportProductsCsv, handleImportProductsCsv } = useAdminProductCsvActions({
    filteredProducts,
    productPriceStats,
    stores,
    setSubmitting,
    setNotice,
    loadAll,
    createProductMutation,
    createPriceEntryMutation,
  });

  const { handleSavePriceEntry, handleDeletePriceEntry } = useAdminPriceEntryActions({
    editingPriceId,
    priceProductId,
    priceStoreId,
    priceValue,
    priceStartDate,
    priceEndDate,
    setSubmitting,
    setDeletingKey,
    setNotice,
    resetPriceForm,
    loadAll,
    createPriceEntryMutation,
    updatePriceEntryMutation,
    deletePriceEntryMutation,
  });

  const handleDeleteProduct = React.useCallback(
    async (id: string) => {
      setDeletingKey(`product:${id}`);
      try {
        await deleteProductMutation.mutateAsync(id);
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Product delete failed.");
        return;
      } finally {
        setDeletingKey(null);
      }
      setNotice("Product deleted.");
      await loadAll(true);
    },
    [deleteProductMutation, loadAll, setDeletingKey, setNotice],
  );

  const handleResetProductFilters = React.useCallback(() => {
    resetProductFilters();
  }, [resetProductFilters]);

  return {
    addStorePriceSet,
    handleCreateProduct,
    handleDeletePriceEntry,
    handleDeleteProduct,
    handleExportProductsCsv,
    handleImportProductsCsv,
    handleOpenAddProduct,
    handleOpenEditPrice,
    handleOpenEditProduct,
    handlePickPeriodDate,
    handleResetProductFilters,
    handleSavePriceEntry,
    handleUploadProductImage,
    removeStorePriceSet,
    resetPriceForm,
    resetProductForm,
    updateStorePriceSet,
  };
}
