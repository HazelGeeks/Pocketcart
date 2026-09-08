import { flyerCategory } from "./flyerCategory";
import type { FlyerRow } from "../state/adminStore";
import { productCsvDateToIso } from "./productCsvImport";
import { normalizeProductPrice } from "./productPriceInput";

/** Export may be a draft; store and sale dates can be completed before import. */
export function flyerProductIssues(row: FlyerRow): string[] {
  const issues: string[] = [];
  if (!row.englishName.trim()) issues.push("English name required");
  if (!flyerCategory(row.mainCategory, row.englishName)) issues.push("English category required");
  if (normalizeProductPrice(row.price) === null) issues.push("Single-item price required; check offer conditions in Memo");
  if (!row.unit.trim()) issues.push("Selling size / unit required");
  const start = productCsvDateToIso(row.saleStartDate, false);
  const end = productCsvDateToIso(row.saleEndDate, true);
  if ((row.saleStartDate.trim() && !start) || (row.saleEndDate.trim() && !end)) issues.push("Use valid sale dates or leave them blank");
  if (start && end && start > end) issues.push("Sale end precedes start");
  return issues;
}
