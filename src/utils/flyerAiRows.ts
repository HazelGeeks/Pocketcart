import { createFlyerRow, type FlyerCropCandidate, type FlyerRow } from "../state/adminStore";

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

function numericValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function normalizeUnitValue(value: number | null): number | null {
  if (value === null) return null;
  if (value > 1 && value <= 100) return value / 100;
  if (value >= 0 && value <= 1) return value;
  return null;
}

function normalizeImageBox(row: Record<string, unknown>): FlyerCropCandidate | null {
  const boxValue = row.imageBox ?? row.image_box ?? row.cropCandidate ?? row.crop_candidate;
  if (!boxValue || typeof boxValue !== "object") return null;
  const box = boxValue as Record<string, unknown>;

  const x = normalizeUnitValue(numericValue(box.x ?? box.left));
  const y = normalizeUnitValue(numericValue(box.y ?? box.top));
  const width = normalizeUnitValue(numericValue(box.width ?? box.w));
  const height = normalizeUnitValue(numericValue(box.height ?? box.h));
  if (x === null || y === null || width === null || height === null) return null;
  if (width <= 0 || height <= 0) return null;

  const rawPageIndex = numericValue(row.pageIndex ?? row.page_index ?? box.pageIndex ?? box.page_index);
  const pageIndex = rawPageIndex === null ? 0 : Math.max(0, Math.floor(rawPageIndex));
  const confidence = numericValue(row.imageConfidence ?? row.image_confidence ?? box.confidence);
  const sourceLabel = rowValue(row, "sourceLabel", "source_label") || `Page ${pageIndex + 1}`;

  return {
    pageIndex,
    x: Math.max(0, Math.min(1, x)),
    y: Math.max(0, Math.min(1, y)),
    width: Math.max(0, Math.min(1, width)),
    height: Math.max(0, Math.min(1, height)),
    confidence: confidence === null ? null : Math.max(0, Math.min(1, confidence > 1 ? confidence / 100 : confidence)),
    sourceLabel,
  };
}

export function normalizeFlyerAiRow(row: Partial<FlyerRow> & Record<string, unknown>): FlyerRow {
  const cropCandidate = normalizeImageBox(row);
  return createFlyerRow({
    selected: typeof row.selected === "boolean" ? row.selected : true,
    imageSelected: Boolean(cropCandidate),
    imageStatus: cropCandidate ? "candidate" : "none",
    thumbnailUrl: rowValue(row, "thumbnailUrl", "thumbnail_url", "imageUrl", "image_url"),
    cropCandidate,
    martName: rowValue(row, "martName", "mart_name", "storeBrand", "store_brand", "마트명", "마트브랜드", "marketName"),
    regionBranch: rowValue(row, "regionBranch", "region_branch", "storeName", "store_name", "branchName", "branch_name", "지역/지점", "branch", "location"),
    saleStartDate: rowValue(row, "saleStartDate", "sale_start_date", "세일 시작일", "startDate"),
    saleEndDate: rowValue(row, "saleEndDate", "sale_end_date", "세일 종료일", "endDate"),
    name: rowValue(row, "name", "koreanName", "korean_name", "한글명", "한국어명", "이름", "productName", "product_name"),
    englishName: rowValue(row, "englishName", "english_name", "영문명", "영어명", "englishProductName", "english_product_name"),
    mainCategory: rowValue(row, "mainCategory", "main_category", "category", "카테고리", "대분류"),
    subCategory: rowValue(row, "subCategory", "sub_category", "중분류"),
    brand: rowValue(row, "brand", "productBrand", "product_brand", "상품브랜드", "상품 브랜드", "브랜드"),
    price: rowValue(row, "price", "가격"),
    unit: rowValue(row, "unit", "단위"),
    memo: rowValue(row, "memo", "메모", "note", "ocrNote"),
  });
}

export function normalizeFlyerAiRows(rows: Array<Partial<FlyerRow> & Record<string, unknown>>): FlyerRow[] {
  return rows.map((row) => normalizeFlyerAiRow(row)).filter((row) => row.name || row.price);
}
