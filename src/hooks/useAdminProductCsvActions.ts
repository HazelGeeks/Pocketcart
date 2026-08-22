import React from "react";
import { Platform } from "react-native";
import type {
  AdminProduct,
  AdminProductAlias,
  AdminProductIdentityReview,
  AdminStore,
} from "../services/adminBackoffice";
import type { ProductPriceStats } from "../utils/adminScreenHelpers";
import {
  downloadCsvFile,
  productImportTemplateCsv,
  productsToCsv,
} from "../utils/adminScreenHelpers";
import {
  executeProductCsvImport,
  type ProductCsvImportProgress,
  type ProductCsvImportReport,
} from "../utils/productCsvImportExecutor";
import {
  buildProductCsvImportPreview,
  type ProductCsvImportPreview,
} from "../utils/productCsvImportPlan";
import {
  productCsvImportReportToCsv,
  productCsvReviewRowsToCsv,
} from "../utils/productCsvImportReport";

type Mutation<TParams, TResult> = {
  mutateAsync: (params: TParams) => Promise<TResult>;
};

type Params = {
  products: AdminProduct[];
  productAliases: AdminProductAlias[];
  productPriceStats: Map<string, ProductPriceStats>;
  stores: AdminStore[];
  setSubmitting: (value: boolean) => void;
  setNotice: (value: string | null) => void;
  loadAll: (keepNotice?: boolean) => Promise<void>;
  createProductMutation: Mutation<
    {
      koreanName: string;
      englishName?: string;
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
  createPriceEntryMutation: Mutation<
    {
      productId: string;
      storeId: string;
      price: string;
      observedAt?: string;
      periodEnd?: string;
    },
    unknown
  >;
  createAuditLogMutation?: Mutation<
    {
      action: string;
      entityType: string;
      entityId?: string;
      summary: string;
      metadata?: Record<string, unknown>;
    },
    unknown
  >;
};

export default function useAdminProductCsvActions(params: Params) {
  const [productCsvPreview, setProductCsvPreview] = React.useState<ProductCsvImportPreview | null>(
    null,
  );
  const [productCsvReport, setProductCsvReport] = React.useState<ProductCsvImportReport | null>(
    null,
  );
  const [productCsvProgress, setProductCsvProgress] =
    React.useState<ProductCsvImportProgress | null>(null);

  const handleExportProductsCsv = React.useCallback(
    (selectedProducts: AdminProduct[]) => {
      if (!selectedProducts.length) {
        params.setNotice("Select at least one product to export.");
        return;
      }
      const error = downloadCsvFile(
        "products",
        productsToCsv(selectedProducts, params.productPriceStats),
      );
      params.setNotice(error ?? `Exported ${selectedProducts.length} selected products to CSV.`);
    },
    [params],
  );

  const handleDownloadProductCsvTemplate = React.useCallback(() => {
    const error = downloadCsvFile("product-import-template", productImportTemplateCsv());
    params.setNotice(error ?? "Downloaded the product CSV import template.");
  }, [params]);

  const handleImportProductsCsv = React.useCallback(() => {
    if (Platform.OS !== "web") {
      params.setNotice("Product CSV import is currently available on web admin.");
      return;
    }
    const doc = (globalThis as { document?: any }).document;
    if (!doc?.createElement) {
      params.setNotice("Product CSV import is not available in this browser.");
      return;
    }
    const input = doc.createElement("input");
    input.type = "file";
    input.accept = "text/csv,.csv";
    input.multiple = false;
    input.onchange = () => {
      const selected = input.files?.[0];
      if (!selected) return;
      void selected
        .text()
        .then((csvText: string) => {
          const result = buildProductCsvImportPreview({
            csvText,
            fileName: selected.name || "products.csv",
            products: params.products,
            productAliases: params.productAliases,
            stores: params.stores,
          });
          if (!result.ok) {
            params.setNotice(result.error);
            return;
          }
          setProductCsvReport(null);
          setProductCsvPreview(result.preview);
          params.setNotice(null);
        })
        .catch((error: unknown) => {
          params.setNotice(error instanceof Error ? error.message : "CSV could not be read.");
        });
    };
    input.click();
  }, [params]);

  const handleConfirmProductCsvImport = React.useCallback(async () => {
    if (!productCsvPreview || productCsvProgress) return;
    params.setSubmitting(true);
    setProductCsvProgress({ completed: 0, total: 0, phase: "products" });
    try {
      const report = await executeProductCsvImport({
        preview: productCsvPreview,
        mutations: {
          createProduct: params.createProductMutation,
          createReview: params.createIdentityReviewMutation,
          createPrice: params.createPriceEntryMutation,
          createAuditLog: params.createAuditLogMutation,
        },
        onProgress: setProductCsvProgress,
      });
      setProductCsvReport(report);
      setProductCsvPreview(null);
      await params.loadAll(true);
      params.setNotice(
        `Import complete: ${report.createdProducts} products created, ` +
          `${report.importedPrices} prices saved, ${report.reviewRows} rows held for review.`,
      );
    } catch (error) {
      params.setNotice(error instanceof Error ? error.message : "Product CSV import failed.");
    } finally {
      setProductCsvProgress(null);
      params.setSubmitting(false);
    }
  }, [params, productCsvPreview, productCsvProgress]);

  const handleDownloadProductCsvReviewRows = React.useCallback(() => {
    if (!productCsvPreview) return;
    const error = downloadCsvFile(
      "product-import-review",
      productCsvReviewRowsToCsv(productCsvPreview),
    );
    if (error) params.setNotice(error);
  }, [params, productCsvPreview]);

  const handleDownloadProductCsvReport = React.useCallback(() => {
    if (!productCsvReport) return;
    const error = downloadCsvFile(
      "product-import-report",
      productCsvImportReportToCsv(productCsvReport),
    );
    if (error) params.setNotice(error);
  }, [params, productCsvReport]);

  return {
    handleConfirmProductCsvImport,
    handleDownloadProductCsvReport,
    handleDownloadProductCsvReviewRows,
    handleDownloadProductCsvTemplate,
    handleExportProductsCsv,
    handleImportProductsCsv,
    productCsvPreview,
    productCsvProgress,
    productCsvReport,
    setProductCsvPreview,
    setProductCsvReport,
  };
}
