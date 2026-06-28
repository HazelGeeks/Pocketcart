import type { MarketProduct, MarketStore, ServiceResult } from "./types";

export function missingEnvResult<T>(fallback: T): ServiceResult<T> {
  return {
    data: fallback,
    error:
      "Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.",
  };
}

export function parseNumber(value: number | string | null | undefined): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function matchesProductFilter(
  product: MarketProduct,
  search?: string,
  category?: string,
): boolean {
  const q = search?.trim().toLowerCase() ?? "";
  const c = category?.trim().toLowerCase() ?? "";

  const passSearch =
    q.length === 0 ||
    `${product.name} ${product.category}`.toLowerCase().includes(q);

  const passCategory =
    c.length === 0 || c === "all" || product.category.toLowerCase() === c;

  return passSearch && passCategory;
}

export function matchesStoreFilter(store: MarketStore, search?: string): boolean {
  const q = search?.trim().toLowerCase() ?? "";
  if (!q) return true;
  return `${store.brand ?? ""} ${store.name} ${store.area} ${store.price_note ?? ""}`
    .toLowerCase()
    .includes(q);
}

export function calculateHaversineDistanceKm(
  originLat: number,
  originLng: number,
  targetLat: number,
  targetLng: number,
): number {
  const R = 6371;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const deltaLat = toRadians(targetLat - originLat);
  const deltaLng = toRadians(targetLng - originLng);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(originLat)) *
      Math.cos(toRadians(targetLat)) *
      Math.sin(deltaLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}
