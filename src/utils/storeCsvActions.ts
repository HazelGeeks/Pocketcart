import { Platform } from "react-native";
import type { AdminStore } from "../services/adminBackoffice";
import { downloadCsvFile, storesToCsv } from "./adminScreenHelpers";
import { buildStoreImportPreview, parseCsvRows, type StoreImportPreviewRow } from "./adminValidation";

type StoreCsvExportParams = {
  stores: AdminStore[];
};

type StoreCsvImportParams = {
  existingStores: AdminStore[];
};

type StoreCsvActionResult =
  | { ok: true; message: string; previewRows?: StoreImportPreviewRow[] }
  | { ok: false; message: string };

export function exportStoresCsv({ stores }: StoreCsvExportParams): StoreCsvActionResult {
  if (stores.length === 0) {
    return { ok: false, message: "There are no stores to export." };
  }

  const error = downloadCsvFile("stores", storesToCsv(stores));
  if (error) {
    return { ok: false, message: error };
  }

  return { ok: true, message: `Exported ${stores.length} stores to CSV.` };
}

export function importStoresCsv({
  existingStores,
}: StoreCsvImportParams): Promise<StoreCsvActionResult> {
  if (Platform.OS !== "web") {
    return Promise.resolve({
      ok: false,
      message: "Store CSV import is currently available on web admin.",
    });
  }

  const doc = (globalThis as { document?: any }).document;
  if (!doc || typeof doc.createElement !== "function") {
    return Promise.resolve({
      ok: false,
      message: "Store CSV import is not available in this browser.",
    });
  }

  return new Promise((resolve) => {
    const input = doc.createElement("input");
    input.type = "file";
    input.accept = "text/csv,.csv";
    input.multiple = false;
    input.onchange = () => {
      const selected = input.files?.[0];
      if (!selected) {
        resolve({ ok: false, message: "No CSV file selected." });
        return;
      }

      void (async () => {
        try {
          const text = await selected.text();
          const parsed = parseCsvRows(text).filter((row) => row.some((cell) => cell.trim()));
          const [headerRow, ...dataRows] = parsed;
          if (!headerRow || dataRows.length === 0) {
            resolve({
              ok: false,
              message: "CSV must include a header row and at least one store row.",
            });
            return;
          }

          const previewRows = buildStoreImportPreview(headerRow, dataRows, existingStores);
          const readyCount = previewRows.filter((row) => row.status === "ready").length;
          const skippedCount = previewRows.length - readyCount;
          resolve({
            ok: true,
            message: `Prepared Store CSV preview: ${readyCount} ready, ${skippedCount} skipped.`,
            previewRows,
          });
        } catch (error) {
          resolve({
            ok: false,
            message: error instanceof Error ? error.message : "Store CSV import failed.",
          });
        }
      })();
    };
    input.click();
  });
}
