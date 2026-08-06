import React from "react";
import { Platform } from "react-native";
import type {
  AdminProduct,
  AdminProductIdentityReview,
  AdminStore,
} from "../services/adminBackoffice";
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
import {
  gtinValidationMessage,
  isValidGtin,
  normalizeGtin,
  resolveProductMatch,
  type ProductMatchMethod,
} from "../utils/productIdentity";

type Mutation<TParams, TResult> = {
  mutateAsync: (params: TParams) => Promise<TResult>;
};

type Params = {
  products: AdminProduct[];
  productPriceStats: Map<string, ProductPriceStats>;
  stores: AdminStore[];
  setSubmitting: (value: boolean) => void;
  setNotice: (value: string | null) => void;
  loadAll: (keepNotice?: boolean) => Promise<void>;
  createProductMutation: Mutation<
    {
      koreanName: string;
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
      koreanName: string;
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
  productPriceStats,
  stores,
  setSubmitting,
  setNotice,
  loadAll,
  createProductMutation,
  updateProductMutation,
  createIdentityReviewMutation,
  createPriceEntryMutation,
}: Params) {
  const handleExportProductsCsv = React.useCallback((selectedProducts: AdminProduct[]) => {
    if (selectedProducts.length === 0) {
      setNotice("Select at least one product to export.");
      return;
    }

    const error = downloadCsvFile("products", productsToCsv(selectedProducts, productPriceStats));
    if (error) {
      setNotice(error);
      return;
    }
    setNotice(`Exported ${selectedProducts.length} selected products to CSV.`);
  }, [productPriceStats, setNotice]);

  const handleDownloadProductCsvTemplate = React.useCallback(() => {
    const error = downloadCsvFile("product-import-template", productImportTemplateCsv());
    if (error) {
      setNotice(error);
      return;
    }
    setNotice(
      "Downloaded product CSV import template. Leave store_name and store_id blank to apply store_brand to all active branches.",
    );
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
            !hasCsvHeader(headers, PRODUCT_IMPORT_HEADERS.englishName) ? "english_name" : "",
            !hasCsvHeader(headers, PRODUCT_IMPORT_HEADERS.koreanName) ? "korean_name" : "",
            !hasCsvHeader(headers, PRODUCT_IMPORT_HEADERS.category) ? "category" : "",
          ].filter(Boolean);
          if (missingRequiredColumns.length > 0) {
            setNotice(`CSV is missing required column(s): ${missingRequiredColumns.join(", ")}.`);
            return;
          }

          const hasPriceColumn = hasCsvHeader(headers, PRODUCT_IMPORT_HEADERS.price);
          const created: string[] = [];
          const reused: string[] = [];
          const enriched: string[] = [];
          const identityConflicts: string[] = [];
          const skipped: string[] = [];
          const priceImported: string[] = [];
          const priceSkipped: string[] = [];
          const priceMissing: string[] = [];

          const knownProducts = [...products];
          const matchedBy: Record<ProductMatchMethod, number> = {
            product_id: 0,
            gtin: 0,
            legacy_identity: 0,
            canonical_identity: 0,
          };
          const storeResolver = createProductCsvStoreResolver(stores);

          for (const [index, values] of dataRows.entries()) {
            const record = productCsvRecordFromRow(headers, values);

            const productId = csvRowValue(record, PRODUCT_IMPORT_HEADERS.productId);
            const koreanName = csvRowValue(record, PRODUCT_IMPORT_HEADERS.koreanName);
            const englishName = csvRowValue(record, PRODUCT_IMPORT_HEADERS.englishName);
            const productBrand = csvRowValue(record, PRODUCT_IMPORT_HEADERS.productBrand);
            const rawGtin = csvRowValue(record, PRODUCT_IMPORT_HEADERS.gtin);
            const gtin = normalizeGtin(rawGtin);
            const category = csvRowValue(record, PRODUCT_IMPORT_HEADERS.category);
            const thumbnailUrl = csvRowValue(record, PRODUCT_IMPORT_HEADERS.thumbnailUrl);
            const unit = csvRowValue(record, PRODUCT_IMPORT_HEADERS.unit);

            const rawPrice = csvRowValue(record, PRODUCT_IMPORT_HEADERS.price);
            const rawStoreId = csvRowValue(record, PRODUCT_IMPORT_HEADERS.storeId);
            const rawStoreName = csvRowValue(record, PRODUCT_IMPORT_HEADERS.storeName);
            const rawStoreBrand = csvRowValue(record, PRODUCT_IMPORT_HEADERS.storeBrand);
            const observedAt = csvRowValue(record, PRODUCT_IMPORT_HEADERS.observedAt);
            const periodEnd = csvRowValue(record, PRODUCT_IMPORT_HEADERS.periodEnd);
            const reviewPayload = {
              supplied_product_id: productId || null,
              english_name: englishName || null,
              korean_name: koreanName,
              product_brand: productBrand || null,
              gtin: gtin || null,
              category,
              unit: unit || null,
              store_id: rawStoreId || null,
              store_name: rawStoreName || null,
              store_brand: rawStoreBrand || null,
              price: rawPrice || null,
              sale_start_date: observedAt || null,
              sale_end_date: periodEnd || null,
            };

            if (!englishName || !koreanName || !category) {
              skipped.push(`row ${index + 2}`);
              continue;
            }

            try {
              const gtinError = gtinValidationMessage(rawGtin);
              if (gtinError) {
                try {
                  await createIdentityReviewMutation.mutateAsync({
                    rowNumber: index + 2,
                    reason: "invalid_gtin",
                    matchMethod: "gtin",
                    payload: {
                      ...reviewPayload,
                      supplied_gtin: rawGtin,
                      validation_error: gtinError,
                    },
                  });
                } catch (reviewError) {
                  skipped.push(
                    `row ${index + 2}: review queue save failed - ${
                      reviewError instanceof Error ? reviewError.message : "failed"
                    }`,
                  );
                }
                identityConflicts.push(`row ${index + 2}: ${gtinError}`);
                continue;
              }

              const match = resolveProductMatch(knownProducts, {
                productId,
                koreanName,
                englishName,
                brand: productBrand,
                gtin,
                unit,
                category,
              });
              let product: AdminProduct | null = null;

              if (match.status === "ambiguous") {
                try {
                  await createIdentityReviewMutation.mutateAsync({
                    rowNumber: index + 2,
                    reason: "ambiguous_product_match",
                    matchMethod: match.method,
                    candidateCount: match.candidateCount,
                    payload: {
                      ...reviewPayload,
                      candidate_product_ids: match.candidateIds,
                    },
                  });
                } catch (reviewError) {
                  skipped.push(
                    `row ${index + 2}: review queue save failed - ${
                      reviewError instanceof Error ? reviewError.message : "failed"
                    }`,
                  );
                }
                identityConflicts.push(
                  `row ${index + 2}: ${match.candidateCount} possible product matches (${match.method})`,
                );
                continue;
              }

              if (
                match.status === "not_found" &&
                match.reason === "product_id_not_found"
              ) {
                try {
                  await createIdentityReviewMutation.mutateAsync({
                    rowNumber: index + 2,
                    reason: "product_id_not_found",
                    matchMethod: "product_id",
                    payload: reviewPayload,
                  });
                } catch (reviewError) {
                  skipped.push(
                    `row ${index + 2}: review queue save failed - ${
                      reviewError instanceof Error ? reviewError.message : "failed"
                    }`,
                  );
                }
                identityConflicts.push(
                  `row ${index + 2}: product_id '${productId}' was not found`,
                );
                continue;
              }

              if (match.status === "matched") {
                product = match.product;
                const rawExistingGtin = product.gtin?.trim() ?? "";
                const existingGtin = isValidGtin(product.gtin)
                  ? normalizeGtin(product.gtin)
                  : "";
                if (rawExistingGtin && !existingGtin && !gtin) {
                  try {
                    await createIdentityReviewMutation.mutateAsync({
                      rowNumber: index + 2,
                      productId: product.id,
                      reason: "invalid_gtin",
                      matchMethod: match.method,
                      candidateCount: 1,
                      payload: {
                        ...reviewPayload,
                        existing_gtin: rawExistingGtin,
                        validation_error: gtinValidationMessage(rawExistingGtin),
                      },
                    });
                  } catch (reviewError) {
                    skipped.push(
                      `row ${index + 2}: review queue save failed - ${
                        reviewError instanceof Error ? reviewError.message : "failed"
                      }`,
                    );
                  }
                  identityConflicts.push(
                    `row ${index + 2}: matched product '${product.id}' has an invalid GTIN`,
                  );
                  continue;
                }
                if (gtin && existingGtin && gtin !== existingGtin) {
                  try {
                    await createIdentityReviewMutation.mutateAsync({
                      rowNumber: index + 2,
                      productId: product.id,
                      reason: "gtin_conflict",
                      matchMethod: match.method,
                      candidateCount: 1,
                      payload: {
                        ...reviewPayload,
                        existing_gtin: existingGtin,
                      },
                    });
                  } catch (reviewError) {
                    skipped.push(
                      `row ${index + 2}: review queue save failed - ${
                        reviewError instanceof Error ? reviewError.message : "failed"
                      }`,
                    );
                  }
                  identityConflicts.push(
                    `row ${index + 2}: GTIN conflicts with product_id '${product.id}'`,
                  );
                  continue;
                }

                matchedBy[match.method] += 1;
                reused.push(product.id);
                const mergedBrand = product.brand?.trim() || productBrand;
                const mergedGtin = existingGtin || gtin;
                const mergedEnglishName = product.english_name?.trim() || englishName;
                const mergedThumbnail = product.thumbnail_url?.trim() || thumbnailUrl;
                const needsEnrichment =
                  mergedBrand !== (product.brand ?? "") ||
                  mergedGtin !== (product.gtin ?? "") ||
                  mergedEnglishName !== (product.english_name ?? "") ||
                  mergedThumbnail !== (product.thumbnail_url ?? "");

                if (needsEnrichment) {
                  const updated = await updateProductMutation.mutateAsync({
                    id: product.id,
                    koreanName: product.korean_name,
                    englishName: mergedEnglishName,
                    brand: mergedBrand,
                    gtin: mergedGtin,
                    category: product.category,
                    unit: product.unit ?? undefined,
                    thumbnailUrl: mergedThumbnail,
                  });
                  if (updated) {
                    product = updated;
                    enriched.push(updated.id);
                    const existingIndex = knownProducts.findIndex(
                      (candidate) => candidate.id === updated.id,
                    );
                    if (existingIndex >= 0) knownProducts[existingIndex] = updated;
                  }
                }
              } else {
                product = await createProductMutation.mutateAsync({
                  koreanName,
                  englishName,
                  brand: productBrand,
                  gtin,
                  unit,
                  category,
                  thumbnailUrl,
                });
              }
              if (!product) {
                skipped.push(`row ${index + 2}: created product but no response returned`);
                continue;
              }

              if (!knownProducts.some((candidate) => candidate.id === product.id)) {
                knownProducts.push(product);
              }
              if (match.status === "not_found" && !created.includes(product.id)) {
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
                if (!rawStoreName && !rawStoreId && !rawStoreBrand) {
                  priceSkipped.push(`row ${index + 2}: price skipped (missing store_brand/store_name/store_id)`);
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
              reused.length > 0
                ? `Matched ${new Set(reused).size} existing products (ID ${matchedBy.product_id}, GTIN ${matchedBy.gtin}, exact ${matchedBy.legacy_identity}, canonical ${matchedBy.canonical_identity}).`
                : "",
              enriched.length > 0
                ? `Enriched ${new Set(enriched).size} existing products with missing identity metadata.`
                : "",
              identityConflicts.length > 0
                ? `Identity conflicts ${identityConflicts.length}: ${identityConflicts.slice(0, 3).join(", ")}`
                : "",
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
  }, [
    createPriceEntryMutation,
    createIdentityReviewMutation,
    createProductMutation,
    loadAll,
    products,
    setNotice,
    setSubmitting,
    stores,
    updateProductMutation,
  ]);

  return { handleDownloadProductCsvTemplate, handleExportProductsCsv, handleImportProductsCsv };
}
