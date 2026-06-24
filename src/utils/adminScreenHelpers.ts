import type React from "react";
import { Platform } from "react-native";
import type {
  AdminProduct,
  AdminStore,
} from "../services/adminBackoffice";
import {
  createFlyerRow,
  type FlyerRow,
} from "../state/adminStore";

export type OverviewCard = {
  id: string;
  label: string;
  value: string;
  hint: string;
};

export type StorePriceSetInput = {
  id: string;
  storeId: string;
  price: string;
};

export type ProductPriceStats = {
  latestPrice: number | null;
  latestObservedAtMs: number;
  minPrice: number | null;
  maxPrice: number | null;
  storeIds: Set<string>;
  storeNames: string[];
};

export type StorePriceStats = {
  priceCount: number;
  productIds: Set<string>;
  latestObservedAtMs: number;
};

export function downloadCsvFile(prefix: string, csv: string): string | null {
  if (Platform.OS !== "web") {
    return "CSV export is currently available on web admin.";
  }

  const doc = (globalThis as { document?: any }).document;
  const urlApi = (globalThis as { URL?: typeof URL }).URL;
  if (!doc || typeof doc.createElement !== "function" || !urlApi?.createObjectURL) {
    return "CSV export is not available in this browser.";
  }

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const href = urlApi.createObjectURL(blob);
  const link = doc.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  link.href = href;
  link.download = `${prefix}-${date}.csv`;
  doc.body.appendChild(link);
  link.click();
  link.remove();
  urlApi.revokeObjectURL(href);
  return null;
}

export const DEFAULT_PRODUCT_CATEGORIES = [
  "Produce",
  "Dairy",
  "Meat",
  "Seafood",
  "Bakery",
  "Frozen",
  "Beverage",
  "Snacks",
  "Household",
  "Personal Care",
];

export const ADMIN_EMAIL_ALLOWLIST = (process.env.EXPO_PUBLIC_ADMIN_EMAILS ?? "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

export const WEB_FILTER_SELECT_STYLE: React.CSSProperties = {
  minWidth: 160,
  height: 40,
  borderRadius: 10,
  border: "1px solid #d8dee8",
  backgroundColor: "#ffffff",
  color: "#40506e",
  paddingLeft: 12,
  paddingRight: 12,
  fontSize: 12,
  fontWeight: 700,
};

export const WEB_FLYER_ACTION_BAR_STYLE: React.CSSProperties = {
  minHeight: 38,
  borderBottom: "1px solid #d9dee8",
  backgroundColor: "#f4f6fa",
  display: "flex",
  alignItems: "center",
  gap: 8,
  overflowX: "auto",
  padding: "5px 8px",
};

export const PRODUCT_IMPORT_HEADERS = {
  name: ["name", "product_name", "product", "이름", "상품명", "제품명"],
  englishName: ["english_name", "englishname", "english name", "eng_name", "eng name", "영문명", "영문이름", "영문 이름"],
  category: ["category", "main_category", "대분류", "카테고리", "분류"],
  unit: ["unit", "size", "size_unit", "용량", "규격"],
  thumbnailUrl: ["thumbnail_url", "thumbnail", "image_url", "image", "이미지", "이미지url"],
  storeId: ["store_id", "storeid", "store id"],
  storeName: ["store_name", "store", "store name", "매장", "마트"],
  price: ["price", "current_price", "latest_price", "price_value", "가격"],
  observedAt: ["observed_at", "observedat", "date", "날짜", "기준일"],
  periodEnd: ["valid_to", "period_end", "valid to", "종료일", "종료 날짜"],
};

export const STORE_TYPE_OPTIONS = [
  { value: "grocery", label: "Grocery" },
  { value: "mart", label: "Mart" },
  { value: "wholesale", label: "Wholesale" },
  { value: "specialty", label: "Specialty" },
  { value: "online", label: "Online" },
  { value: "other", label: "Other" },
];

const FLYER_CSV_COLUMNS: Array<{ label: string; key: keyof Omit<FlyerRow, "id" | "selected"> }> = [
  { label: "마트명", key: "martName" },
  { label: "지역/지점", key: "regionBranch" },
  { label: "세일 시작일", key: "saleStartDate" },
  { label: "세일 종료일", key: "saleEndDate" },
  { label: "이름", key: "name" },
  { label: "대분류", key: "mainCategory" },
  { label: "중분류", key: "subCategory" },
  { label: "브랜드", key: "brand" },
  { label: "가격", key: "price" },
  { label: "단위", key: "unit" },
  { label: "메모", key: "memo" },
];

export function toDateOnlyLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function toNonNegativeCount(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

export function toOptionalNumber(value: string): number | null {
  const text = value.trim();
  if (!text) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

export function uniqueValues(values: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  values.forEach((value) => {
    const text = value.trim();
    if (!text) return;
    const key = text.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(text);
  });
  return out;
}

export function createStorePriceSet(
  seed?: Partial<Pick<StorePriceSetInput, "storeId" | "price">>,
): StorePriceSetInput {
  return {
    id: `sp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    storeId: seed?.storeId ?? "",
    price: seed?.price ?? "",
  };
}

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

export function productsToCsv(products: AdminProduct[], priceStats: Map<string, ProductPriceStats>): string {
  const header = [
    "id",
    "name",
    "english_name",
    "category",
    "unit",
    "thumbnail_url",
    "latest_price",
    "min_price",
    "max_price",
    "stores",
    "created_at",
  ];
  const rows = products.map((product) => {
    const stats = priceStats.get(product.id);
    return [
      product.id,
      product.name,
      product.english_name ?? "",
      product.category,
      product.unit ?? "",
      product.thumbnail_url ?? "",
      stats?.latestPrice !== null && stats?.latestPrice !== undefined ? stats.latestPrice.toFixed(2) : "",
      stats?.minPrice !== null && stats?.minPrice !== undefined ? stats.minPrice.toFixed(2) : "",
      stats?.maxPrice !== null && stats?.maxPrice !== undefined ? stats.maxPrice.toFixed(2) : "",
      stats?.storeNames.join(" | ") ?? "",
      product.created_at,
    ].map(csvCell).join(",");
  });
  return ["\uFEFF" + header.map(csvCell).join(","), ...rows].join("\r\n") + "\r\n";
}

export function storesToCsv(stores: AdminStore[]): string {
  const header = [
    "id",
    "name",
    "area",
    "latitude",
    "longitude",
    "price_note",
    "address",
    "place_id",
    "phone",
    "website",
    "hours",
    "store_type",
    "is_active",
    "created_at",
  ];
  const rows = stores.map((store) =>
    [
      store.id,
      store.name,
      store.area,
      String(store.latitude),
      String(store.longitude),
      store.price_note ?? "",
      store.address ?? "",
      store.place_id ?? "",
      store.phone ?? "",
      store.website ?? "",
      store.hours ?? "",
      store.store_type,
      store.is_active ? "true" : "false",
      store.created_at,
    ].map(csvCell).join(","),
  );
  return ["\uFEFF" + header.map(csvCell).join(","), ...rows].join("\r\n") + "\r\n";
}

export function looksLikeProductStoreRow(store: AdminStore): boolean {
  const joined = `${store.name} ${store.area} ${store.price_note ?? ""}`.toLowerCase();
  if (/\$\s*\d|\b\d+(?:\.\d{1,2})?\s*(?:ea|each|lb|kg|g|ml|l|pk|pack|ct)\b/i.test(joined)) {
    return true;
  }
  if (/^(eggs?|milk|bread|apple|banana|chicken|beef|pork|rice|ramen)\b/i.test(store.name.trim())) {
    return true;
  }
  return false;
}

export function flyerRowsToProductCsv(rows: FlyerRow[]): string {
  const header = [
    "name",
    "category",
    "thumbnail_url",
    "brand",
    "source_price",
    "unit",
    "memo",
  ];
  const body = rows.map((row) => {
    const name = [row.brand, row.name]
      .map((value) => value.trim())
      .filter(Boolean)
      .join(" ");
    return [
      name || row.name,
      row.mainCategory || row.subCategory || "Uncategorized",
      "",
      row.brand,
      row.price,
      row.unit,
      row.memo,
    ].map(csvCell).join(",");
  });
  return ["\uFEFF" + header.map(csvCell).join(","), ...body].join("\r\n") + "\r\n";
}

export function dateInputValue(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function storeMapUrl(
  store: Pick<AdminStore, "name" | "area" | "latitude" | "longitude" | "address" | "place_id">,
): string {
  const query = [store.name, store.area, store.address ?? ""].filter(Boolean).join(" ");
  const params = new URLSearchParams({
    api: "1",
    query: query || `${store.latitude},${store.longitude}`,
  });
  if (store.place_id) {
    params.set("query_place_id", store.place_id);
  }
  return `https://www.google.com/maps/search/?${params.toString()}`;
}

export function storeAddressSearchUrl(name: string, area: string, address: string, placeId: string): string {
  const query = [name, area, address].map((value) => value.trim()).filter(Boolean).join(" ");
  const params = new URLSearchParams({
    api: "1",
    query,
  });
  if (placeId.trim()) {
    params.set("query_place_id", placeId.trim());
  }
  return `https://www.google.com/maps/search/?${params.toString()}`;
}

export function normalizeOcrText(value: string): string {
  return value
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanFlyerProductName(value: string): string {
  return value
    .replace(/^[\s\d.)(-]+/, "")
    .replace(/\b(save|sale|club|member|each|ea|lb|kg)\b/gi, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function parseFlyerPrice(value: string): string {
  const normalized = value.replace(/,/g, ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed.toFixed(2) : "";
}

function inferFlyerMainCategory(productName: string): string {
  const text = productName.toLowerCase();
  const direct = DEFAULT_PRODUCT_CATEGORIES.find((category) => text.includes(category.toLowerCase()));
  if (direct) return direct;
  if (/\b(milk|cheese|yogurt|cream|butter)\b/i.test(productName)) return "Dairy";
  if (/\b(chicken|beef|pork|turkey|sausage)\b/i.test(productName)) return "Meat";
  if (/\b(apple|banana|tomato|lettuce|onion|potato|berry|berries)\b/i.test(productName)) return "Produce";
  if (/\b(bread|bagel|bun|cake|muffin)\b/i.test(productName)) return "Bakery";
  if (/\b(juice|soda|water|coffee|tea)\b/i.test(productName)) return "Beverage";
  if (/\b(chips|cracker|cookie|snack)\b/i.test(productName)) return "Snacks";
  return "";
}

function inferFlyerUnit(value: string): string {
  const match = value.match(/\b(each|ea|lb|lbs|kg|g|ml|l|oz|pack|pk|ct)\b/i);
  return match?.[1] ?? "";
}

export function parseFlyerTextToRows(text: string): FlyerRow[] {
  const lines = normalizeOcrText(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const rows: FlyerRow[] = [];
  let previousText = "";

  lines.forEach((line) => {
    const priceMatches = Array.from(
      line.matchAll(/(?:cad|ca|\$)?\s*(\d{1,3}(?:[.,]\d{2}))(?!\d)/gi),
    );
    const priceMatch = priceMatches[priceMatches.length - 1];
    if (!priceMatch || priceMatch.index === undefined) {
      previousText = cleanFlyerProductName(line) || previousText;
      return;
    }

    const price = parseFlyerPrice(priceMatch[1] ?? "");
    if (!price) return;

    const beforePrice = line.slice(0, priceMatch.index);
    const afterPrice = line.slice(priceMatch.index + priceMatch[0].length);
    const productName = cleanFlyerProductName(beforePrice) || cleanFlyerProductName(previousText);
    if (!productName || productName.length < 2) {
      previousText = cleanFlyerProductName(afterPrice) || previousText;
      return;
    }

    rows.push(
      createFlyerRow({
        name: productName,
        mainCategory: inferFlyerMainCategory(productName),
        price,
        unit: inferFlyerUnit(line),
        memo: line,
      }),
    );
    previousText = cleanFlyerProductName(afterPrice);
  });

  return rows;
}
