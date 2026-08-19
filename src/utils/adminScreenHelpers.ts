import type React from "react";
import type { AdminStore } from "../services/adminBackoffice";
import { createFlyerRow } from "../state/adminStore";
import type { FlyerRow } from "../state/adminStore";
import { formatBusinessDate } from "./businessDateTime";
import { looksLikeProductStoreRecord } from "./storeVisibility";
export { PRODUCT_IMPORT_HEADERS } from "./productCsvHeaders";
export {
  downloadCsvFile,
  productImportTemplateCsv,
  productsToCsv,
  storesToCsv,
} from "./adminCsvFiles";

export type OverviewCard = {
  id: string;
  label: string;
  value: string;
  hint: string;
};

export type StorePriceSetInput = {
  id: string;
  persistedPriceId?: string;
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
  currentSaleStoreBrands: string[];
  saleSessions: Set<string>;
};

export type StorePriceStats = {
  priceCount: number;
  productIds: Set<string>;
  latestObservedAtMs: number;
};

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
  seed?: Partial<Pick<StorePriceSetInput, "persistedPriceId" | "brand" | "storeId" | "price" | "periodStartDate" | "periodEndDate">>,
): StorePriceSetInput {
  return {
    id: `sp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    persistedPriceId: seed?.persistedPriceId,
    brand: seed?.brand ?? "",
    storeId: seed?.storeId ?? "",
    price: seed?.price ?? "",
    periodStartDate: seed?.periodStartDate ?? "",
    periodEndDate: seed?.periodEndDate ?? "",
  };
}

export function looksLikeProductStoreRow(store: AdminStore): boolean {
  return looksLikeProductStoreRecord(store);
}

export function dateInputValue(value: string | null | undefined): string {
  return formatBusinessDate(value);
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
        englishName: /[가-힣]/.test(productName) ? "" : productName,
        koreanName: /[가-힣]/.test(productName) ? productName : "",
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
