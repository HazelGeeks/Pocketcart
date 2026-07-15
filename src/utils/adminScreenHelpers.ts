import type React from "react";
import { Platform } from "react-native";
import type {
  AdminProduct,
  AdminStore,
} from "../services/adminBackoffice";
import { createFlyerRow } from "../state/adminStore";
import type { FlyerRow } from "../state/adminStore";
import { looksLikeProductStoreRecord } from "./storeVisibility";

export type OverviewCard = {
  id: string;
  label: string;
  value: string;
  hint: string;
};

export type StorePriceSetInput = {
  id: string;
  brand: string;
  storeId: string;
  price: string;
  periodStartDate: string;
  periodEndDate: string;
};

export type ProductPriceStats = {
  latestPrice: number | null;
  latestObservedAtMs: number;
  latestUpdatedAtMs: number;
  latestValidFrom: string | null;
  latestValidTo: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  storeIds: Set<string>;
  storeBrands: string[];
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
  .map((value: string) => value.trim().toLowerCase())
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
  storeName: ["store_name", "store", "stores", "summary_stores", "store name", "매장", "마트"],
  storeBrand: ["store_brand", "store brand", "summary_store_brands", "mart_brand", "mart brand", "마트브랜드"],
  storeAddress: ["store_address", "address", "store address", "주소"],
  storePlaceId: ["store_place_id", "place_id", "placeid", "google_place_id", "google_place", "장소id"],
  storeLatitude: ["store_latitude", "latitude", "lat", "위도"],
  storeLongitude: ["store_longitude", "longitude", "lng", "lon", "경도"],
  price: ["price", "current_price", "latest_price", "summary_latest_price", "source_price", "price_value", "가격"],
  observedAt: ["observed_at", "observedat", "valid_from", "sale_start_date", "summary_sale_start_date", "date", "날짜", "시작일", "시작 날짜", "기준일"],
  periodEnd: ["valid_to", "period_end", "sale_end_date", "summary_sale_end_date", "valid to", "종료일", "종료 날짜"],
};

export function productImportTemplateCsv(): string {
  const header = [
    "name",
    "english_name",
    "category",
    "unit",
    "thumbnail_url",
    "store_brand",
    "store_name",
    "store_id",
    "price",
    "sale_start_date",
    "sale_end_date",
  ];
  const rows = [
    [
      "Organic Eggs",
      "Organic Eggs",
      "Dairy",
      "12 ct",
      "",
      "Safeway",
      "Robson",
      "",
      "6.99",
      "2026-06-28",
      "2026-07-04",
    ],
    [
      "Bananas",
      "Bananas",
      "Produce",
      "1 lb",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
  ];

  return ["\uFEFF" + header.map(csvCell).join(","), ...rows.map((row) => row.map(csvCell).join(","))].join("\r\n") + "\r\n";
}

export const STORE_TYPE_OPTIONS = [
  { value: "grocery", label: "Grocery" },
  { value: "mart", label: "Mart" },
  { value: "wholesale", label: "Wholesale" },
  { value: "specialty", label: "Specialty" },
  { value: "online", label: "Online" },
  { value: "other", label: "Other" },
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
  seed?: Partial<Pick<StorePriceSetInput, "brand" | "storeId" | "price" | "periodStartDate" | "periodEndDate">>,
): StorePriceSetInput {
  return {
    id: `sp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    brand: seed?.brand ?? "",
    storeId: seed?.storeId ?? "",
    price: seed?.price ?? "",
    periodStartDate: seed?.periodStartDate ?? "",
    periodEndDate: seed?.periodEndDate ?? "",
  };
}

function csvCell(value: string): string {
  const text = value.replace(/\r?\n/g, " ").trim();
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, "\"\"")}"`;
  }
  return text;
}

export function productsToCsv(products: AdminProduct[], priceStats: Map<string, ProductPriceStats>): string {
  const header = [
    "id",
    "name",
    "english_name",
    "category",
    "unit",
    "thumbnail_url",
    "summary_latest_price",
    "summary_sale_start_date",
    "summary_sale_end_date",
    "summary_min_price",
    "summary_max_price",
    "summary_store_brands",
    "summary_stores",
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
      stats?.latestValidFrom ? dateInputValue(stats.latestValidFrom) : "",
      stats?.latestValidTo ? dateInputValue(stats.latestValidTo) : "",
      stats?.minPrice !== null && stats?.minPrice !== undefined ? stats.minPrice.toFixed(2) : "",
      stats?.maxPrice !== null && stats?.maxPrice !== undefined ? stats.maxPrice.toFixed(2) : "",
      stats?.storeBrands.join(" | ") ?? "",
      stats?.storeNames.join(" | ") ?? "",
      product.created_at,
    ].map(csvCell).join(",");
  });
  return ["\uFEFF" + header.map(csvCell).join(","), ...rows].join("\r\n") + "\r\n";
}

export function storesToCsv(stores: AdminStore[]): string {
  const header = [
    "id",
    "brand",
    "name",
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
      store.brand ?? "",
      store.name,
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
  return looksLikeProductStoreRecord(store);
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
  const coordinateQuery = `${store.latitude},${store.longitude}`;
  const params = new URLSearchParams({
    api: "1",
    query: coordinateQuery,
  });
  return `https://www.google.com/maps/search/?${params.toString()}`;
}

export function storeAddressSearchUrl(name: string, address: string, placeId: string): string {
  const query = [name, address].map((value) => value.trim()).filter(Boolean).join(" ");
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
