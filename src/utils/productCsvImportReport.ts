import type {
  ProductCsvImportReport,
} from "./productCsvImportExecutor";
import type { ProductCsvImportPreview } from "./productCsvImportPlan";

function csvCell(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function productCsvImportReportToCsv(report: ProductCsvImportReport): string {
  const header = ["row", "status", "product_result", "price_result", "detail"];
  const rows = report.rows.map((row) =>
    [String(row.rowNumber), row.status, row.productResult, row.priceResult, row.detail]
      .map(csvCell)
      .join(","),
  );
  return ["\uFEFF" + header.join(","), ...rows].join("\r\n") + "\r\n";
}

export function productCsvReviewRowsToCsv(preview: ProductCsvImportPreview): string {
  const header = ["row", "english_name", "korean_name", "category", "unit", "reason", "candidate_product_ids"];
  const rows = preview.rows
    .filter((row) => ["review", "invalid"].includes(row.productAction))
    .map((row) => [
      String(row.rowNumber),
      row.input.englishName,
      row.input.koreanName,
      row.input.category,
      row.input.unit,
      row.message ?? "",
      row.candidateProductIds.join(" | "),
    ].map(csvCell).join(","));
  return ["\uFEFF" + header.join(","), ...rows].join("\r\n") + "\r\n";
}
