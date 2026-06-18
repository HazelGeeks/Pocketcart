import React from "react";
import { dateOnlyToIso } from "../utils/adminValidation";

type Mutation<TParams, TResult> = {
  mutateAsync: (params: TParams) => Promise<TResult>;
};

type Params = {
  editingPriceId: string | null;
  priceProductId: string;
  priceStoreId: string;
  priceValue: string;
  priceStartDate: string;
  priceEndDate: string;
  setSubmitting: (value: boolean) => void;
  setDeletingKey: (value: string | null) => void;
  setNotice: (value: string | null) => void;
  resetPriceForm: () => void;
  loadAll: (keepNotice?: boolean) => Promise<void>;
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
};

export default function useAdminPriceEntryActions({
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
}: Params) {
  const handleSavePriceEntry = React.useCallback(async () => {
    const productId = priceProductId.trim();
    const storeId = priceStoreId.trim();
    const price = priceValue.trim();
    const periodStart = priceStartDate.trim();
    const periodEnd = priceEndDate.trim();
    const periodStartIso = dateOnlyToIso(periodStart, false);
    const periodEndIso = dateOnlyToIso(periodEnd, true);

    if (!productId || !storeId || !price) {
      setNotice("Product ID, Store ID, and price are required.");
      return;
    }
    if (Number.isNaN(Number(price))) {
      setNotice("Price must be a valid number.");
      return;
    }
    if (periodStart && !periodStartIso) {
      setNotice("Invalid start date. Use YYYY-MM-DD.");
      return;
    }
    if (periodEnd && !periodEndIso) {
      setNotice("Invalid end date. Use YYYY-MM-DD.");
      return;
    }

    try {
      setSubmitting(true);
      if (editingPriceId) {
        await updatePriceEntryMutation.mutateAsync({
          id: editingPriceId,
          productId,
          storeId,
          price,
          observedAt: periodStartIso ?? undefined,
          periodEnd: periodEndIso ?? undefined,
        });
      } else {
        await createPriceEntryMutation.mutateAsync({
          productId,
          storeId,
          price,
          observedAt: periodStartIso ?? undefined,
          periodEnd: periodEndIso ?? undefined,
        });
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Price entry was not saved.");
      return;
    } finally {
      setSubmitting(false);
    }

    resetPriceForm();
    setNotice(editingPriceId ? "Price entry updated." : "Price entry added.");
    await loadAll(true);
  }, [
    createPriceEntryMutation,
    editingPriceId,
    loadAll,
    priceEndDate,
    priceProductId,
    priceStartDate,
    priceStoreId,
    priceValue,
    resetPriceForm,
    setNotice,
    setSubmitting,
    updatePriceEntryMutation,
  ]);

  const handleDeletePriceEntry = React.useCallback(
    async (id: string) => {
      setDeletingKey(`price:${id}`);
      try {
        await deletePriceEntryMutation.mutateAsync(id);
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Price entry delete failed.");
        return;
      } finally {
        setDeletingKey(null);
      }
      if (editingPriceId === id) resetPriceForm();
      setNotice("Price entry deleted.");
      await loadAll(true);
    },
    [deletePriceEntryMutation, editingPriceId, loadAll, resetPriceForm, setDeletingKey, setNotice],
  );

  return { handleSavePriceEntry, handleDeletePriceEntry };
}
