import { flyerProductName } from "./flyerProductName";
import { flyerCategory } from "./flyerCategory";
import { PRODUCT_TEMPLATE_COLUMNS } from "./productCsvHeaders";
import { normalizeProductPrice } from "./productPriceInput";
import type { FlyerRow } from "../state/adminStore";

const FLYER_CSV_COLUMNS: Array<{ label: string; key: keyof Pick<
  FlyerRow,
  | "martName"
  | "regionBranch"
  | "saleStartDate"
  | "saleEndDate"
  | "koreanName"
  | "englishName"
  | "mainCategory"
  | "price"
  | "unit"
  | "memo"
> }> = [
  { label: "store_brand", key: "martName" },
  { label: "store_name", key: "regionBranch" },
  { label: "sale_start_date", key: "saleStartDate" },
  { label: "sale_end_date", key: "saleEndDate" },
  { label: "english_name", key: "englishName" },
  { label: "korean_name", key: "koreanName" },
  { label: "category", key: "mainCategory" },
  { label: "price", key: "price" },
  { label: "unit", key: "unit" },
  { label: "memo", key: "memo" },
];

function csvCell(value: string): string {
  const text = value.replace(/\r?\n/g, " ").trim();
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, "\"\"")}"`;
  }
  return text;
}

export function buildFlyerCsv(rows: FlyerRow[]): string {
  const header = FLYER_CSV_COLUMNS.map((column) => csvCell(column.label)).join(",");
  const body = rows.map((row) =>
    FLYER_CSV_COLUMNS.map((column) => csvCell(String(row[column.key] ?? ""))).join(","),
  );
  return ["\uFEFF" + header, ...body].join("\r\n") + "\r\n";
}

export function flyerRowsToProductCsv(rows: FlyerRow[]): string {
  const body = rows.map((row) => {
    const values: Record<(typeof PRODUCT_TEMPLATE_COLUMNS)[number], string> = {
      product_id: "",
      english_name: flyerProductName(row.englishName ?? "", row.unit),
      korean_name: row.koreanName,
      category: flyerCategory(row.mainCategory || row.subCategory || "", row.englishName),
      unit: row.unit,
      thumbnail_url: "",
      store_brand: row.martName,
      store_name: row.regionBranch,
      store_id: "",
      price: normalizeProductPrice(row.price) ?? "",
      sale_start_date: row.saleStartDate,
      sale_end_date: row.saleEndDate,
    };
    return PRODUCT_TEMPLATE_COLUMNS.map((key) => csvCell(values[key])).join(",");
  });
  return ["\uFEFF" + PRODUCT_TEMPLATE_COLUMNS.join(","), ...body].join("\r\n") + "\r\n";
}
