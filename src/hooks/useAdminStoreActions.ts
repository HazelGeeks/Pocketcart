import React from "react";
import type { AdminAuditLog, AdminStore } from "../services/adminBackoffice";
import type { StorePriceStats } from "../utils/adminScreenHelpers";
import {
  coordinateValidationMessage,
  type StoreImportPreviewRow,
} from "../utils/adminValidation";
import { exportStoresCsv, importStoresCsv } from "../utils/storeCsvActions";

type Mutation<TParams, TResult> = {
  mutateAsync: (params: TParams) => Promise<TResult>;
};

type StoreMutationParams = {
  name: string;
  area: string;
  latitude: string;
  longitude: string;
  priceNote?: string;
  address?: string;
  placeId?: string;
  phone?: string;
  website?: string;
  hours?: string;
  storeType?: string;
  isActive?: boolean;
};

type AuditMutationParams = {
  action: string;
  entityType: string;
  entityId?: string;
  summary: string;
  metadata?: Record<string, unknown>;
};

type Params = {
  displayStores: AdminStore[];
  stores: AdminStore[];
  editingStoreId: string | null;
  storeName: string;
  storeArea: string;
  storeLatitude: string;
  storeLongitude: string;
  storePriceNote: string;
  storeAddress: string;
  storePlaceId: string;
  storePhone: string;
  storeWebsite: string;
  storeHours: string;
  storeType: string;
  storeIsActive: boolean;
  storeImportPreviewRows: StoreImportPreviewRow[];
  storeDeleteCandidate: AdminStore | null;
  storePriceStats: Map<string, StorePriceStats>;
  setEditingStoreId: (value: string | null) => void;
  setStoreModalOpen: (value: boolean) => void;
  setStoreName: (value: string) => void;
  setStoreArea: (value: string) => void;
  setStoreLatitude: (value: string) => void;
  setStoreLongitude: (value: string) => void;
  setStorePriceNote: (value: string) => void;
  setStoreAddress: (value: string) => void;
  setStorePlaceId: (value: string) => void;
  setStorePhone: (value: string) => void;
  setStoreWebsite: (value: string) => void;
  setStoreHours: (value: string) => void;
  setStoreType: (value: string) => void;
  setStoreIsActive: (value: boolean) => void;
  setStoreImportPreviewRows: (value: StoreImportPreviewRow[]) => void;
  setStoreImportPreviewOpen: (value: boolean) => void;
  setStoreDeleteCandidate: (value: AdminStore | null) => void;
  setSubmitting: (value: boolean) => void;
  setDeletingKey: (value: string | null) => void;
  setNotice: (value: string | null) => void;
  loadAll: (keepNotice?: boolean) => Promise<void>;
  createStoreMutation: Mutation<StoreMutationParams, AdminStore | null>;
  updateStoreMutation: Mutation<StoreMutationParams & { id: string }, AdminStore | null>;
  deleteStoreMutation: Mutation<string, unknown>;
  createAuditLogMutation: Mutation<AuditMutationParams, AdminAuditLog | null>;
};

export default function useAdminStoreActions({
  displayStores,
  stores,
  editingStoreId,
  storeName,
  storeArea,
  storeLatitude,
  storeLongitude,
  storePriceNote,
  storeAddress,
  storePlaceId,
  storePhone,
  storeWebsite,
  storeHours,
  storeType,
  storeIsActive,
  storeImportPreviewRows,
  storeDeleteCandidate,
  storePriceStats,
  setEditingStoreId,
  setStoreModalOpen,
  setStoreName,
  setStoreArea,
  setStoreLatitude,
  setStoreLongitude,
  setStorePriceNote,
  setStoreAddress,
  setStorePlaceId,
  setStorePhone,
  setStoreWebsite,
  setStoreHours,
  setStoreType,
  setStoreIsActive,
  setStoreImportPreviewRows,
  setStoreImportPreviewOpen,
  setStoreDeleteCandidate,
  setSubmitting,
  setDeletingKey,
  setNotice,
  loadAll,
  createStoreMutation,
  updateStoreMutation,
  deleteStoreMutation,
  createAuditLogMutation,
}: Params) {
  const resetStoreForm = React.useCallback(() => {
    setEditingStoreId(null);
    setStoreName("");
    setStoreArea("");
    setStoreLatitude("");
    setStoreLongitude("");
    setStorePriceNote("");
    setStoreAddress("");
    setStorePlaceId("");
    setStorePhone("");
    setStoreWebsite("");
    setStoreHours("");
    setStoreType("grocery");
    setStoreIsActive(true);
  }, [
    setEditingStoreId,
    setStoreAddress,
    setStoreArea,
    setStoreHours,
    setStoreIsActive,
    setStoreLatitude,
    setStoreLongitude,
    setStoreName,
    setStorePhone,
    setStorePlaceId,
    setStorePriceNote,
    setStoreType,
    setStoreWebsite,
  ]);

  const writeAuditLog = React.useCallback(
    async (params: AuditMutationParams) => {
      try {
        await createAuditLogMutation.mutateAsync(params);
      } catch (error) {
        setNotice(
          `Saved, but audit log failed. ${error instanceof Error ? error.message : "Unknown audit log error."}`,
        );
      }
    },
    [createAuditLogMutation, setNotice],
  );

  const handleOpenEditStore = React.useCallback(
    (store: AdminStore) => {
      setEditingStoreId(store.id);
      setStoreName(store.name);
      setStoreArea(store.area);
      setStoreLatitude(String(store.latitude));
      setStoreLongitude(String(store.longitude));
      setStorePriceNote(store.price_note ?? "");
      setStoreAddress(store.address ?? "");
      setStorePlaceId(store.place_id ?? "");
      setStorePhone(store.phone ?? "");
      setStoreWebsite(store.website ?? "");
      setStoreHours(store.hours ?? "");
      setStoreType(store.store_type || "grocery");
      setStoreIsActive(store.is_active);
      setStoreModalOpen(true);
    },
    [
      setEditingStoreId,
      setStoreAddress,
      setStoreArea,
      setStoreHours,
      setStoreIsActive,
      setStoreLatitude,
      setStoreLongitude,
      setStoreModalOpen,
      setStoreName,
      setStorePhone,
      setStorePlaceId,
      setStorePriceNote,
      setStoreType,
      setStoreWebsite,
    ],
  );

  const handleOpenAddStore = React.useCallback(() => {
    resetStoreForm();
    setStoreModalOpen(true);
  }, [resetStoreForm, setStoreModalOpen]);

  const handleExportStoresCsv = React.useCallback(() => {
    const result = exportStoresCsv({ stores: displayStores });
    setNotice(result.message);
  }, [displayStores, setNotice]);

  const handleImportStoresCsv = React.useCallback(() => {
    void (async () => {
      const result = await importStoresCsv({ existingStores: displayStores });
      if (result.ok && result.previewRows) {
        setStoreImportPreviewRows(result.previewRows);
        setStoreImportPreviewOpen(true);
      }
      setNotice(result.message);
    })();
  }, [displayStores, setNotice, setStoreImportPreviewOpen, setStoreImportPreviewRows]);

  const handleConfirmStoreImport = React.useCallback(async () => {
    const readyRows = storeImportPreviewRows.filter((row) => row.status === "ready");
    if (readyRows.length === 0) {
      setNotice("There are no ready store rows to import.");
      return;
    }

    setSubmitting(true);
    const created: string[] = [];
    const skipped: string[] = [];
    try {
      for (const row of readyRows) {
        try {
          const store = await createStoreMutation.mutateAsync({
            name: row.name,
            area: row.area,
            latitude: row.latitude,
            longitude: row.longitude,
            priceNote: row.priceNote,
            address: row.address,
            placeId: row.placeId,
            phone: row.phone,
            website: row.website,
            hours: row.hours,
            storeType: row.storeType,
            isActive: row.isActive,
          });
          if (store) created.push(store.id);
        } catch (error) {
          skipped.push(`row ${row.rowNumber}: ${error instanceof Error ? error.message : "failed"}`);
        }
      }

      if (created.length > 0) {
        await writeAuditLog({
          action: "import",
          entityType: "store",
          summary: `Imported ${created.length} stores from CSV`,
          metadata: {
            createdCount: created.length,
            skippedCount: storeImportPreviewRows.length - created.length,
          },
        });
      }
      await loadAll(true);
      setStoreImportPreviewOpen(false);
      setStoreImportPreviewRows([]);
      setNotice(
        `Imported ${created.length} stores from CSV.${
          skipped.length > 0 ? ` Skipped ${skipped.length}: ${skipped.slice(0, 3).join(", ")}` : ""
        }`,
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Store CSV import failed.");
    } finally {
      setSubmitting(false);
    }
  }, [
    createStoreMutation,
    loadAll,
    setNotice,
    setStoreImportPreviewOpen,
    setStoreImportPreviewRows,
    setSubmitting,
    storeImportPreviewRows,
    writeAuditLog,
  ]);

  const handleSaveStore = React.useCallback(async () => {
    const name = storeName.trim();
    const area = storeArea.trim();
    const latitude = storeLatitude.trim();
    const longitude = storeLongitude.trim();
    const priceNote = storePriceNote.trim();
    const address = storeAddress.trim();
    const placeId = storePlaceId.trim();
    const phone = storePhone.trim();
    const website = storeWebsite.trim();
    const hours = storeHours.trim();

    if (!name || !area || !latitude || !longitude) {
      setNotice("Store name, area, latitude, and longitude are required.");
      return;
    }
    const coordinateError = coordinateValidationMessage(latitude, longitude);
    if (coordinateError) {
      setNotice(coordinateError);
      return;
    }

    const duplicate = stores.find((store) => {
      if (editingStoreId && store.id === editingStoreId) return false;
      return store.name.trim().toLowerCase() === name.toLowerCase() && store.area.trim().toLowerCase() === area.toLowerCase();
    });
    if (duplicate) {
      setNotice("A store with the same name and area already exists.");
      return;
    }

    try {
      setSubmitting(true);
      const savedStore = editingStoreId
        ? await updateStoreMutation.mutateAsync({
            id: editingStoreId,
            name,
            area,
            latitude,
            longitude,
            priceNote,
            address,
            placeId,
            phone,
            website,
            hours,
            storeType,
            isActive: storeIsActive,
          })
        : await createStoreMutation.mutateAsync({
            name,
            area,
            latitude,
            longitude,
            priceNote,
            address,
            placeId,
            phone,
            website,
            hours,
            storeType,
            isActive: storeIsActive,
          });

      if (savedStore) {
        await writeAuditLog({
          action: editingStoreId ? "update" : "create",
          entityType: "store",
          entityId: savedStore.id,
          summary: `${editingStoreId ? "Updated" : "Created"} store ${savedStore.name}`,
          metadata: {
            name,
            area,
            latitude,
            longitude,
            address,
            placeId,
            phone,
            website,
            hours,
            storeType,
            isActive: storeIsActive,
          },
        });
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Store was not saved.");
      return;
    } finally {
      setSubmitting(false);
    }

    const wasEditing = Boolean(editingStoreId);
    resetStoreForm();
    setStoreModalOpen(false);
    setNotice(wasEditing ? "Store updated." : "Store added.");
    await loadAll(true);
  }, [
    createStoreMutation,
    editingStoreId,
    loadAll,
    resetStoreForm,
    setNotice,
    setStoreModalOpen,
    setSubmitting,
    storeAddress,
    storeArea,
    storeHours,
    storeIsActive,
    storeLatitude,
    storeLongitude,
    storeName,
    storePhone,
    storePlaceId,
    storePriceNote,
    storeType,
    storeWebsite,
    stores,
    updateStoreMutation,
    writeAuditLog,
  ]);

  const handleRequestDeleteStore = React.useCallback(
    (store: AdminStore) => {
      setStoreDeleteCandidate(store);
    },
    [setStoreDeleteCandidate],
  );

  const handleConfirmDeleteStore = React.useCallback(async () => {
    if (!storeDeleteCandidate) return;
    const target = storeDeleteCandidate;
    setDeletingKey(`store:${target.id}`);
    try {
      await deleteStoreMutation.mutateAsync(target.id);
      await writeAuditLog({
        action: "delete",
        entityType: "store",
        entityId: target.id,
        summary: `Deleted store ${target.name}`,
        metadata: {
          name: target.name,
          area: target.area,
          linkedPriceRows: storePriceStats.get(target.id)?.priceCount ?? 0,
        },
      });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Store delete failed.");
      return;
    } finally {
      setDeletingKey(null);
    }
    if (editingStoreId === target.id) {
      resetStoreForm();
    }
    setStoreDeleteCandidate(null);
    setNotice("Store deleted.");
    await loadAll(true);
  }, [
    deleteStoreMutation,
    editingStoreId,
    loadAll,
    resetStoreForm,
    setDeletingKey,
    setNotice,
    setStoreDeleteCandidate,
    storeDeleteCandidate,
    storePriceStats,
    writeAuditLog,
  ]);

  return {
    handleConfirmDeleteStore,
    handleConfirmStoreImport,
    handleExportStoresCsv,
    handleImportStoresCsv,
    handleOpenAddStore,
    handleOpenEditStore,
    handleRequestDeleteStore,
    handleSaveStore,
    resetStoreForm,
  };
}
