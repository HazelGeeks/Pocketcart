import type {
  AdminProduct,
  AdminProductIdentityReview,
} from "../services/adminBackoffice";
import type {
  ProductCsvImportPreview,
  ProductCsvPreviewRow,
} from "./productCsvImportPlan";

type Mutation<TParams, TResult> = {
  mutateAsync: (params: TParams) => Promise<TResult>;
};

export type ProductCsvImportProgress = {
  completed: number;
  total: number;
  phase: "products" | "reviews" | "prices" | "finishing";
};

export type ProductCsvImportReportRow = {
  rowNumber: number;
  productResult: string;
  priceResult: string;
  status: "imported" | "review" | "skipped" | "partial";
  detail: string;
};

export type ProductCsvImportReport = {
  fileName: string;
  completedAt: string;
  createdProducts: number;
  reusedRows: number;
  reviewRows: number;
  invalidRows: number;
  importedPrices: number;
  failedPrices: number;
  globalErrors: string[];
  rows: ProductCsvImportReportRow[];
};

export type ProductCsvImportMutations = {
  createProduct: Mutation<{
    koreanName: string;
    englishName?: string;
    category: string;
    unit?: string;
    thumbnailUrl?: string;
  }, AdminProduct | null>;
  createReview: Mutation<{
    rowNumber?: number;
    productId?: string;
    reason: string;
    matchMethod?: string;
    candidateCount?: number;
    payload: Record<string, unknown>;
  }, AdminProductIdentityReview | null>;
  createPrice: Mutation<{
    productId: string;
    storeId: string;
    price: string;
    observedAt?: string;
    periodEnd?: string;
  }, unknown>;
  createAuditLog?: Mutation<{
    action: string;
    entityType: string;
    entityId?: string;
    summary: string;
    metadata?: Record<string, unknown>;
  }, unknown>;
};

async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  let nextIndex = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (nextIndex < items.length) {
      const item = items[nextIndex];
      nextIndex += 1;
      await worker(item);
    }
  });
  await Promise.all(runners);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

function initialReportRow(row: ProductCsvPreviewRow): ProductCsvImportReportRow {
  if (row.productAction === "review") {
    return {
      rowNumber: row.rowNumber,
      productResult: "Held for review",
      priceResult: "Held with row",
      status: "review",
      detail: row.message ?? "Product match needs review.",
    };
  }
  if (row.productAction === "invalid") {
    return {
      rowNumber: row.rowNumber,
      productResult: "Skipped",
      priceResult: "Skipped",
      status: "skipped",
      detail: row.message ?? "Invalid row.",
    };
  }
  return {
    rowNumber: row.rowNumber,
    productResult: row.productAction === "reuse" ? "Existing product" : "Pending",
    priceResult:
      row.price.status === "missing"
        ? "No price supplied"
        : row.price.status === "skipped"
          ? "Skipped"
          : "Pending",
    status: "imported",
    detail: row.price.message ?? "",
  };
}

export async function executeProductCsvImport(params: {
  preview: ProductCsvImportPreview;
  mutations: ProductCsvImportMutations;
  onProgress?: (progress: ProductCsvImportProgress) => void;
}): Promise<ProductCsvImportReport> {
  const reportByRow = new Map(
    params.preview.rows.map((row) => [row.rowNumber, initialReportRow(row)]),
  );
  const productIdByKey = new Map<string, string>();
  params.preview.rows.forEach((row) => {
    if (row.productId) productIdByKey.set(row.productKey, row.productId);
  });

  const createRows = params.preview.rows.filter((row) => row.productAction === "create");
  const reviewRows = params.preview.rows.filter((row) => row.productAction === "review");
  const priceJobs = params.preview.rows.flatMap((row) =>
    row.price.status === "ready" && !["review", "invalid"].includes(row.productAction)
      ? row.price.storeIds.map((storeId) => ({ row, storeId }))
      : [],
  );
  const total = createRows.length + reviewRows.length + priceJobs.length;
  let completed = 0;
  let createdProducts = 0;
  let importedPrices = 0;
  let failedPrices = 0;
  const globalErrors: string[] = [];
  const progress = (phase: ProductCsvImportProgress["phase"]) => {
    params.onProgress?.({ completed, total, phase });
  };

  progress("products");
  await runWithConcurrency(createRows, 4, async (row) => {
    const report = reportByRow.get(row.rowNumber)!;
    try {
      const product = await params.mutations.createProduct.mutateAsync({
        koreanName: row.input.koreanName,
        englishName: row.input.englishName,
        category: row.input.category,
        unit: row.input.unit || undefined,
        thumbnailUrl: row.input.thumbnailUrl || undefined,
      });
      if (!product) throw new Error("Product save returned no result.");
      productIdByKey.set(row.productKey, product.id);
      report.productResult = `Created ${product.id}`;
      createdProducts += 1;
    } catch (error) {
      report.productResult = "Create failed";
      report.priceResult = "Skipped";
      report.status = "skipped";
      report.detail = errorMessage(error);
    } finally {
      completed += 1;
      progress("products");
    }
  });

  params.preview.rows
    .filter((row) => row.productAction === "reuse_planned")
    .forEach((row) => {
      const report = reportByRow.get(row.rowNumber)!;
      report.productResult = productIdByKey.has(row.productKey)
        ? "Created product reused"
        : "Create failed on an earlier row";
      if (!productIdByKey.has(row.productKey)) report.status = "skipped";
    });

  progress("reviews");
  await runWithConcurrency(reviewRows, 4, async (row) => {
    const report = reportByRow.get(row.rowNumber)!;
    try {
      await params.mutations.createReview.mutateAsync({
        rowNumber: row.rowNumber,
        reason: row.reviewReason ?? "ambiguous_product_match",
        matchMethod: row.matchMethod,
        candidateCount: row.candidateProductIds.length || undefined,
        payload: row.reviewPayload,
      });
      report.detail = `${report.detail} Review saved.`.trim();
    } catch (error) {
      report.status = "partial";
      report.detail = `${report.detail} Review save failed: ${errorMessage(error)}`.trim();
    } finally {
      completed += 1;
      progress("reviews");
    }
  });

  progress("prices");
  await runWithConcurrency(priceJobs, 8, async ({ row, storeId }) => {
    const report = reportByRow.get(row.rowNumber)!;
    const productId = row.productId ?? productIdByKey.get(row.productKey);
    if (!productId || report.status === "skipped") {
      failedPrices += 1;
      report.priceResult = "Skipped because product was unavailable";
      report.status = "skipped";
      completed += 1;
      progress("prices");
      return;
    }
    try {
      await params.mutations.createPrice.mutateAsync({
        productId,
        storeId,
        price: row.price.normalizedPrice,
        observedAt: row.price.observedAt,
        periodEnd: row.price.periodEnd,
      });
      importedPrices += 1;
      report.priceResult = `${Number(report.priceResult.match(/\d+/)?.[0] ?? 0) + 1} saved`;
    } catch (error) {
      failedPrices += 1;
      report.priceResult = "One or more prices failed";
      report.status = "partial";
      report.detail = `${report.detail} ${errorMessage(error)}`.trim();
    } finally {
      completed += 1;
      progress("prices");
    }
  });

  progress("finishing");
  const report: ProductCsvImportReport = {
    fileName: params.preview.fileName,
    completedAt: new Date().toISOString(),
    createdProducts,
    reusedRows: params.preview.rows.filter((row) =>
      ["reuse", "reuse_planned"].includes(row.productAction),
    ).length,
    reviewRows: reviewRows.length,
    invalidRows: params.preview.summary.invalidRows,
    importedPrices,
    failedPrices,
    globalErrors,
    rows: [...reportByRow.values()].sort((a, b) => a.rowNumber - b.rowNumber),
  };

  if (params.mutations.createAuditLog) {
    try {
      await params.mutations.createAuditLog.mutateAsync({
        action: "product_csv_import",
        entityType: "product_import",
        summary: `Imported ${createdProducts} products and ${importedPrices} prices from ${params.preview.fileName}.`,
        metadata: {
          total_rows: params.preview.summary.totalRows,
          created_products: createdProducts,
          reused_rows: report.reusedRows,
          review_rows: report.reviewRows,
          invalid_rows: report.invalidRows,
          imported_prices: importedPrices,
          failed_prices: failedPrices,
        },
      });
    } catch (error) {
      globalErrors.push(`Audit log failed: ${errorMessage(error)}`);
    }
  }
  return report;
}
