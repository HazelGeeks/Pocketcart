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
  return `${store.name} ${store.area} ${store.price_note ?? ""}`
    .toLowerCase()
    .includes(q);
}
