import type { AdminProduct, AdminProductAlias, AdminStore } from "../services/adminBackoffice";
import { csvHeaderKey, csvRowValue, parseCsvRows } from "./adminValidation";
import { PRODUCT_IMPORT_HEADERS } from "./productCsvHeaders";
import {
  createProductCsvStoreResolver,
  productCsvDateToIso,
  productCsvRecordFromRow,
} from "./productCsvImport";
import { isValidGtin, productIdentityKey, resolveProductMatch } from "./productIdentity";

export type ProductCsvProductAction = "create" | "reuse" | "reuse_planned" | "review" | "invalid";

export type ProductCsvPricePlan = {
  status: "ready" | "missing" | "skipped";
  normalizedPrice: string;
  observedAt?: string;
  periodEnd?: string;
  storeIds: string[];
  message?: string;
};

export type ProductCsvPreviewRow = {
  rowNumber: number;
  productAction: ProductCsvProductAction;
  productKey: string;
  productId?: string;
  candidateProductIds: string[];
  matchMethod?: string;
  reviewReason?: string;
  message?: string;
  input: {
    koreanName: string;
    englishName: string;
    category: string;
    unit: string;
    thumbnailUrl: string;
  };
  reviewPayload: Record<string, unknown>;
  price: ProductCsvPricePlan;
};

export type ProductCsvImportPreview = {
  fileName: string;
  rows: ProductCsvPreviewRow[];
  summary: {
    totalRows: number;
    productsToCreate: number;
    existingMatches: number;
    rowsForReview: number;
    invalidRows: number;
    priceEntriesToImport: number;
    pricesMissing: number;
    pricesSkipped: number;
  };
};

export type ProductCsvPreviewResult =
  | { ok: true; preview: ProductCsvImportPreview }
  | { ok: false; error: string };

function hasCsvHeader(headers: string[], aliases: string[]): boolean {
  return aliases.some((alias) => headers.includes(csvHeaderKey(alias)));
}

function normalizePrice(value: string): string {
  const matches = value
    .trim()
    .replace(/,/g, "")
    .match(/-?\d+(?:\.\d+)?/g);
  return matches?.[0] ?? "";
}

function buildPricePlan(
  record: Record<string, string>,
  storeResolver: ReturnType<typeof createProductCsvStoreResolver>,
): ProductCsvPricePlan {
  const rawPrice = csvRowValue(record, PRODUCT_IMPORT_HEADERS.price);
  if (!rawPrice) {
    return { status: "missing", normalizedPrice: "", storeIds: [] };
  }

  const normalizedPrice = normalizePrice(rawPrice);
  const numericPrice = Number(normalizedPrice);
  if (!Number.isFinite(numericPrice) || numericPrice < 0) {
    return {
      status: "skipped",
      normalizedPrice,
      storeIds: [],
      message: `Invalid price '${rawPrice}'.`,
    };
  }

  const start = csvRowValue(record, PRODUCT_IMPORT_HEADERS.observedAt);
  const end = csvRowValue(record, PRODUCT_IMPORT_HEADERS.periodEnd);
  const observedAt = productCsvDateToIso(start, false);
  const periodEnd = productCsvDateToIso(end, true);
  if (!start || !end || !observedAt || !periodEnd) {
    return {
      status: "skipped",
      normalizedPrice,
      storeIds: [],
      message: "Price needs valid sale_start_date and sale_end_date values.",
    };
  }

  const storeIds = storeResolver.resolveStoreIds(
    csvRowValue(record, PRODUCT_IMPORT_HEADERS.storeId),
    csvRowValue(record, PRODUCT_IMPORT_HEADERS.storeName),
    csvRowValue(record, PRODUCT_IMPORT_HEADERS.storeBrand),
  );
  if (!storeIds.length) {
    return {
      status: "skipped",
      normalizedPrice,
      storeIds: [],
      message: "Price store could not be resolved.",
    };
  }

  return { status: "ready", normalizedPrice, observedAt, periodEnd, storeIds };
}

function requiredColumnError(headers: string[]): string | null {
  const missing = [
    !hasCsvHeader(headers, PRODUCT_IMPORT_HEADERS.englishName) ? "english_name" : "",
    !hasCsvHeader(headers, PRODUCT_IMPORT_HEADERS.koreanName) ? "korean_name" : "",
    !hasCsvHeader(headers, PRODUCT_IMPORT_HEADERS.category) ? "category" : "",
  ].filter(Boolean);
  return missing.length ? `CSV is missing required column(s): ${missing.join(", ")}.` : null;
}

export function buildProductCsvImportPreview(params: {
  csvText: string;
  fileName: string;
  products: AdminProduct[];
  productAliases?: AdminProductAlias[];
  stores: AdminStore[];
}): ProductCsvPreviewResult {
  const parsed = parseCsvRows(params.csvText).filter((row) => row.some((cell) => cell.trim()));
  const [headerRow, ...dataRows] = parsed;
  if (!headerRow || dataRows.length === 0) {
    return { ok: false, error: "CSV must include a header row and at least one product row." };
  }

  const headers = headerRow.map(csvHeaderKey);
  const columnError = requiredColumnError(headers);
  if (columnError) return { ok: false, error: columnError };

  const plannedKeys = new Set<string>();
  const storeResolver = createProductCsvStoreResolver(params.stores);
  const rows = dataRows.map<ProductCsvPreviewRow>((values, index) => {
    const rowNumber = index + 2;
    const record = productCsvRecordFromRow(headers, values);
    const input = {
      koreanName: csvRowValue(record, PRODUCT_IMPORT_HEADERS.koreanName),
      englishName: csvRowValue(record, PRODUCT_IMPORT_HEADERS.englishName),
      category: csvRowValue(record, PRODUCT_IMPORT_HEADERS.category),
      unit: csvRowValue(record, PRODUCT_IMPORT_HEADERS.unit),
      thumbnailUrl: csvRowValue(record, PRODUCT_IMPORT_HEADERS.thumbnailUrl),
    };
    const productId = csvRowValue(record, PRODUCT_IMPORT_HEADERS.productId);
    const legacyBrand = csvRowValue(record, PRODUCT_IMPORT_HEADERS.productBrand);
    const legacyGtin = csvRowValue(record, PRODUCT_IMPORT_HEADERS.gtin);
    const productKey = productIdentityKey(input);
    const price = buildPricePlan(record, storeResolver);
    const reviewPayload = {
      supplied_product_id: productId || null,
      english_name: input.englishName || null,
      korean_name: input.koreanName,
      category: input.category,
      unit: input.unit || null,
      thumbnail_url: input.thumbnailUrl || null,
      store_id: csvRowValue(record, PRODUCT_IMPORT_HEADERS.storeId) || null,
      store_name: csvRowValue(record, PRODUCT_IMPORT_HEADERS.storeName) || null,
      store_brand: csvRowValue(record, PRODUCT_IMPORT_HEADERS.storeBrand) || null,
      price: csvRowValue(record, PRODUCT_IMPORT_HEADERS.price) || null,
      sale_start_date: csvRowValue(record, PRODUCT_IMPORT_HEADERS.observedAt) || null,
      sale_end_date: csvRowValue(record, PRODUCT_IMPORT_HEADERS.periodEnd) || null,
    };

    if (!input.englishName || !input.koreanName || !input.category) {
      return {
        rowNumber,
        productAction: "invalid",
        productKey,
        candidateProductIds: [],
        message: "English name, Korean name, and category are required.",
        input,
        reviewPayload,
        price,
      };
    }

    const match = resolveProductMatch(
      params.products,
      {
        productId,
        ...input,
        brand: legacyBrand,
        gtin: isValidGtin(legacyGtin) ? legacyGtin : undefined,
      },
      { aliases: params.productAliases },
    );
    if (match.status === "matched") {
      return {
        rowNumber,
        productAction: "reuse",
        productKey,
        productId: match.product.id,
        candidateProductIds: [match.product.id],
        matchMethod: match.method,
        input,
        reviewPayload,
        price,
      };
    }
    if (match.status === "ambiguous") {
      return {
        rowNumber,
        productAction: "review",
        productKey,
        candidateProductIds: match.candidateIds,
        matchMethod: match.method,
        reviewReason: "ambiguous_product_match",
        message: `${match.candidateCount} possible products need review.`,
        input,
        reviewPayload: { ...reviewPayload, candidate_product_ids: match.candidateIds },
        price,
      };
    }
    if (match.reason === "product_id_not_found") {
      return {
        rowNumber,
        productAction: "review",
        productKey,
        candidateProductIds: [],
        matchMethod: "product_id",
        reviewReason: "product_id_not_found",
        message: `Product ID '${productId}' was not found.`,
        input,
        reviewPayload,
        price,
      };
    }

    const productAction = plannedKeys.has(productKey) ? "reuse_planned" : "create";
    plannedKeys.add(productKey);
    return {
      rowNumber,
      productAction,
      productKey,
      candidateProductIds: [],
      input,
      reviewPayload,
      price,
    };
  });

  const safeRows = rows.filter((row) => !["review", "invalid"].includes(row.productAction));
  return {
    ok: true,
    preview: {
      fileName: params.fileName,
      rows,
      summary: {
        totalRows: rows.length,
        productsToCreate: rows.filter((row) => row.productAction === "create").length,
        existingMatches: rows.filter((row) => row.productAction === "reuse").length,
        rowsForReview: rows.filter((row) => row.productAction === "review").length,
        invalidRows: rows.filter((row) => row.productAction === "invalid").length,
        priceEntriesToImport: safeRows.reduce(
          (count, row) => count + (row.price.status === "ready" ? row.price.storeIds.length : 0),
          0,
        ),
        pricesMissing: rows.filter((row) => row.price.status === "missing").length,
        pricesSkipped: rows.filter((row) => row.price.status === "skipped").length,
      },
    },
  };
}
