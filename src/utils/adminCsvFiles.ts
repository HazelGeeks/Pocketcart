import { Platform } from "react-native";
import type { AdminProduct, AdminStore } from "../services/adminBackoffice";
import type { ProductPriceStats } from "./adminScreenHelpers";
import { formatBusinessDate } from "./businessDateTime";

function csvCell(value: string): string {
  const text = value.replace(/\r?\n/g, " ").trim();
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function downloadCsvFile(prefix: string, csv: string): string | null {
  if (Platform.OS !== "web") return "CSV export is currently available on web admin.";
  const doc = (globalThis as { document?: any }).document;
  const urlApi = (globalThis as { URL?: typeof URL }).URL;
  if (!doc?.createElement || !urlApi?.createObjectURL) {
    return "CSV export is not available in this browser.";
  }
  const href = urlApi.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = doc.createElement("a");
  link.href = href;
  link.download = `${prefix}-${new Date().toISOString().slice(0, 10)}.csv`;
  doc.body.appendChild(link);
  link.click();
  link.remove();
  urlApi.revokeObjectURL(href);
  return null;
}

export function productImportTemplateCsv(): string {
  const header = [
    "product_id", "english_name", "korean_name", "category", "unit", "thumbnail_url",
    "store_brand", "store_name", "store_id", "price", "sale_start_date", "sale_end_date",
  ];
  const rows = [
    ["", "Organic Eggs", "유기농 달걀", "Dairy", "12 ct", "", "Safeway", "", "", "6.99", "2026-06-28", "2026-07-04"],
    ["", "Bananas", "바나나", "Produce", "1 lb", "", "", "", "", "", "", ""],
  ];
  return ["\uFEFF" + header.map(csvCell).join(","), ...rows.map((row) => row.map(csvCell).join(","))]
    .join("\r\n") + "\r\n";
}

export function productsToCsv(
  products: AdminProduct[],
  priceStats: Map<string, ProductPriceStats>,
): string {
  const header = [
    "id", "english_name", "korean_name", "category", "unit", "thumbnail_url",
    "summary_latest_price", "summary_sale_start_date", "summary_sale_end_date",
    "summary_min_price", "summary_max_price", "summary_store_brands", "summary_stores", "created_at",
  ];
  const rows = products.map((product) => {
    const stats = priceStats.get(product.id);
    return [
      product.id,
      product.english_name ?? "",
      product.korean_name,
      product.category,
      product.unit ?? "",
      product.thumbnail_url ?? "",
      stats?.latestPrice !== null && stats?.latestPrice !== undefined ? stats.latestPrice.toFixed(2) : "",
      stats?.latestValidFrom ? formatBusinessDate(stats.latestValidFrom) : "",
      stats?.latestValidTo ? formatBusinessDate(stats.latestValidTo) : "",
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
    "id", "brand", "name", "latitude", "longitude", "price_note", "address",
    "place_id", "phone", "website", "hours", "store_type", "is_active", "created_at",
  ];
  const rows = stores.map((store) => [
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
  ].map(csvCell).join(","));
  return ["\uFEFF" + header.map(csvCell).join(","), ...rows].join("\r\n") + "\r\n";
}
