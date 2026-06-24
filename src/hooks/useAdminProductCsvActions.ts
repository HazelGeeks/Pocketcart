import React from "react";
import { Platform } from "react-native";
import type { AdminProduct, AdminStore } from "../services/adminBackoffice";
import type { ProductPriceStats } from "../utils/adminScreenHelpers";
import { PRODUCT_IMPORT_HEADERS, downloadCsvFile, productsToCsv } from "../utils/adminScreenHelpers";
import { csvHeaderKey, csvRowValue, parseCsvRows } from "../utils/adminValidation";

type Mutation<TParams, TResult> = {
  mutateAsync: (params: TParams) => Promise<TResult>;
};

type Params = {
  filteredProducts: AdminProduct[];
  productPriceStats: Map<string, ProductPriceStats>;
  stores: AdminStore[];
  setSubmitting: (value: boolean) => void;
  setNotice: (value: string | null) => void;
  loadAll: (keepNotice?: boolean) => Promise<void>;
  createProductMutation: Mutation<
    { name: string; englishName?: string; category: string; unit?: string; thumbnailUrl?: string },
    AdminProduct | null
  >;
  createPriceEntryMutation?: Mutation<
    {
      productId: string;
      storeId: string;
      price: string;
      observedAt?: string;
      periodEnd?: string;
    },
    unknown
  >;
};

function normalizePrice(value: string): string {
  const normalized = value.trim().replace(/,/g, "");
  const matched = normalized.match(/-?\d+(?:\.\d+)?/g);
  if (!matched || matched.length === 0) return "";
  return matched[0];
}

function parseStoreIdCandidate(candidate: string): string | null {
  const trimmed = candidate.trim();
  if (!trimmed) return null;
  return trimmed;
}

export default function useAdminProductCsvActions({
  filteredProducts,
  productPriceStats,
  stores,
  setSubmitting,
  setNotice,
  loadAll,
  createProductMutation,
  createPriceEntryMutation,
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
          const priceImported: string[] = [];
          const priceSkipped: string[] = [];

          const storeById = new Map(stores.map((store) => [store.id.trim().toLowerCase(), store.id]));
          const storeIdByName = new Map(
            stores.map((store) => [store.name.trim().toLowerCase(), store.id]),
          );

          const resolveStoreId = (storeIdValue: string, storeNameValue: string): string | null => {
            const directStoreId = parseStoreIdCandidate(storeIdValue);
            if (directStoreId) {
              return storeById.get(directStoreId.toLowerCase()) ?? directStoreId;
            }

            const normalizedName = storeNameValue.trim().toLowerCase();
            if (!normalizedName) return null;
            return storeIdByName.get(normalizedName) ?? null;
          };

          for (const [index, values] of dataRows.entries()) {
            const record: Record<string, string> = {};
            headers.forEach((header, headerIndex) => {
              record[header] = values[headerIndex] ?? "";
            });

            const name = csvRowValue(record, PRODUCT_IMPORT_HEADERS.name);
            const englishName = csvRowValue(record, PRODUCT_IMPORT_HEADERS.englishName);
            const category = csvRowValue(record, PRODUCT_IMPORT_HEADERS.category);
            const thumbnailUrl = csvRowValue(record, PRODUCT_IMPORT_HEADERS.thumbnailUrl);
            const unit = csvRowValue(record, PRODUCT_IMPORT_HEADERS.unit);

            const rawPrice = csvRowValue(record, PRODUCT_IMPORT_HEADERS.price);
            const rawStoreId = csvRowValue(record, PRODUCT_IMPORT_HEADERS.storeId);
            const rawStoreName = csvRowValue(record, PRODUCT_IMPORT_HEADERS.storeName);
            const observedAt = csvRowValue(record, PRODUCT_IMPORT_HEADERS.observedAt);
            const periodEnd = csvRowValue(record, PRODUCT_IMPORT_HEADERS.periodEnd);

            if (!name || !category) {
              skipped.push(`row ${index + 2}`);
              continue;
            }

            try {
              const product = await createProductMutation.mutateAsync({
                name,
                englishName,
                unit,
                category,
                thumbnailUrl,
              });
              if (!product) {
                skipped.push(`row ${index + 2}: created product but no response returned`);
                continue;
              }

              created.push(product.id);

              if (!rawPrice || !createPriceEntryMutation) continue;

              const normalizedPrice = normalizePrice(rawPrice);
              const price = Number(normalizedPrice);
              if (!Number.isFinite(price) || price < 0) {
                skipped.push(`row ${index + 2}: invalid price '${rawPrice}'`);
                continue;
              }

              const storeId = resolveStoreId(rawStoreId, rawStoreName);
              if (!storeId) {
                priceSkipped.push(`row ${index + 2}: price skipped (missing store/store_id)`);
                continue;
              }

              try {
                await createPriceEntryMutation.mutateAsync({
                  productId: product.id,
                  storeId,
                  price: normalizedPrice,
                  observedAt: observedAt || undefined,
                  periodEnd: periodEnd || undefined,
                });
                priceImported.push(`row ${index + 2}`);
              } catch (priceError) {
                skipped.push(
                  `row ${index + 2}: price save failed - ${
                    priceError instanceof Error ? priceError.message : "failed"
                  }`,
                );
              }
            } catch (error) {
              skipped.push(`row ${index + 2}: ${error instanceof Error ? error.message : "failed"}`);
            }
          }

          await loadAll(true);
          setNotice(
            [
              `Imported ${created.length} products from CSV${
                priceImported.length > 0 ? ` with ${priceImported.length} prices` : ""
              }.`,
              skipped.length > 0
                ? `Skipped ${skipped.length}: ${skipped.slice(0, 3).join(", ")}`
                : "",
              priceSkipped.length > 0
                ? `Price skipped ${priceSkipped.length}: ${priceSkipped.slice(0, 3).join(", ")}`
                : "",
            ]
              .filter(Boolean)
              .join(" "),
          );
        } catch (error) {
          setNotice(error instanceof Error ? error.message : "Product CSV import failed.");
        } finally {
          setSubmitting(false);
        }
      })();
    };
    input.click();
  }, [createPriceEntryMutation, createProductMutation, loadAll, setNotice, setSubmitting, stores]);

  return { handleExportProductsCsv, handleImportProductsCsv };
}
