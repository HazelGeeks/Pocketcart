import { flyerProductName } from "./flyerProductName";
import { normalizeProductPrice } from "./productPriceInput";
import { flyerCategory } from "./flyerCategory";
import { createFlyerRow, type FlyerRow } from "../state/adminStore";

function textValue(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

function rowValue(row: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = textValue(row[key]);
    if (value) return value;
  }
  return "";
}

function normalizeFlyerAiRow(row: Partial<FlyerRow> & Record<string, unknown>): FlyerRow {
  const englishName = rowValue(row, "englishName", "english_name", "영문명", "영어명", "englishProductName", "english_product_name");
  const unit = rowValue(row, "unit", "단위");
  return createFlyerRow({
    selected: typeof row.selected === "boolean" ? row.selected : true,
    martName: rowValue(row, "martName", "mart_name", "storeBrand", "store_brand", "마트명", "마트브랜드", "marketName"),
    regionBranch: rowValue(row, "regionBranch", "region_branch", "storeName", "store_name", "branchName", "branch_name", "지역/지점", "branch", "location"),
    saleStartDate: rowValue(row, "saleStartDate", "sale_start_date", "세일 시작일", "startDate"),
    saleEndDate: rowValue(row, "saleEndDate", "sale_end_date", "세일 종료일", "endDate"),
    koreanName: rowValue(row, "koreanName", "korean_name", "name", "한글명", "한국어명", "이름", "productName", "product_name"),
    englishName: flyerProductName(englishName, unit),
    mainCategory: flyerCategory(rowValue(row, "mainCategory", "main_category", "category", "카테고리", "대분류"), englishName),
    subCategory: rowValue(row, "subCategory", "sub_category", "중분류"),
    price: normalizeProductPrice(rowValue(row, "price", "source_price", "가격")) ?? rowValue(row, "price", "source_price", "가격"),
    unit: rowValue(row, "unit", "단위"),
    memo: rowValue(row, "memo", "메모", "note", "ocrNote"),
  });
}

export function normalizeFlyerAiRows(rows: Array<Partial<FlyerRow> & Record<string, unknown>>): FlyerRow[] {
  return rows.map((row) => normalizeFlyerAiRow(row)).filter((row) => row.englishName || row.koreanName || row.price);
}
