import React from "react";
import type {
  AdminAuditLog,
  AdminPriceEntry,
  AdminProduct,
  AdminStore,
} from "../services/adminBackoffice";
import type { ProductSortKey } from "../state/adminStore";
import {
  DEFAULT_PRODUCT_CATEGORIES,
  STORE_TYPE_OPTIONS,
  looksLikeProductStoreRow,
  toNonNegativeCount,
  toOptionalNumber,
  uniqueValues,
  type OverviewCard,
  type ProductPriceStats,
  type StorePriceStats,
} from "../utils/adminScreenHelpers";

type AdminDashboardDataParams = {
  products: AdminProduct[];
  stores: AdminStore[];
  prices: AdminPriceEntry[];
  auditLogs: AdminAuditLog[];
  storeSearchQuery: string;
  storeAreaFilter: string;
  storeStatusFilter: string;
  storeTypeFilter: string;
  selectedStoreMapId: string | null;
  productSearchQuery: string;
  productCategoryFilter: string;
  productStoreFilter: string;
  productPriceMin: string;
  productPriceMax: string;
  productSort: ProductSortKey;
  flyerSelectedRows: number;
};

export default function useAdminDashboardData({
  products,
  stores,
  prices,
  auditLogs,
  storeSearchQuery,
  storeAreaFilter,
  storeStatusFilter,
  storeTypeFilter,
  selectedStoreMapId,
  productSearchQuery,
  productCategoryFilter,
  productStoreFilter,
  productPriceMin,
  productPriceMax,
  productSort,
  flyerSelectedRows,
}: AdminDashboardDataParams) {
  const priceRowsMissingLink = React.useMemo(
    () => prices.filter((row) => !row.product_name || !row.store_name).length,
    [prices],
  );

  const displayStores = React.useMemo(
    () => stores.filter((store) => !looksLikeProductStoreRow(store)),
    [stores],
  );

  const stalePriceRows = React.useMemo(() => {
    const now = Date.now();
    const thirtyDays = 1000 * 60 * 60 * 24 * 30;
    return prices.filter((row) => {
      const time = new Date(row.observed_at).getTime();
      if (Number.isNaN(time)) return false;
      return now - time > thirtyDays;
    }).length;
  }, [prices]);

  const overviewCards = React.useMemo<OverviewCard[]>(
    () => [
      {
        id: "products",
        label: "Products",
        value: String(products.length),
        hint: "Catalog items",
      },
      {
        id: "stores",
        label: "Stores",
        value: String(displayStores.length),
        hint: "Store locations",
      },
      {
        id: "issues",
        label: "Data Health",
        value: String(toNonNegativeCount(priceRowsMissingLink + stalePriceRows)),
        hint: "Link freshness",
      },
    ],
    [displayStores.length, priceRowsMissingLink, products.length, stalePriceRows],
  );

  const recentStoreOptions = React.useMemo(() => stores.slice(0, 16), [stores]);
  const categoryOptions = React.useMemo(
    () => uniqueValues([...DEFAULT_PRODUCT_CATEGORIES, ...products.map((item) => item.category)]),
    [products],
  );
  const productFilterCategoryOptions = React.useMemo(
    () => uniqueValues(products.map((item) => item.category)),
    [products],
  );

  const storeNameById = React.useMemo(() => {
    const map = new Map<string, string>();
    stores.forEach((store) => {
      const storeId = store.id.trim();
      if (!storeId) return;
      map.set(storeId, store.name.trim() || storeId);
    });
    prices.forEach((row) => {
      const storeId = row.store_id.trim();
      if (!storeId || map.has(storeId)) return;
      map.set(storeId, row.store_name?.trim() || storeId);
    });
    return map;
  }, [prices, stores]);

  const productNameById = React.useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((product) => {
      const productId = product.id.trim();
      if (!productId) return;
      map.set(productId, product.name.trim() || productId);
    });
    prices.forEach((row) => {
      const productId = row.product_id.trim();
      if (!productId || map.has(productId)) return;
      map.set(productId, row.product_name?.trim() || productId);
    });
    return map;
  }, [prices, products]);

  const productPriceStats = React.useMemo(() => {
    const stats = new Map<string, ProductPriceStats>();
    prices.forEach((row) => {
      const productId = row.product_id.trim();
      if (!productId) return;
      const storeId = row.store_id.trim();
      const observedAtMs = new Date(row.observed_at).getTime();
      const parsedObservedAtMs = Number.isFinite(observedAtMs) ? observedAtMs : -1;
      const storeName = row.store_name?.trim() || storeNameById.get(storeId) || storeId;
      const existing = stats.get(productId);

      if (!existing) {
        stats.set(productId, {
          latestPrice: row.price,
          latestObservedAtMs: parsedObservedAtMs,
          minPrice: row.price,
          maxPrice: row.price,
          storeIds: new Set(storeId ? [storeId] : []),
          storeNames: storeName ? [storeName] : [],
        });
        return;
      }

      if (storeId) existing.storeIds.add(storeId);
      if (storeName && !existing.storeNames.some((item) => item.toLowerCase() === storeName.toLowerCase())) {
        existing.storeNames.push(storeName);
      }
      if (existing.minPrice === null || row.price < existing.minPrice) existing.minPrice = row.price;
      if (existing.maxPrice === null || row.price > existing.maxPrice) existing.maxPrice = row.price;
      if (parsedObservedAtMs >= existing.latestObservedAtMs) {
        existing.latestObservedAtMs = parsedObservedAtMs;
        existing.latestPrice = row.price;
      }
    });
    return stats;
  }, [prices, storeNameById]);

  const productStoreFilterOptions = React.useMemo(() => {
    return Array.from(storeNameById.entries())
      .map(([id, name]) => ({ id, name: name.trim() || id }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [storeNameById]);

  const storePriceStats = React.useMemo(() => {
    const stats = new Map<string, StorePriceStats>();
    prices.forEach((row) => {
      const storeId = row.store_id.trim();
      if (!storeId) return;
      const productId = row.product_id.trim();
      const observedAtMs = new Date(row.observed_at).getTime();
      const existing = stats.get(storeId);
      if (!existing) {
        stats.set(storeId, {
          priceCount: 1,
          productIds: new Set(productId ? [productId] : []),
          latestObservedAtMs: Number.isFinite(observedAtMs) ? observedAtMs : -1,
        });
        return;
      }
      existing.priceCount += 1;
      if (productId) existing.productIds.add(productId);
      if (Number.isFinite(observedAtMs) && observedAtMs > existing.latestObservedAtMs) {
        existing.latestObservedAtMs = observedAtMs;
      }
    });
    return stats;
  }, [prices]);

  const storeAreaOptions = React.useMemo(
    () => uniqueValues(displayStores.map((store) => store.area)).sort((a, b) => a.localeCompare(b)),
    [displayStores],
  );

  const storeTypeOptions = React.useMemo(
    () =>
      uniqueValues([
        ...STORE_TYPE_OPTIONS.map((option) => option.value),
        ...displayStores.map((store) => store.store_type),
      ]).sort((a, b) => a.localeCompare(b)),
    [displayStores],
  );

  const filteredStores = React.useMemo(() => {
    const query = storeSearchQuery.trim().toLowerCase();
    const areaFilter = storeAreaFilter.trim().toLowerCase();
    const statusFilter = storeStatusFilter.trim().toLowerCase();
    const typeFilter = storeTypeFilter.trim().toLowerCase();
    return displayStores.filter((store) => {
      if (areaFilter !== "all" && store.area.trim().toLowerCase() !== areaFilter) return false;
      if (statusFilter === "active" && !store.is_active) return false;
      if (statusFilter === "inactive" && store.is_active) return false;
      if (typeFilter !== "all" && store.store_type.trim().toLowerCase() !== typeFilter) return false;
      if (!query) return true;
      const stats = storePriceStats.get(store.id);
      const haystack = [
        store.name,
        store.area,
        store.id,
        store.price_note ?? "",
        store.address ?? "",
        store.place_id ?? "",
        store.phone ?? "",
        store.website ?? "",
        store.hours ?? "",
        store.store_type,
        store.is_active ? "active" : "inactive",
        String(store.latitude),
        String(store.longitude),
        String(stats?.priceCount ?? 0),
      ].join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }, [displayStores, storeAreaFilter, storePriceStats, storeSearchQuery, storeStatusFilter, storeTypeFilter]);

  const storeActiveFilterCount = React.useMemo(() => {
    let count = 0;
    if (storeSearchQuery.trim()) count += 1;
    if (storeAreaFilter !== "all") count += 1;
    if (storeStatusFilter !== "all") count += 1;
    if (storeTypeFilter !== "all") count += 1;
    return count;
  }, [storeAreaFilter, storeSearchQuery, storeStatusFilter, storeTypeFilter]);

  const selectedStoreForMap = React.useMemo(() => {
    if (!selectedStoreMapId) return null;
    return filteredStores.find((store) => store.id === selectedStoreMapId) ?? null;
  }, [filteredStores, selectedStoreMapId]);

  const storeAuditLogs = React.useMemo(
    () => auditLogs.filter((log) => log.entity_type === "store").slice(0, 8),
    [auditLogs],
  );

  const productSortOptions = React.useMemo<Array<{ key: ProductSortKey; label: string }>>(
    () => [
      { key: "latest", label: "Latest" },
      { key: "name", label: "Name" },
      { key: "priceLow", label: "Price Low" },
      { key: "priceHigh", label: "Price High" },
    ],
    [],
  );

  const productMinPriceFilter = React.useMemo(() => toOptionalNumber(productPriceMin), [productPriceMin]);
  const productMaxPriceFilter = React.useMemo(() => toOptionalNumber(productPriceMax), [productPriceMax]);

  const filteredProducts = React.useMemo(() => {
    const query = productSearchQuery.trim().toLowerCase();
    const categoryFilter = productCategoryFilter.trim().toLowerCase();
    const storeFilter = productStoreFilter.trim();

    const filtered = products.filter((item) => {
      const stats = productPriceStats.get(item.id);
      const category = item.category.trim().toLowerCase();

      if (query) {
        const storeNames = stats?.storeNames.join(" ").toLowerCase() ?? "";
        const haystack = `${item.name} ${item.category} ${item.id} ${storeNames}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      if (categoryFilter !== "all" && category !== categoryFilter) return false;
      if (storeFilter.toLowerCase() !== "all" && !stats?.storeIds.has(storeFilter)) return false;

      const latestPrice = stats?.latestPrice ?? null;
      if (productMinPriceFilter !== null && (latestPrice === null || latestPrice < productMinPriceFilter)) return false;
      if (productMaxPriceFilter !== null && (latestPrice === null || latestPrice > productMaxPriceFilter)) return false;
      return true;
    });

    filtered.sort((a, b) => {
      if (productSort === "name") return a.name.localeCompare(b.name);
      if (productSort === "priceLow" || productSort === "priceHigh") {
        const aPrice = productPriceStats.get(a.id)?.latestPrice ?? Number.POSITIVE_INFINITY;
        const bPrice = productPriceStats.get(b.id)?.latestPrice ?? Number.POSITIVE_INFINITY;
        if (aPrice !== bPrice) return productSort === "priceLow" ? aPrice - bPrice : bPrice - aPrice;
      }
      const aTime = productPriceStats.get(a.id)?.latestObservedAtMs ?? -1;
      const bTime = productPriceStats.get(b.id)?.latestObservedAtMs ?? -1;
      return bTime - aTime;
    });

    return filtered;
  }, [
    productCategoryFilter,
    productMaxPriceFilter,
    productMinPriceFilter,
    productPriceStats,
    productSearchQuery,
    productSort,
    productStoreFilter,
    products,
  ]);

  const productActiveFilterCount = React.useMemo(() => {
    let count = 0;
    if (productSearchQuery.trim()) count += 1;
    if (productCategoryFilter !== "all") count += 1;
    if (productStoreFilter !== "all") count += 1;
    if (productPriceMin.trim()) count += 1;
    if (productPriceMax.trim()) count += 1;
    return count;
  }, [productCategoryFilter, productPriceMax, productPriceMin, productSearchQuery, productStoreFilter]);

  return {
    categoryOptions,
    displayStores,
    filteredProducts,
    filteredStores,
    flyerSelectedCount: flyerSelectedRows,
    overviewCards,
    priceRowsMissingLink,
    productActiveFilterCount,
    productFilterCategoryOptions,
    productNameById,
    productPriceStats,
    productSortOptions,
    productStoreFilterOptions,
    recentStoreOptions,
    selectedStoreForMap,
    stalePriceRows,
    storeActiveFilterCount,
    storeAreaOptions,
    storeAuditLogs,
    storeNameById,
    storePriceStats,
    storeTypeOptions,
  };
}
