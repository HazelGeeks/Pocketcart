import React from "react";
import type {
  AdminAuditLog,
  AdminPriceEntry,
  AdminProduct,
  AdminStore,
} from "../services/adminBackoffice";
import type { ProductSortKey } from "../state/adminStore";
import { dateOnlyToIso } from "../utils/adminValidation";
import { saleSessionKey } from "../utils/saleSession";
import {
  DEFAULT_PRODUCT_CATEGORIES,
  STORE_TYPE_OPTIONS,
  looksLikeProductStoreRow,
  toNonNegativeCount,
  uniqueValues,
  type OverviewCard,
  type ProductPriceStats,
  type StorePriceStats,
} from "../utils/adminScreenHelpers";
import { buildProductDataHealth } from "../utils/productDataHealth";

type AdminDashboardDataParams = {
  products: AdminProduct[];
  stores: AdminStore[];
  prices: AdminPriceEntry[];
  auditLogs: AdminAuditLog[];
  storeSearchQuery: string;
  storeBrandFilter: string;
  storeStatusFilter: string;
  storeTypeFilter: string;
  selectedStoreMapId: string | null;
  productSearchQuery: string;
  productCategoryFilter: string;
  productBrandFilter: string;
  productStoreFilter: string;
  productSaleDateFilter: string;
  productSort: ProductSortKey;
  flyerSelectedRows: number;
};

const PRODUCT_STORE_UNASSIGNED_FILTER = "__unassigned";

function splitSaleDateFilter(value: string): { startDate: string; endDate: string } {
  const [startDate = "", endDate = ""] = value.split("|");
  return {
    startDate: startDate.trim(),
    endDate: endDate.trim(),
  };
}

export default function useAdminDashboardData({
  products,
  stores,
  prices,
  auditLogs,
  storeSearchQuery,
  storeBrandFilter,
  storeStatusFilter,
  storeTypeFilter,
  selectedStoreMapId,
  productSearchQuery,
  productCategoryFilter,
  productBrandFilter,
  productStoreFilter,
  productSaleDateFilter,
  productSort,
  flyerSelectedRows,
}: AdminDashboardDataParams) {
  const displayStores = React.useMemo(
    () => stores.filter((store) => !looksLikeProductStoreRow(store)),
    [stores],
  );

  const productDataHealth = React.useMemo(
    () => buildProductDataHealth(products, prices),
    [prices, products],
  );

  const overviewCards = React.useMemo<OverviewCard[]>(
    () => [
      {
        id: "products",
        label: "Products",
        value: String(products.length),
        hint: "All saved products",
      },
      {
        id: "stores",
        label: "Stores",
        value: String(displayStores.length),
        hint: "Store locations",
      },
      {
        id: "history",
        label: "4+ Sale Periods",
        value: String(productDataHealth.fourPlusSessions),
        hint: `${productDataHealth.twoPlusSessions} have prices from 2+ sale periods`,
      },
      {
        id: "issues",
        label: "Data Issues",
        value: String(toNonNegativeCount(productDataHealth.issueCount)),
        hint: "Missing details, dates, links, or recent prices",
      },
    ],
    [displayStores.length, productDataHealth, products.length],
  );

  const productFormStoreOptions = displayStores;
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
    displayStores.forEach((store) => {
      const storeId = store.id.trim();
      if (!storeId) return;
      const branchName = store.name.trim() || storeId;
      map.set(storeId, store.brand ? `${store.brand} - ${branchName}` : branchName);
    });
    prices.forEach((row) => {
      const storeId = row.store_id.trim();
      if (!storeId || map.has(storeId)) return;
      map.set(storeId, row.store_name?.trim() || storeId);
    });
    return map;
  }, [displayStores, prices]);

  const storeBrandById = React.useMemo(() => {
    const map = new Map<string, string>();
    displayStores.forEach((store) => {
      const storeId = store.id.trim();
      if (!storeId) return;
      map.set(storeId, store.brand?.trim() || "Other");
    });
    return map;
  }, [displayStores]);

  const productPriceStats = React.useMemo(() => {
    const stats = new Map<string, ProductPriceStats>();
    prices.forEach((row) => {
      const productId = row.product_id.trim();
      if (!productId) return;
      const storeId = row.store_id.trim();
      const latestDate = row.valid_from || row.observed_at;
      const observedAtMs = new Date(latestDate).getTime();
      const parsedObservedAtMs = Number.isFinite(observedAtMs) ? observedAtMs : -1;
      const updatedAtMs = new Date(row.created_at).getTime();
      const parsedUpdatedAtMs = Number.isFinite(updatedAtMs) ? updatedAtMs : -1;
      const storeName = row.store_name?.trim() || storeNameById.get(storeId) || storeId;
      const storeBrand = storeBrandById.get(storeId) ?? "";
      const existing = stats.get(productId);

      if (!existing) {
        stats.set(productId, {
          latestPrice: row.price,
          latestObservedAtMs: parsedObservedAtMs,
          latestUpdatedAtMs: parsedUpdatedAtMs,
          latestValidFrom: row.valid_from || row.observed_at,
          latestValidTo: row.valid_to,
          minPrice: row.price,
          maxPrice: row.price,
          storeIds: new Set(storeId ? [storeId] : []),
          storeBrands: storeBrand ? [storeBrand] : [],
          storeNames: storeName ? [storeName] : [],
          saleSessions: new Set([
            saleSessionKey({
              validFrom: row.valid_from,
              validTo: row.valid_to,
              observedAt: row.observed_at,
            }),
          ]),
        });
        return;
      }

      if (storeId) existing.storeIds.add(storeId);
      if (storeBrand && !existing.storeBrands.some((item) => item.toLowerCase() === storeBrand.toLowerCase())) {
        existing.storeBrands.push(storeBrand);
      }
      if (storeName && !existing.storeNames.some((item) => item.toLowerCase() === storeName.toLowerCase())) {
        existing.storeNames.push(storeName);
      }
      existing.saleSessions.add(
        saleSessionKey({
          validFrom: row.valid_from,
          validTo: row.valid_to,
          observedAt: row.observed_at,
        }),
      );
      if (existing.minPrice === null || row.price < existing.minPrice) existing.minPrice = row.price;
      if (existing.maxPrice === null || row.price > existing.maxPrice) existing.maxPrice = row.price;
      if (parsedUpdatedAtMs > existing.latestUpdatedAtMs) {
        existing.latestUpdatedAtMs = parsedUpdatedAtMs;
      }
      if (parsedObservedAtMs >= existing.latestObservedAtMs) {
        existing.latestObservedAtMs = parsedObservedAtMs;
        existing.latestPrice = row.price;
        existing.latestValidFrom = row.valid_from || row.observed_at;
        existing.latestValidTo = row.valid_to;
      }
    });
    return stats;
  }, [prices, storeBrandById, storeNameById]);

  const productStoreFilterOptions = React.useMemo(() => {
    const assignedStoreOptions = Array.from(storeNameById.entries())
      .map(([id, name]) => ({ id, name: name.trim() || id }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return [
      { id: PRODUCT_STORE_UNASSIGNED_FILTER, name: "Store: Not assigned" },
      ...assignedStoreOptions,
    ];
  }, [storeNameById]);

  const productBrandFilterOptions = React.useMemo(() => {
    const brands: string[] = [];
    productPriceStats.forEach((stats) => {
      brands.push(...stats.storeBrands);
    });
    return uniqueValues(brands).sort((a, b) => a.localeCompare(b));
  }, [productPriceStats]);

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

  const storeBrandOptions = React.useMemo(
    () => uniqueValues(displayStores.map((store) => store.brand ?? "")).sort((a, b) => a.localeCompare(b)),
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
    const brandFilter = storeBrandFilter.trim().toLowerCase();
    const statusFilter = storeStatusFilter.trim().toLowerCase();
    const typeFilter = storeTypeFilter.trim().toLowerCase();
    return displayStores.filter((store) => {
      if (brandFilter !== "all" && (store.brand ?? "").trim().toLowerCase() !== brandFilter) return false;
      if (statusFilter === "active" && !store.is_active) return false;
      if (statusFilter === "inactive" && store.is_active) return false;
      if (typeFilter !== "all" && store.store_type.trim().toLowerCase() !== typeFilter) return false;
      if (!query) return true;
      const stats = storePriceStats.get(store.id);
      const haystack = [
        store.name,
        store.brand ?? "",
        store.address ?? "",
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
  }, [displayStores, storeBrandFilter, storePriceStats, storeSearchQuery, storeStatusFilter, storeTypeFilter]);

  const storeActiveFilterCount = React.useMemo(() => {
    let count = 0;
    if (storeSearchQuery.trim()) count += 1;
    if (storeBrandFilter !== "all") count += 1;
    if (storeStatusFilter !== "all") count += 1;
    if (storeTypeFilter !== "all") count += 1;
    return count;
  }, [storeBrandFilter, storeSearchQuery, storeStatusFilter, storeTypeFilter]);

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
      { key: "latest", label: "Latest Updated" },
      { key: "oldest", label: "Oldest Updated" },
      { key: "name", label: "Name" },
      { key: "priceLow", label: "Price Low" },
      { key: "priceHigh", label: "Price High" },
    ],
    [],
  );

  const productSaleDateRangeMs = React.useMemo(() => {
    const { startDate, endDate } = splitSaleDateFilter(productSaleDateFilter);
    const startIso = dateOnlyToIso(startDate, false);
    const endIso = dateOnlyToIso(endDate || startDate, true);
    if (!startIso || !endIso) return null;
    const start = new Date(startIso).getTime();
    const end = new Date(endIso).getTime();
    return Number.isFinite(start) && Number.isFinite(end) ? { start, end } : null;
  }, [productSaleDateFilter]);

  const filteredProducts = React.useMemo(() => {
    const query = productSearchQuery.trim().toLowerCase();
    const categoryFilter = productCategoryFilter.trim().toLowerCase();
    const brandFilter = productBrandFilter.trim().toLowerCase();
    const storeFilter = productStoreFilter.trim();

    const filtered = products.filter((item) => {
      const stats = productPriceStats.get(item.id);
      const category = item.category.trim().toLowerCase();

      if (query) {
        const storeNames = stats?.storeNames.join(" ").toLowerCase() ?? "";
        const storeBrands = stats?.storeBrands.join(" ").toLowerCase() ?? "";
        const englishName = item.english_name?.trim() || "";
        const haystack = `${item.name} ${englishName} ${item.brand ?? ""} ${item.gtin ?? ""} ${item.category} ${item.id} ${storeNames} ${storeBrands}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      if (categoryFilter !== "all" && category !== categoryFilter) return false;
      if (
        brandFilter !== "all" &&
        !stats?.storeBrands.some((brand) => brand.trim().toLowerCase() === brandFilter)
      ) {
        return false;
      }
      if (storeFilter === PRODUCT_STORE_UNASSIGNED_FILTER) {
        if ((stats?.storeIds.size ?? 0) > 0) return false;
      } else if (storeFilter.toLowerCase() !== "all" && !stats?.storeIds.has(storeFilter)) {
        return false;
      }
      if (productSaleDateRangeMs !== null) {
        const hasSaleOnDate = prices.some((row) => {
          if (row.product_id !== item.id) return false;
          const start = new Date(row.valid_from || row.observed_at).getTime();
          if (!Number.isFinite(start) || start > productSaleDateRangeMs.end) return false;
          const end = row.valid_to ? new Date(row.valid_to).getTime() : Number.POSITIVE_INFINITY;
          return !Number.isNaN(end) && end >= productSaleDateRangeMs.start;
        });
        if (!hasSaleOnDate) return false;
      }

      return true;
    });

    filtered.sort((a, b) => {
      if (productSort === "name") return a.name.localeCompare(b.name);
      if (productSort === "priceLow" || productSort === "priceHigh") {
        const aPrice = productPriceStats.get(a.id)?.latestPrice ?? Number.POSITIVE_INFINITY;
        const bPrice = productPriceStats.get(b.id)?.latestPrice ?? Number.POSITIVE_INFINITY;
        if (aPrice !== bPrice) return productSort === "priceLow" ? aPrice - bPrice : bPrice - aPrice;
      }
      const aCreatedAtMs = new Date(a.created_at).getTime();
      const bCreatedAtMs = new Date(b.created_at).getTime();
      const aTime = Math.max(
        Number.isFinite(aCreatedAtMs) ? aCreatedAtMs : -1,
        productPriceStats.get(a.id)?.latestUpdatedAtMs ?? -1,
      );
      const bTime = Math.max(
        Number.isFinite(bCreatedAtMs) ? bCreatedAtMs : -1,
        productPriceStats.get(b.id)?.latestUpdatedAtMs ?? -1,
      );
      if (productSort === "oldest") return aTime - bTime;
      return bTime - aTime;
    });

    return filtered;
  }, [
    productCategoryFilter,
    productBrandFilter,
    productPriceStats,
    productSaleDateRangeMs,
    productSearchQuery,
    productSort,
    productStoreFilter,
    prices,
    products,
  ]);

  const productActiveFilterCount = React.useMemo(() => {
    let count = 0;
    if (productSearchQuery.trim()) count += 1;
    if (productCategoryFilter !== "all") count += 1;
    if (productBrandFilter !== "all") count += 1;
    if (productStoreFilter !== "all") count += 1;
    if (productSaleDateFilter.trim()) count += 1;
    return count;
  }, [productBrandFilter, productCategoryFilter, productSaleDateFilter, productSearchQuery, productStoreFilter]);

  return {
    categoryOptions,
    displayStores,
    filteredProducts,
    filteredStores,
    flyerSelectedCount: flyerSelectedRows,
    overviewCards,
    productActiveFilterCount,
    productFilterCategoryOptions,
    productBrandFilterOptions,
    productDataHealth,
    productPriceStats,
    productSortOptions,
    productStoreFilterOptions,
    productFormStoreOptions,
    selectedStoreForMap,
    storeActiveFilterCount,
    storeAuditLogs,
    storeBrandOptions,
    storeNameById,
    storePriceStats,
    storeTypeOptions,
  };
}
