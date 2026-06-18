import React from "react";
import { Platform } from "react-native";
import type { AdminProduct } from "../services/adminBackoffice";
import type { ProductPriceStats } from "../utils/adminScreenHelpers";
import { PRODUCT_IMPORT_HEADERS, downloadCsvFile, productsToCsv } from "../utils/adminScreenHelpers";
import { csvHeaderKey, csvRowValue, parseCsvRows } from "../utils/adminValidation";

type Mutation<TParams, TResult> = {
  mutateAsync: (params: TParams) => Promise<TResult>;
};

type Params = {
  filteredProducts: AdminProduct[];
  productPriceStats: Map<string, ProductPriceStats>;
  setSubmitting: (value: boolean) => void;
  setNotice: (value: string | null) => void;
  loadAll: (keepNotice?: boolean) => Promise<void>;
  createProductMutation: Mutation<{ name: string; category: string; thumbnailUrl?: string }, AdminProduct | null>;
};

export default function useAdminProductCsvActions({
  filteredProducts,
  productPriceStats,
  setSubmitting,
  setNotice,
  loadAll,
  createProductMutation,
}: Params) {
  const handleExportProductsCsv = React.useCallback(() => {
    if (filteredProducts.length === 0) {
      setNotice("There are no products to export.");
      return;
    }

    const error = downloadCsvFile("products", productsToCsv(filteredProducts, productPriceStats));
    if (error) {
      setNotice(error);
      return;
    }
    setNotice(`Exported ${filteredProducts.length} products to CSV.`);
  }, [filteredProducts, productPriceStats, setNotice]);

  const handleImportProductsCsv = React.useCallback(() => {
    if (Platform.OS !== "web") {
      setNotice("Product CSV import is currently available on web admin.");
      return;
    }

    const doc = (globalThis as { document?: any }).document;
    if (!doc || typeof doc.createElement !== "function") {
      setNotice("Product CSV import is not available in this browser.");
      return;
    }

    const input = doc.createElement("input");
    input.type = "file";
    input.accept = "text/csv,.csv";
    input.multiple = false;
    input.onchange = () => {
      const selected = input.files?.[0];
      if (!selected) return;
      void (async () => {
        setSubmitting(true);
        try {
          const text = await selected.text();
          const parsed = parseCsvRows(text).filter((row) => row.some((cell) => cell.trim()));
          const [headerRow, ...dataRows] = parsed;
          if (!headerRow || dataRows.length === 0) {
            setNotice("CSV must include a header row and at least one product row.");
            return;
          }

          const headers = headerRow.map(csvHeaderKey);
          const created: string[] = [];
          const skipped: string[] = [];

          for (const [index, values] of dataRows.entries()) {
            const record: Record<string, string> = {};
            headers.forEach((header, headerIndex) => {
              record[header] = values[headerIndex] ?? "";
            });

            const name = csvRowValue(record, PRODUCT_IMPORT_HEADERS.name);
            const category = csvRowValue(record, PRODUCT_IMPORT_HEADERS.category);
            const thumbnailUrl = csvRowValue(record, PRODUCT_IMPORT_HEADERS.thumbnailUrl);

            if (!name || !category) {
              skipped.push(`row ${index + 2}`);
              continue;
            }

            try {
              const product = await createProductMutation.mutateAsync({ name, category, thumbnailUrl });
              if (product) created.push(product.id);
            } catch (error) {
              skipped.push(`row ${index + 2}: ${error instanceof Error ? error.message : "failed"}`);
            }
          }

          await loadAll(true);
          setNotice(
            `Imported ${created.length} products from CSV.${
              skipped.length > 0 ? ` Skipped ${skipped.length}: ${skipped.slice(0, 3).join(", ")}` : ""
            }`,
          );
        } catch (error) {
          setNotice(error instanceof Error ? error.message : "Product CSV import failed.");
        } finally {
          setSubmitting(false);
        }
      })();
    };
    input.click();
  }, [createProductMutation, loadAll, setNotice, setSubmitting]);

  return { handleExportProductsCsv, handleImportProductsCsv };
}
