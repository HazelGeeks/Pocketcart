import React from "react";
import { Platform } from "react-native";
import type { AdminProduct, AdminStore } from "../services/adminBackoffice";
import type { ProductPriceStats } from "../utils/adminScreenHelpers";
import {
  PRODUCT_IMPORT_HEADERS,
  downloadCsvFile,
  productImportTemplateCsv,
  productsToCsv,
} from "../utils/adminScreenHelpers";
import { csvHeaderKey, csvRowValue, parseCsvRows } from "../utils/adminValidation";
import {
  createProductCsvStoreResolver,
  productCsvDateToIso,
  productCsvRecordFromRow,
} from "../utils/productCsvImport";
import { productIdentityKey } from "../utils/productIdentity";

type Mutation<TParams, TResult> = {
  mutateAsync: (params: TParams) => Promise<TResult>;
};

type Params = {
  products: AdminProduct[];
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

function hasCsvHeader(headers: string[], aliases: string[]): boolean {
  return aliases.some((alias) => headers.includes(csvHeaderKey(alias)));
}

function missingColumnErrorMessage(message: string): string | null {
  const text = message.toLowerCase();
  if (
    text.includes("product_id") &&
    (text.includes("column") || text.includes("could not find") || text.includes("schema cache"))
  ) {
    return "price skipped (database column product_id is missing; apply database/schema.sql)";
  }
  if (
    text.includes("store_id") &&
    (text.includes("column") || text.includes("could not find") || text.includes("schema cache"))
  ) {
    return "price skipped (database column store_id is missing; apply database/schema.sql)";
  }
  return null;
}

export default function useAdminProductCsvActions({
  products,
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

  const handleDownloadProductCsvTemplate = React.useCallback(() => {
    const error = downloadCsvFile("product-import-template", productImportTemplateCsv());
    if (error) {
      setNotice(error);
      return;
    }
    setNotice("Downloaded product CSV import template.");
  }, [setNotice]);

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
          const missingRequiredColumns = [
            !hasCsvHeader(headers, PRODUCT_IMPORT_HEADERS.name) ? "name" : "",
            !hasCsvHeader(headers, PRODUCT_IMPORT_HEADERS.category) ? "category" : "",
          ].filter(Boolean);
          if (missingRequiredColumns.length > 0) {
            setNotice(`CSV is missing required column(s): ${missingRequiredColumns.join(", ")}.`);
            return;
          }

          const hasPriceColumn = hasCsvHeader(headers, PRODUCT_IMPORT_HEADERS.price);
          const created: string[] = [];
          const reused: string[] = [];
          const skipped: string[] = [];
          const priceImported: string[] = [];
          const priceSkipped: string[] = [];
          const priceMissing: string[] = [];

          const productByIdentity = new Map(
            products.map((product) => [productIdentityKey(product), product]),
          );
          const storeResolver = createProductCsvStoreResolver(stores);

          for (const [index, values] of dataRows.entries()) {
            const record = productCsvRecordFromRow(headers, values);

            const name = csvRowValue(record, PRODUCT_IMPORT_HEADERS.name);
            const englishName = csvRowValue(record, PRODUCT_IMPORT_HEADERS.englishName);
            const category = csvRowValue(record, PRODUCT_IMPORT_HEADERS.category);
            const thumbnailUrl = csvRowValue(record, PRODUCT_IMPORT_HEADERS.thumbnailUrl);
            const unit = csvRowValue(record, PRODUCT_IMPORT_HEADERS.unit);

            const rawPrice = csvRowValue(record, PRODUCT_IMPORT_HEADERS.price);
            const rawStoreId = csvRowValue(record, PRODUCT_IMPORT_HEADERS.storeId);
            const rawStoreName = csvRowValue(record, PRODUCT_IMPORT_HEADERS.storeName);
            const rawStoreBrand = csvRowValue(record, PRODUCT_IMPORT_HEADERS.storeBrand);
            const observedAt = csvRowValue(record, PRODUCT_IMPORT_HEADERS.observedAt);
            const periodEnd = csvRowValue(record, PRODUCT_IMPORT_HEADERS.periodEnd);

            if (!name || !category) {
              skipped.push(`row ${index + 2}`);
              continue;
            }

            try {
              const productKey = productIdentityKey({ name, unit, category });
              let product = productByIdentity.get(productKey) ?? null;
              if (product) {
                reused.push(product.id);
              } else {
                product = await createProductMutation.mutateAsync({
                  name,
                  englishName,
                  unit,
                  category,
                  thumbnailUrl,
                });
              }
              if (!product) {
                skipped.push(`row ${index + 2}: created product but no response returned`);
                continue;
              }

              productByIdentity.set(productKey, product);
              if (!created.includes(product.id) && !reused.includes(product.id)) {
                created.push(product.id);
              }

              if (!rawPrice || !createPriceEntryMutation) {
                if (!rawPrice) priceMissing.push(`row ${index + 2}`);
                continue;
              }

              const normalizedPrice = normalizePrice(rawPrice);
              const price = Number(normalizedPrice);
              if (!Number.isFinite(price) || price < 0) {
                skipped.push(`row ${index + 2}: invalid price '${rawPrice}'`);
                continue;
              }
              if (!observedAt || !periodEnd) {
                priceSkipped.push(`row ${index + 2}: price skipped (missing sale_start_date/sale_end_date)`);
                continue;
              }
              const observedAtIso = productCsvDateToIso(observedAt, false);
              const periodEndIso = productCsvDateToIso(periodEnd, true);
              if (!observedAtIso || !periodEndIso) {
                priceSkipped.push(`row ${index + 2}: price skipped (invalid sale period dates)`);
                continue;
              }

              const storeIds = storeResolver.resolveStoreIds(rawStoreId, rawStoreName, rawStoreBrand);
              if (storeIds.length === 0) {
                if (!rawStoreName && !rawStoreId) {
                  priceSkipped.push(`row ${index + 2}: price skipped (missing store/store_id)`);
                } else {
                  priceSkipped.push(`row ${index + 2}: price skipped (store not found)`);
                }
                continue;
              }

              for (const storeId of storeIds) {
                try {
                  await createPriceEntryMutation.mutateAsync({
                    productId: product.id,
                    storeId,
                    price: normalizedPrice,
                    observedAt: observedAtIso,
                    periodEnd: periodEndIso,
                  });
                  priceImported.push(`row ${index + 2}`);
                } catch (priceError) {
                  const message = priceError instanceof Error ? priceError.message : "failed";
                  const friendlyMessage = missingColumnErrorMessage(message);
                  skipped.push(
                    `row ${index + 2}: ${friendlyMessage ?? `price save failed - ${message}`}`,
                  );
                }
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
              reused.length > 0 ? `Reused ${new Set(reused).size} existing products.` : "",
              skipped.length > 0
                ? `Skipped ${skipped.length}: ${skipped.slice(0, 3).join(", ")}`
                : "",
              priceSkipped.length > 0
                ? `Price skipped ${priceSkipped.length}: ${priceSkipped.slice(0, 3).join(", ")}`
                : "",
              priceMissing.length > 0
                ? `${hasPriceColumn ? "Missing price" : "Missing price column"} for ${priceMissing.length} row(s); imported products without price.`
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
  }, [createPriceEntryMutation, createProductMutation, loadAll, products, setNotice, setSubmitting, stores]);

  return { handleDownloadProductCsvTemplate, handleExportProductsCsv, handleImportProductsCsv };
}
