import React from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import WebLink from "../components/WebLink";
import useLayout from "../hooks/useLayout";
import { marketingPalette as C } from "../shared/design/palette";
import { hasSupabaseEnv } from "../services/supabaseClient";
import {
  extractFlyerRowsWithAi,
  hasFlyerAiEndpoint,
} from "../services/flyerAiImport";
import {
  type AdminPriceEntry,
  type AdminProduct,
  type AdminStore,
} from "../services/adminBackoffice";
import {
  useAdminPricesQuery,
  useAdminProductsQuery,
  useAdminSignInMutation,
  useAdminSignOutMutation,
  useAdminStoresQuery,
  useAdminUserQuery,
  useCreateAdminPriceEntryMutation,
  useCreateAdminProductMutation,
  useDeleteAdminProductMutation,
  useUploadAdminProductImageMutation,
} from "../hooks/useAdminBackofficeQueries";
import {
  createFlyerRow,
  useAdminStore,
  type AdminMenuKey,
  type FlyerRow,
  type ProductSortKey,
} from "../state/adminStore";

type OverviewCard = {
  id: string;
  label: string;
  value: string;
  hint: string;
};

type StorePriceSetInput = {
  id: string;
  storeId: string;
  price: string;
};

type ProductPriceStats = {
  latestPrice: number | null;
  latestObservedAtMs: number;
  minPrice: number | null;
  maxPrice: number | null;
  storeIds: Set<string>;
  storeNames: string[];
};

const DEFAULT_PRODUCT_CATEGORIES = [
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

const ADMIN_EMAIL_ALLOWLIST = (process.env.EXPO_PUBLIC_ADMIN_EMAILS ?? "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

const WEB_FILTER_SELECT_STYLE: React.CSSProperties = {
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

const WEB_FLYER_ACTION_BAR_STYLE: React.CSSProperties = {
  minHeight: 38,
  borderBottom: "1px solid #d9dee8",
  backgroundColor: "#f4f6fa",
  display: "flex",
  alignItems: "center",
  gap: 8,
  overflowX: "auto",
  padding: "5px 8px",
};

function toDateOnlyLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function toNonNegativeCount(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

function toOptionalNumber(value: string): number | null {
  const text = value.trim();
  if (!text) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function uniqueValues(values: string[]): string[] {
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

function isDateOnly(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
}

function dateOnlyToIso(value: string, endOfDay: boolean): string | null {
  if (!isDateOnly(value)) return null;
  const clock = endOfDay ? "T23:59:59" : "T00:00:00";
  const date = new Date(`${value}${clock}`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function createStorePriceSet(seed?: Partial<Pick<StorePriceSetInput, "storeId" | "price">>): StorePriceSetInput {
  return {
    id: `sp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    storeId: seed?.storeId ?? "",
    price: seed?.price ?? "",
  };
}

function normalizeOcrText(value: string): string {
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

function parseFlyerTextToRows(text: string): FlyerRow[] {
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

export default function AdminScreen({ onBack }: { onBack: () => void }) {
  const { isLg } = useLayout();
  const allowlistEnabled = ADMIN_EMAIL_ALLOWLIST.length > 0;

  const [authEmail, setAuthEmail] = React.useState("");
  const [authPassword, setAuthPassword] = React.useState("");

  const [notice, setNotice] = React.useState<string | null>(null);

  const [productName, setProductName] = React.useState("");
  const [productCategory, setProductCategory] = React.useState("");
  const [productCategoryCustom, setProductCategoryCustom] = React.useState("");
  const [productThumb, setProductThumb] = React.useState("");
  const [productStorePriceSets, setProductStorePriceSets] = React.useState<StorePriceSetInput[]>([
    createStorePriceSet(),
  ]);
  const [productPeriodStartDate, setProductPeriodStartDate] = React.useState("");
  const [productPeriodEndDate, setProductPeriodEndDate] = React.useState("");
  const [productModalOpen, setProductModalOpen] = React.useState(false);
  const [productImageUploading, setProductImageUploading] = React.useState(false);

  const [submitting, setSubmitting] = React.useState(false);
  const [deletingKey, setDeletingKey] = React.useState<string | null>(null);

  const activeMenu = useAdminStore((state) => state.activeMenu);
  const setActiveMenu = useAdminStore((state) => state.setActiveMenu);
  const sidebarCollapsed = useAdminStore((state) => state.sidebarCollapsed);
  const setSidebarCollapsed = useAdminStore((state) => state.setSidebarCollapsed);
  const productSearchQuery = useAdminStore((state) => state.productSearchQuery);
  const setProductSearchQuery = useAdminStore((state) => state.setProductSearchQuery);
  const productCategoryFilter = useAdminStore((state) => state.productCategoryFilter);
  const setProductCategoryFilter = useAdminStore((state) => state.setProductCategoryFilter);
  const productStoreFilter = useAdminStore((state) => state.productStoreFilter);
  const setProductStoreFilter = useAdminStore((state) => state.setProductStoreFilter);
  const productPriceMin = useAdminStore((state) => state.productPriceMin);
  const setProductPriceMin = useAdminStore((state) => state.setProductPriceMin);
  const productPriceMax = useAdminStore((state) => state.productPriceMax);
  const setProductPriceMax = useAdminStore((state) => state.setProductPriceMax);
  const productSort = useAdminStore((state) => state.productSort);
  const setProductSort = useAdminStore((state) => state.setProductSort);
  const resetProductFilters = useAdminStore((state) => state.resetProductFilters);
  const flyerRows = useAdminStore((state) => state.flyerRows);
  const setFlyerRows = useAdminStore((state) => state.setFlyerRows);
  const flyerProcessing = useAdminStore((state) => state.flyerProcessing);
  const setFlyerProcessing = useAdminStore((state) => state.setFlyerProcessing);
  const flyerProgress = useAdminStore((state) => state.flyerProgress);
  const setFlyerProgress = useAdminStore((state) => state.setFlyerProgress);
  const updateFlyerRow = useAdminStore((state) => state.updateFlyerRow);
  const addFlyerRow = useAdminStore((state) => state.addFlyerRow);
  const removeSelectedFlyerRows = useAdminStore((state) => state.removeSelectedFlyerRows);
  const clearFlyerImport = useAdminStore((state) => state.clearFlyerImport);
  const resetAdminUi = useAdminStore((state) => state.resetAdminUi);

  const adminUserQuery = useAdminUserQuery();
  const authUser = adminUserQuery.data ?? null;

  const hasAdminAccess = authUser
    ? !allowlistEnabled ||
      ADMIN_EMAIL_ALLOWLIST.includes(authUser.email.trim().toLowerCase())
    : false;
  const dataQueriesEnabled = Boolean(authUser && hasAdminAccess);
  const productsQuery = useAdminProductsQuery(dataQueriesEnabled);
  const storesQuery = useAdminStoresQuery(dataQueriesEnabled);
  const pricesQuery = useAdminPricesQuery(dataQueriesEnabled);
  const signInMutation = useAdminSignInMutation();
  const signOutMutation = useAdminSignOutMutation();
  const createProductMutation = useCreateAdminProductMutation();
  const createPriceEntryMutation = useCreateAdminPriceEntryMutation();
  const deleteProductMutation = useDeleteAdminProductMutation();
  const uploadProductImageMutation = useUploadAdminProductImageMutation();

  const products = React.useMemo<AdminProduct[]>(() => productsQuery.data ?? [], [productsQuery.data]);
  const stores = React.useMemo<AdminStore[]>(() => storesQuery.data ?? [], [storesQuery.data]);
  const prices = React.useMemo<AdminPriceEntry[]>(() => pricesQuery.data ?? [], [pricesQuery.data]);
  const productsLoading = productsQuery.isLoading || productsQuery.isFetching;
  const authLoading =
    adminUserQuery.isLoading || signInMutation.isPending || signOutMutation.isPending;

  const priceRowsMissingLink = React.useMemo(
    () => prices.filter((row) => !row.product_name || !row.store_name).length,
    [prices],
  );

  const stalePriceRows = React.useMemo(() => {
    const now = Date.now();
    const THIRTY_DAYS = 1000 * 60 * 60 * 24 * 30;
    return prices.filter((row) => {
      const time = new Date(row.observed_at).getTime();
      if (Number.isNaN(time)) return false;
      return now - time > THIRTY_DAYS;
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
        id: "issues",
        label: "Data Health",
        value: String(toNonNegativeCount(priceRowsMissingLink + stalePriceRows)),
        hint: "Link freshness",
      },
    ],
    [priceRowsMissingLink, stalePriceRows, products.length],
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

  const productPriceStats = React.useMemo(() => {
    const stats = new Map<string, ProductPriceStats>();
    prices.forEach((row) => {
      const productId = row.product_id.trim();
      if (!productId) return;
      const storeId = row.store_id.trim();

      const observedAtMs = new Date(row.observed_at).getTime();
      const parsedObservedAtMs = Number.isFinite(observedAtMs) ? observedAtMs : -1;

      const existing = stats.get(productId);
      if (!existing) {
        const storeName = row.store_name?.trim() || storeNameById.get(storeId) || storeId;
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

      if (storeId) {
        existing.storeIds.add(storeId);
      }
      const storeName = row.store_name?.trim() || storeNameById.get(storeId) || storeId;
      if (storeName && !existing.storeNames.some((item) => item.toLowerCase() === storeName.toLowerCase())) {
        existing.storeNames.push(storeName);
      }

      if (existing.minPrice === null || row.price < existing.minPrice) {
        existing.minPrice = row.price;
      }
      if (existing.maxPrice === null || row.price > existing.maxPrice) {
        existing.maxPrice = row.price;
      }

      if (parsedObservedAtMs >= existing.latestObservedAtMs) {
        existing.latestObservedAtMs = parsedObservedAtMs;
        existing.latestPrice = row.price;
      }
    });
    return stats;
  }, [prices, storeNameById]);

  const productStoreFilterOptions = React.useMemo(() => {
    return Array.from(storeNameById.entries())
      .map(([id, name]) => ({
        id,
        name: name.trim() || id,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [storeNameById]);
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
      if (productMinPriceFilter !== null && (latestPrice === null || latestPrice < productMinPriceFilter)) {
        return false;
      }
      if (productMaxPriceFilter !== null && (latestPrice === null || latestPrice > productMaxPriceFilter)) {
        return false;
      }

      return true;
    });

    filtered.sort((a, b) => {
      if (productSort === "name") {
        return a.name.localeCompare(b.name);
      }

      if (productSort === "priceLow" || productSort === "priceHigh") {
        const aPrice = productPriceStats.get(a.id)?.latestPrice ?? Number.POSITIVE_INFINITY;
        const bPrice = productPriceStats.get(b.id)?.latestPrice ?? Number.POSITIVE_INFINITY;
        if (aPrice !== bPrice) {
          return productSort === "priceLow" ? aPrice - bPrice : bPrice - aPrice;
        }
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
  }, [
    productCategoryFilter,
    productPriceMax,
    productPriceMin,
    productSearchQuery,
    productStoreFilter,
  ]);

  const flyerSelectedCount = React.useMemo(
    () => flyerRows.filter((row) => row.selected).length,
    [flyerRows],
  );

  const loadAll = React.useCallback(
    async (keepNotice = false) => {
      const results = await Promise.all([
        productsQuery.refetch(),
        storesQuery.refetch(),
        pricesQuery.refetch(),
      ]);
      const errors = results
        .map((item) => (item.error instanceof Error ? item.error.message : null))
        .filter((item): item is string => Boolean(item));
      if (errors.length > 0) {
        setNotice(errors.join(" | "));
        return;
      }
      if (!keepNotice) {
        setNotice(null);
      }
    },
    [pricesQuery, productsQuery, storesQuery],
  );

  React.useEffect(() => {
    const errors = [
      adminUserQuery.error,
      productsQuery.error,
      storesQuery.error,
      pricesQuery.error,
    ]
      .map((error) => (error instanceof Error ? error.message : null))
      .filter((item): item is string => Boolean(item));
    if (errors.length > 0) {
      setNotice(errors.join(" | "));
    }
  }, [adminUserQuery.error, pricesQuery.error, productsQuery.error, storesQuery.error]);

  const updateStorePriceSet = React.useCallback(
    (id: string, field: "storeId" | "price", value: string) => {
      setProductStorePriceSets((prev) =>
        prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
      );
    },
    [],
  );

  const addStorePriceSet = React.useCallback(() => {
    setProductStorePriceSets((prev) => [...prev, createStorePriceSet()]);
  }, []);

  const removeStorePriceSet = React.useCallback((id: string) => {
    setProductStorePriceSets((prev) => {
      if (prev.length <= 1) {
        return prev.map((item) => (item.id === id ? { ...item, storeId: "", price: "" } : item));
      }
      return prev.filter((item) => item.id !== id);
    });
  }, []);

  const handleSignIn = React.useCallback(async () => {
    const email = authEmail.trim();
    const password = authPassword;

    if (!email || !password) {
      setNotice("Email and password are required.");
      return;
    }

    try {
      await signInMutation.mutateAsync({ email, password });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Sign in failed.");
      return;
    }

    setAuthPassword("");
    setActiveMenu("overview");
    setNotice("Signed in to admin.");
  }, [authEmail, authPassword, setActiveMenu, signInMutation]);

  const handleSignOut = React.useCallback(async () => {
    try {
      await signOutMutation.mutateAsync();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Sign out failed.");
      return;
    }

    resetAdminUi();
    setNotice("Signed out.");
  }, [resetAdminUi, signOutMutation]);

  const handleCreateProduct = React.useCallback(async () => {
    const name = productName.trim();
    const category = productCategory.trim();
    const periodStart = productPeriodStartDate.trim();
    const periodEnd = productPeriodEndDate.trim();
    const periodStartIso = dateOnlyToIso(periodStart, false);
    const periodEndIso = dateOnlyToIso(periodEnd, true);
    const activeSets = productStorePriceSets
      .map((item, index) => ({
        id: item.id,
        row: index + 1,
        storeId: item.storeId.trim(),
        price: item.price.trim(),
      }))
      .filter((item) => item.storeId.length > 0 || item.price.length > 0);

    if (!name || !category) {
      setNotice("Product name and category are required.");
      return;
    }
    if (!activeSets.length) {
      setNotice("Add at least one Store | Price set.");
      return;
    }
    const partialSet = activeSets.find((item) => !item.storeId || !item.price);
    if (partialSet) {
      setNotice(`Set ${partialSet.row}: store and price are required together.`);
      return;
    }
    const seenStoreIds = new Set<string>();
    for (const item of activeSets) {
      const key = item.storeId.toLowerCase();
      if (seenStoreIds.has(key)) {
        setNotice(`Set ${item.row}: duplicate store is not allowed.`);
        return;
      }
      seenStoreIds.add(key);
    }
    if (activeSets.some((item) => Number.isNaN(Number(item.price)))) {
      setNotice("Each set price must be a valid number.");
      return;
    }
    if (!periodStart || !periodEnd) {
      setNotice("Price period start/end are required. Select dates.");
      return;
    }
    if (!periodStartIso || !periodEndIso) {
      setNotice("Invalid date format. Use valid date picker values.");
      return;
    }

    try {
      setSubmitting(true);
      const createdProduct = await createProductMutation.mutateAsync({
        name,
        category,
        thumbnailUrl: productThumb,
      });

      if (!createdProduct) {
        setNotice("Product was not created.");
        return;
      }

      const creationErrors: string[] = [];
      for (const item of activeSets) {
        try {
          await createPriceEntryMutation.mutateAsync({
            productId: createdProduct.id,
            storeId: item.storeId,
            price: item.price,
            observedAt: periodStartIso,
            periodEnd: periodEndIso,
          });
        } catch (error) {
          creationErrors.push(
            `Set ${item.row}: ${error instanceof Error ? error.message : "Price entry failed."}`,
          );
        }
      }

      if (creationErrors.length > 0) {
        setNotice(
          `Product created, but ${creationErrors.length} Store | Price set failed. ${creationErrors[0]}`,
        );
        await loadAll(true);
        return;
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Product was not created.");
      return;
    } finally {
      setSubmitting(false);
    }

    setProductName("");
    setProductCategory("");
    setProductCategoryCustom("");
    setProductThumb("");
    setProductStorePriceSets([createStorePriceSet()]);
    setProductPeriodStartDate("");
    setProductPeriodEndDate("");
    setProductModalOpen(false);
    setNotice(`Product and ${activeSets.length} Store | Price set created.`);
    await loadAll(true);
  }, [
    createPriceEntryMutation,
    createProductMutation,
    loadAll,
    productCategory,
    productName,
    productPeriodEndDate,
    productPeriodStartDate,
    productStorePriceSets,
    productThumb,
  ]);

  const handlePickPeriodDate = React.useCallback(
    (type: "start" | "end") => {
      if (Platform.OS !== "web") {
        setNotice("Date picker is currently available on web admin. On native app, use YYYY-MM-DD.");
        return;
      }
      const doc = (globalThis as { document?: any }).document;
      if (!doc || typeof doc.createElement !== "function") {
        setNotice("Date picker is not available in this environment.");
        return;
      }

      const input = doc.createElement("input");
      input.type = "date";
      input.value = type === "start" ? productPeriodStartDate : productPeriodEndDate;
      input.onchange = () => {
        const value = String(input.value ?? "").trim();
        if (!value) return;
        if (type === "start") {
          setProductPeriodStartDate(value);
          return;
        }
        setProductPeriodEndDate(value);
      };

      if (typeof input.showPicker === "function") {
        input.showPicker();
      } else {
        input.click();
      }
    },
    [productPeriodEndDate, productPeriodStartDate],
  );

  const handleUploadProductImage = React.useCallback(async () => {
    if (Platform.OS !== "web") {
      setNotice("Image file picker is currently available on web admin. On native app, paste image URL.");
      return;
    }
    const doc = (globalThis as { document?: any }).document;
    if (!doc || typeof doc.createElement !== "function") {
      setNotice("Image picker is not available in this environment.");
      return;
    }

    const input = doc.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp,image/gif";
    input.multiple = false;
    input.onchange = () => {
      const selected = input.files?.[0];
      if (!selected) return;
      void (async () => {
        setProductImageUploading(true);
        try {
          const data = await uploadProductImageMutation.mutateAsync({
            file: selected,
            fileName: selected.name,
            contentType: selected.type,
          });
          if (!data) {
            setNotice("Image upload failed.");
            return;
          }
          setProductThumb(data.publicUrl);
          setNotice("Image uploaded to Supabase Storage.");
        } catch (error) {
          setNotice(error instanceof Error ? error.message : "Image upload failed.");
        } finally {
          setProductImageUploading(false);
        }
      })();
    };
    input.click();
  }, [uploadProductImageMutation]);

  const recognizeFlyerSources = React.useCallback(async (sources: Array<Blob | string>) => {
    const tesseract = await import("tesseract.js");
    const worker = await tesseract.createWorker("eng", 1, {
      logger: (message: any) => {
        if (!message?.status) return;
        const progress =
          typeof message.progress === "number" ? ` ${Math.round(message.progress * 100)}%` : "";
        setFlyerProgress(`${message.status}${progress}`);
      },
    });

    try {
      const chunks: string[] = [];
      for (let index = 0; index < sources.length; index += 1) {
        setFlyerProgress(`OCR page ${index + 1} of ${sources.length}`);
        const result = await worker.recognize(sources[index]);
        chunks.push(result.data.text ?? "");
      }
      return normalizeOcrText(chunks.join("\n"));
    } finally {
      await worker.terminate();
    }
  }, []);

  const extractPdfText = React.useCallback(async (file: File) => {
    const pdfjs = await import("pdfjs-dist");
    const workerOptions = pdfjs.GlobalWorkerOptions as { workerSrc?: string };
    if (!workerOptions.workerSrc) {
      workerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const loadingTask = pdfjs.getDocument({
      data: bytes,
      isEvalSupported: false,
      useWorkerFetch: false,
    } as any);
    const pdf = await loadingTask.promise;

    try {
      const pageCount = Math.min(pdf.numPages, 5);
      const pages: string[] = [];
      for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
        setFlyerProgress(`Reading PDF text ${pageNumber} of ${pageCount}`);
        const page = await pdf.getPage(pageNumber);
        const textContent = await page.getTextContent();
        const grouped = new Map<number, string[]>();
        (textContent.items as any[]).forEach((item) => {
          const value = String(item?.str ?? "").trim();
          if (!value) return;
          const y = Math.round(Number(item?.transform?.[5] ?? 0));
          const existing = grouped.get(y) ?? [];
          existing.push(value);
          grouped.set(y, existing);
        });
        const pageText = Array.from(grouped.entries())
          .sort((a, b) => b[0] - a[0])
          .map(([, values]) => values.join(" "))
          .join("\n");
        pages.push(pageText);
        page.cleanup();
      }
      return normalizeOcrText(pages.join("\n"));
    } finally {
      await pdf.cleanup();
      await loadingTask.destroy();
    }
  }, []);

  const renderPdfPagesForOcr = React.useCallback(async (file: File) => {
    const pdfjs = await import("pdfjs-dist");
    const workerOptions = pdfjs.GlobalWorkerOptions as { workerSrc?: string };
    if (!workerOptions.workerSrc) {
      workerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    }

    const doc = (globalThis as { document?: Document }).document;
    if (!doc) {
      throw new Error("PDF rendering requires a browser document.");
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const loadingTask = pdfjs.getDocument({
      data: bytes,
      isEvalSupported: false,
      useWorkerFetch: false,
    } as any);
    const pdf = await loadingTask.promise;

    try {
      const pageCount = Math.min(pdf.numPages, 3);
      const images: string[] = [];
      for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
        setFlyerProgress(`Rendering PDF page ${pageNumber} of ${pageCount}`);
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = doc.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) {
          throw new Error("Could not create a canvas for PDF rendering.");
        }
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        await page.render({ canvasContext: context, viewport } as any).promise;
        images.push(canvas.toDataURL("image/png"));
        page.cleanup();
      }
      return images;
    } finally {
      await pdf.cleanup();
      await loadingTask.destroy();
    }
  }, []);

  const processFlyerFile = React.useCallback(
    async (file: File) => {
      setFlyerProcessing(true);
      setFlyerProgress("Preparing file");
      setNotice(null);

      try {
        if (hasFlyerAiEndpoint) {
          setFlyerProgress("AI extracting table");
          const aiResult = await extractFlyerRowsWithAi(file);
          if (aiResult.rows.length > 0) {
            setFlyerRows(aiResult.rows);
            setFlyerProgress("");
            setNotice(`AI extracted ${aiResult.rows.length} table rows. Review before saving.`);
            return;
          }
          setFlyerProgress("AI found no rows. Running OCR fallback");
        }

        const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
        let text = "";
        if (isPdf) {
          text = await extractPdfText(file);
          if (parseFlyerTextToRows(text).length === 0) {
            const images = await renderPdfPagesForOcr(file);
            text = await recognizeFlyerSources(images);
          }
        } else {
          text = await recognizeFlyerSources([file]);
        }

        const parsedRows = parseFlyerTextToRows(text);
        setFlyerRows(parsedRows);
        setFlyerProgress("");
        setNotice(
          parsedRows.length > 0
            ? `Flyer parsed into ${parsedRows.length} table rows. Review before saving.`
            : "No price rows were found. You can paste OCR text manually or add rows.",
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "Flyer processing failed.";
        setNotice(message);
        setFlyerProgress("");
      } finally {
        setFlyerProcessing(false);
      }
    },
    [
      extractPdfText,
      recognizeFlyerSources,
      renderPdfPagesForOcr,
    ],
  );

  const handlePickFlyerFile = React.useCallback(() => {
    if (Platform.OS !== "web") {
      setNotice("Flyer import is currently available on web admin.");
      return;
    }
    const doc = (globalThis as { document?: any }).document;
    if (!doc || typeof doc.createElement !== "function") {
      setNotice("File picker is not available in this environment.");
      return;
    }

    const input = doc.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp,image/gif,application/pdf,.pdf";
    input.multiple = false;
    input.onchange = () => {
      const selected = input.files?.[0];
      if (!selected) return;
      void processFlyerFile(selected);
    };
    input.click();
  }, [processFlyerFile]);

  const handleAddFlyerRow = React.useCallback(() => {
    addFlyerRow();
  }, [addFlyerRow]);

  const handleRemoveSelectedFlyerRows = React.useCallback(() => {
    removeSelectedFlyerRows();
  }, [removeSelectedFlyerRows]);

  const handleClearFlyerImport = React.useCallback(() => {
    clearFlyerImport();
    setNotice("Flyer import cleared.");
  }, [clearFlyerImport]);

  const handleDeleteProduct = React.useCallback(
    async (id: string) => {
      setDeletingKey(`product:${id}`);
      try {
        await deleteProductMutation.mutateAsync(id);
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Product delete failed.");
        return;
      } finally {
        setDeletingKey(null);
      }
      setNotice("Product deleted.");
      await loadAll(true);
    },
    [deleteProductMutation, loadAll],
  );

  const handleResetProductFilters = React.useCallback(() => {
    resetProductFilters();
  }, [resetProductFilters]);

  const sectionMenu = [
    {
      key: "overview" as const,
      label: "Dashboard",
      badge: toNonNegativeCount(priceRowsMissingLink + stalePriceRows),
    },
    {
      key: "products" as const,
      label: "Products",
      badge: products.length,
    },
    {
      key: "flyer" as const,
      label: "Flyer",
      badge: 0,
    },
  ];

  const panelTitle =
    activeMenu === "overview" ? "Dashboard" : activeMenu === "products" ? "Products" : "Flyer";

  return (
    <View style={st.root}>
      <View
        style={[
          st.workspace,
          !isLg && st.workspaceStack,
          { paddingHorizontal: isLg ? 0 : 10, paddingVertical: isLg ? 0 : 12 },
        ]}
      >
        {authUser && hasAdminAccess ? (
          <>
            {(!isLg || !sidebarCollapsed) ? (
              <View style={[st.sidebar, !isLg && st.sidebarMobile]}>
                <View style={st.sidebarHeader}>
                  <Text style={st.sidebarBrand}>PocketCart</Text>
                  <Text style={st.sidebarSub}>Admin Workspace</Text>
                </View>

                <View style={st.menuGroup}>
                  {sectionMenu.map((item) => {
                    const active = activeMenu === item.key;
                    return (
                      <Pressable
                        key={item.key}
                        accessibilityRole="button"
                        onPress={() => setActiveMenu(item.key)}
                        style={[st.menuBtn, active && st.menuBtnActive]}
                      >
                        <Text style={[st.menuText, active && st.menuTextActive]}>{item.label}</Text>
                        <View style={[st.menuBadge, active && st.menuBadgeActive]}>
                          <Text style={[st.menuBadgeText, active && st.menuBadgeTextActive]}>
                            {item.badge}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={st.sidebarFooter}>
                  <Text style={st.sidebarUser}>{authUser.email || authUser.id}</Text>
                  <Text style={st.sidebarRole}>Administrator</Text>

                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      void handleSignOut();
                    }}
                    style={[st.btn, st.btnSidebar]}
                    disabled={authLoading}
                  >
                    <Text style={st.btnSidebarText}>{authLoading ? "..." : "Sign Out"}</Text>
                  </Pressable>

                  {isLg ? (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setSidebarCollapsed(true)}
                      style={[st.btn, st.btnSidebar]}
                    >
                      <Text style={st.btnSidebarText}>Collapse Sidebar</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            ) : null}

            {isLg && sidebarCollapsed ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setSidebarCollapsed(false)}
                style={st.sidebarCollapsedToggle}
              >
                <Text style={st.sidebarCollapsedToggleIcon}>›</Text>
              </Pressable>
            ) : null}
          </>
        ) : null}

        <View style={st.mainPanel}>
          <ScrollView
            role="main"
            style={st.scroll}
            contentContainerStyle={st.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={st.headerRow}>
              <View>
                <Text style={st.pageTitle}>Admin Dashboard</Text>
                <Text style={st.pageSub}>Manage product catalog and active price sets.</Text>
              </View>

              {authUser && hasAdminAccess ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    void loadAll(true);
                  }}
                  style={[st.btn, st.btnGhost]}
                >
                  <Text style={st.btnGhostText}>Refresh Data</Text>
                </Pressable>
              ) : (
                <WebLink href="/" onPress={onBack}>
                  <View style={[st.btn, st.btnGhost]}>
                    <Text style={st.btnGhostText}>Back Home</Text>
                  </View>
                </WebLink>
              )}
            </View>

            {!hasSupabaseEnv ? (
              <View style={st.infoCard}>
                <Text style={st.infoTitle}>Supabase setup required</Text>
                <Text style={st.infoBody}>
                  Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY first.
                </Text>
              </View>
            ) : null}

            {notice ? (
              <View style={st.noticeCard}>
                <Text style={st.noticeText}>{notice}</Text>
              </View>
            ) : null}

            {!authUser ? (
              <View style={st.authCard}>
                <Text style={st.infoTitle}>Admin Sign In</Text>
                <Text style={st.infoBody}>
                  Sign in with your Supabase email/password account.
                </Text>

                <TextInput
                  value={authEmail}
                  onChangeText={setAuthEmail}
                  placeholder="Email"
                  placeholderTextColor={C.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={st.input}
                />
                <TextInput
                  value={authPassword}
                  onChangeText={setAuthPassword}
                  placeholder="Password"
                  placeholderTextColor={C.textMuted}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={st.input}
                />

                <Pressable
                  accessibilityRole="button"
                  onPress={handleSignIn}
                  style={[st.btn, st.btnPrimary]}
                  disabled={authLoading}
                >
                  <Text style={st.btnPrimaryText}>{authLoading ? "Signing in..." : "Sign In"}</Text>
                </Pressable>
              </View>
            ) : !hasAdminAccess ? (
              <View style={st.infoCard}>
                <Text style={st.infoTitle}>No admin access</Text>
                <Text style={st.infoBody}>
                  This account is signed in but not on admin allowlist.
                </Text>
                <Text style={st.infoBody}>
                  Set EXPO_PUBLIC_ADMIN_EMAILS with comma-separated admin emails.
                </Text>
                <View style={st.inlineRow}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      void handleSignOut();
                    }}
                    style={[st.btn, st.btnGhost]}
                  >
                    <Text style={st.btnGhostText}>Sign Out</Text>
                  </Pressable>
                  <WebLink href="/" onPress={onBack}>
                    <View style={[st.btn, st.btnGhost]}>
                      <Text style={st.btnGhostText}>Back Home</Text>
                    </View>
                  </WebLink>
                </View>
              </View>
            ) : (
              <>
                {!isLg ? (
                  <View style={st.mobileMenuRow}>
                    {sectionMenu.map((item) => {
                      const active = activeMenu === item.key;
                      return (
                        <Pressable
                          key={item.key}
                          accessibilityRole="button"
                          onPress={() => setActiveMenu(item.key)}
                          style={[st.mobileMenuBtn, active && st.mobileMenuBtnActive]}
                        >
                          <Text style={[st.mobileMenuText, active && st.mobileMenuTextActive]}>
                            {item.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}

                {activeMenu === "overview" ? (
                  <View style={st.statGrid}>
                    {overviewCards.map((card) => (
                      <View key={card.id} style={st.statCard}>
                        <Text style={st.statLabel}>{card.label}</Text>
                        <Text style={st.statValue}>{card.value}</Text>
                        <Text style={st.statHint}>{card.hint}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                <Text style={st.panelTitle}>{panelTitle}</Text>

                {activeMenu === "overview" ? (
                  <View style={st.dualColumnGrid}>
                    <View style={st.dataCard}>
                      <View style={st.dataCardHeader}>
                        <Text style={st.dataCardTitle}>Recent Products</Text>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => setActiveMenu("products")}
                          style={[st.btn, st.btnLink]}
                        >
                          <Text style={st.btnLinkText}>Manage</Text>
                        </Pressable>
                      </View>

                      {productsLoading ? (
                        <Text style={st.dataMuted}>Loading products...</Text>
                      ) : products.length === 0 ? (
                        <Text style={st.dataMuted}>No products yet.</Text>
                      ) : (
                        products.slice(0, 6).map((item) => (
                          <View key={item.id} style={st.dataRow}>
                            <View style={st.dataRowMain}>
                              <Text style={st.dataRowTitle}>{item.name}</Text>
                              <Text style={st.dataMuted}>{item.category}</Text>
                            </View>
                            <Text style={st.dataMeta}>{toDateOnlyLabel(item.created_at)}</Text>
                          </View>
                        ))
                      )}
                    </View>

                  </View>
                ) : null}

                {activeMenu === "products" ? (
                  <View style={st.dataCard}>
                    <View style={st.dataCardHeader}>
                      <Text style={st.dataCardTitle}>Product Management</Text>
                      <View style={st.inlineRow}>
                        <Text style={st.dataMuted}>Create and remove catalog products.</Text>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => setProductModalOpen(true)}
                          style={[st.btn, st.btnPrimary]}
                          disabled={submitting}
                        >
                          <Text style={st.btnPrimaryText}>Add Product</Text>
                        </Pressable>
                      </View>
                    </View>

                    <View style={st.productFilterCard}>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={st.productFilterInlineRow}
                      >
                        <TextInput
                          value={productSearchQuery}
                          onChangeText={setProductSearchQuery}
                          placeholder="Search product, category, store, or ID"
                          placeholderTextColor={C.textMuted}
                          autoCapitalize="none"
                          autoCorrect={false}
                          style={[st.input, st.productSearchInputInline]}
                        />
                        <TextInput
                          value={productPriceMin}
                          onChangeText={setProductPriceMin}
                          placeholder="Min"
                          placeholderTextColor={C.textMuted}
                          keyboardType="decimal-pad"
                          style={[st.input, st.filterInputInline]}
                        />
                        <TextInput
                          value={productPriceMax}
                          onChangeText={setProductPriceMax}
                          placeholder="Max"
                          placeholderTextColor={C.textMuted}
                          keyboardType="decimal-pad"
                          style={[st.input, st.filterInputInline]}
                        />
                        {Platform.OS === "web" ? (
                          <>
                            <select
                              value={productCategoryFilter}
                              onChange={(event) =>
                                setProductCategoryFilter((event.target as HTMLSelectElement).value)
                              }
                              style={WEB_FILTER_SELECT_STYLE}
                            >
                              <option value="all">Category: All</option>
                              {productFilterCategoryOptions.map((category) => (
                                <option key={`filter-category-${category}`} value={category}>
                                  {category}
                                </option>
                              ))}
                            </select>

                            <select
                              value={productStoreFilter}
                              onChange={(event) =>
                                setProductStoreFilter((event.target as HTMLSelectElement).value)
                              }
                              style={WEB_FILTER_SELECT_STYLE}
                            >
                              <option value="all">Store: All</option>
                              {productStoreFilterOptions.map((store) => (
                                <option key={`filter-store-${store.id}`} value={store.id}>
                                  {store.name}
                                </option>
                              ))}
                            </select>

                            <select
                              value={productSort}
                              onChange={(event) =>
                                setProductSort((event.target as HTMLSelectElement).value as ProductSortKey)
                              }
                              style={WEB_FILTER_SELECT_STYLE}
                            >
                              {productSortOptions.map((option) => (
                                <option key={`product-sort-${option.key}`} value={option.key}>
                                  Sort: {option.label}
                                </option>
                              ))}
                            </select>
                          </>
                        ) : null}

                        <Pressable
                          accessibilityRole="button"
                          onPress={handleResetProductFilters}
                          style={[st.btn, st.btnGhost, productActiveFilterCount === 0 && st.btnDisabled]}
                          disabled={productActiveFilterCount === 0}
                        >
                          <Text style={st.btnGhostText}>Reset</Text>
                        </Pressable>
                      </ScrollView>

                      <Text style={st.dataMuted}>
                        Showing {filteredProducts.length} / {products.length} products
                        {productActiveFilterCount > 0 ? ` | Filters ${productActiveFilterCount}` : ""}
                      </Text>
                    </View>

                    {productsLoading ? (
                      <Text style={st.dataMuted}>Loading products...</Text>
                    ) : filteredProducts.length === 0 ? (
                      <Text style={st.dataMuted}>
                        {products.length === 0 ? "No products yet." : "No products match current filters."}
                      </Text>
                    ) : (
                      filteredProducts.map((item) => {
                        const deleteKey = `product:${item.id}`;
                        const deleting = deletingKey === deleteKey;
                        const stats = productPriceStats.get(item.id);
                        const latestPrice = stats?.latestPrice ?? null;
                        const storeCount = stats?.storeIds.size ?? 0;
                        const priceRangeLabel =
                          stats && stats.minPrice !== null && stats.maxPrice !== null
                            ? `$${stats.minPrice.toFixed(2)} - $${stats.maxPrice.toFixed(2)}`
                            : "N/A";
                        const latestObservedAt =
                          stats && stats.latestObservedAtMs >= 0
                            ? toDateOnlyLabel(new Date(stats.latestObservedAtMs).toISOString())
                            : toDateOnlyLabel(item.created_at);
                        return (
                          <View key={item.id} style={st.listRow}>
                            <View style={st.listMain}>
                              <Text style={st.listTitle}>{item.name}</Text>
                              <Text style={st.dataMuted}>{item.category}</Text>
                              <View style={st.productChipRow}>
                                {latestPrice !== null ? (
                                  <View style={st.productMetaChip}>
                                    <Text style={st.productMetaChipText}>Latest ${latestPrice.toFixed(2)}</Text>
                                  </View>
                                ) : null}
                                <View style={st.productMetaChip}>
                                  <Text style={st.productMetaChipText}>Stores {storeCount}</Text>
                                </View>
                                <View style={st.productMetaChip}>
                                  <Text style={st.productMetaChipText}>
                                    Range {priceRangeLabel}
                                  </Text>
                                </View>
                              </View>
                              <Text style={st.dataMuted}>{item.id}</Text>
                            </View>
                            <View style={st.listRight}>
                              {item.thumbnail_url ? (
                                <Image source={{ uri: item.thumbnail_url }} style={st.listThumb} resizeMode="cover" />
                              ) : null}
                              <Text style={st.listDate}>{latestObservedAt}</Text>
                              <Pressable
                                accessibilityRole="button"
                                onPress={() => {
                                  void handleDeleteProduct(item.id);
                                }}
                                style={[st.btn, st.btnDanger, deleting && st.btnDisabled]}
                                disabled={deleting}
                              >
                                <Text style={st.btnDangerText}>{deleting ? "..." : "Delete"}</Text>
                              </Pressable>
                            </View>
                          </View>
                        );
                      })
                    )}
                  </View>
                ) : null}

                {activeMenu === "flyer" ? (
                  <View style={st.flyerPanel}>
                    <div style={WEB_FLYER_ACTION_BAR_STYLE}>
                      <Pressable
                        accessibilityRole="button"
                        onPress={handlePickFlyerFile}
                        style={[st.btn, st.flyerToolbarBtn, flyerProcessing && st.btnDisabled]}
                        disabled={flyerProcessing}
                      >
                        <Text style={st.flyerToolbarBtnText}>
                          {flyerProcessing ? "Processing..." : "Upload Image/PDF"}
                        </Text>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        onPress={handleAddFlyerRow}
                        style={[st.btn, st.flyerToolbarBtn]}
                        disabled={flyerProcessing}
                      >
                        <Text style={st.flyerToolbarBtnText}>Add Row</Text>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        onPress={handleRemoveSelectedFlyerRows}
                        style={[st.btn, st.flyerToolbarBtn, flyerSelectedCount === 0 && st.btnDisabled]}
                        disabled={flyerSelectedCount === 0 || flyerProcessing}
                      >
                        <Text style={st.flyerToolbarBtnText}>Remove Selected</Text>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        onPress={handleClearFlyerImport}
                        style={[st.btn, st.flyerToolbarBtn]}
                        disabled={flyerProcessing}
                      >
                        <Text style={st.flyerToolbarBtnText}>Clear</Text>
                      </Pressable>
                    </div>

                    <ScrollView horizontal showsHorizontalScrollIndicator>
                      <View style={st.flyerTable}>
                        <View style={[st.flyerTableRow, st.flyerTableHeader]}>
                          <Text style={[st.flyerHeaderCell, st.flyerCellSelect]}>Use</Text>
                          <Text style={[st.flyerHeaderCell, st.flyerCellMart]}>마트명</Text>
                          <Text style={[st.flyerHeaderCell, st.flyerCellBranch]}>지역/지점</Text>
                          <Text style={[st.flyerHeaderCell, st.flyerCellDate]}>세일 시작일</Text>
                          <Text style={[st.flyerHeaderCell, st.flyerCellDate]}>세일 종료일</Text>
                          <Text style={[st.flyerHeaderCell, st.flyerCellName]}>이름</Text>
                          <Text style={[st.flyerHeaderCell, st.flyerCellCategory]}>대분류</Text>
                          <Text style={[st.flyerHeaderCell, st.flyerCellCategory]}>중분류</Text>
                          <Text style={[st.flyerHeaderCell, st.flyerCellBrand]}>브랜드</Text>
                          <Text style={[st.flyerHeaderCell, st.flyerCellPrice]}>가격</Text>
                          <Text style={[st.flyerHeaderCell, st.flyerCellUnit]}>단위</Text>
                          <Text style={[st.flyerHeaderCell, st.flyerCellMemo]}>메모</Text>
                        </View>
                        {flyerRows.length === 0 ? (
                          <View style={st.flyerTableEmptyRow}>
                            <Text style={st.dataMuted}>
                              {flyerProcessing
                                ? flyerProgress || "Processing file..."
                                : "Upload an image/PDF or add a row."}
                            </Text>
                          </View>
                        ) : (
                          flyerRows.map((row) => (
                            <View
                              key={row.id}
                              style={[st.flyerTableRow, row.selected && st.flyerTableRowSelected]}
                            >
                              <Pressable
                                accessibilityRole="button"
                                onPress={() => updateFlyerRow(row.id, "selected", !row.selected)}
                                style={[st.flyerSelectCell, row.selected && st.flyerSelectCellActive]}
                              >
                                <Text style={[st.flyerSelectText, row.selected && st.flyerSelectTextActive]}>
                                  {row.selected ? "Yes" : "No"}
                                </Text>
                              </Pressable>
                              <TextInput
                                value={row.martName}
                                onChangeText={(value) => updateFlyerRow(row.id, "martName", value)}
                                placeholder="마트명"
                                placeholderTextColor={C.textMuted}
                                style={[
                                  st.flyerInputCell,
                                  st.flyerCellMart,
                                  row.selected && st.flyerInputCellSelected,
                                ]}
                              />
                              <TextInput
                                value={row.regionBranch}
                                onChangeText={(value) => updateFlyerRow(row.id, "regionBranch", value)}
                                placeholder="지역/지점"
                                placeholderTextColor={C.textMuted}
                                style={[
                                  st.flyerInputCell,
                                  st.flyerCellBranch,
                                  row.selected && st.flyerInputCellSelected,
                                ]}
                              />
                              <TextInput
                                value={row.saleStartDate}
                                onChangeText={(value) => updateFlyerRow(row.id, "saleStartDate", value)}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor={C.textMuted}
                                autoCapitalize="none"
                                autoCorrect={false}
                                style={[
                                  st.flyerInputCell,
                                  st.flyerCellDate,
                                  row.selected && st.flyerInputCellSelected,
                                ]}
                              />
                              <TextInput
                                value={row.saleEndDate}
                                onChangeText={(value) => updateFlyerRow(row.id, "saleEndDate", value)}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor={C.textMuted}
                                autoCapitalize="none"
                                autoCorrect={false}
                                style={[
                                  st.flyerInputCell,
                                  st.flyerCellDate,
                                  row.selected && st.flyerInputCellSelected,
                                ]}
                              />
                              <TextInput
                                value={row.name}
                                onChangeText={(value) => updateFlyerRow(row.id, "name", value)}
                                placeholder="이름"
                                placeholderTextColor={C.textMuted}
                                style={[
                                  st.flyerInputCell,
                                  st.flyerCellName,
                                  row.selected && st.flyerInputCellSelected,
                                ]}
                              />
                              <TextInput
                                value={row.mainCategory}
                                onChangeText={(value) => updateFlyerRow(row.id, "mainCategory", value)}
                                placeholder="대분류"
                                placeholderTextColor={C.textMuted}
                                style={[
                                  st.flyerInputCell,
                                  st.flyerCellCategory,
                                  row.selected && st.flyerInputCellSelected,
                                ]}
                              />
                              <TextInput
                                value={row.subCategory}
                                onChangeText={(value) => updateFlyerRow(row.id, "subCategory", value)}
                                placeholder="중분류"
                                placeholderTextColor={C.textMuted}
                                style={[
                                  st.flyerInputCell,
                                  st.flyerCellCategory,
                                  row.selected && st.flyerInputCellSelected,
                                ]}
                              />
                              <TextInput
                                value={row.brand}
                                onChangeText={(value) => updateFlyerRow(row.id, "brand", value)}
                                placeholder="브랜드"
                                placeholderTextColor={C.textMuted}
                                style={[
                                  st.flyerInputCell,
                                  st.flyerCellBrand,
                                  row.selected && st.flyerInputCellSelected,
                                ]}
                              />
                              <TextInput
                                value={row.price}
                                onChangeText={(value) => updateFlyerRow(row.id, "price", value)}
                                placeholder="0.00"
                                placeholderTextColor={C.textMuted}
                                keyboardType="decimal-pad"
                                style={[
                                  st.flyerInputCell,
                                  st.flyerCellPrice,
                                  row.selected && st.flyerInputCellSelected,
                                ]}
                              />
                              <TextInput
                                value={row.unit}
                                onChangeText={(value) => updateFlyerRow(row.id, "unit", value)}
                                placeholder="단위"
                                placeholderTextColor={C.textMuted}
                                style={[
                                  st.flyerInputCell,
                                  st.flyerCellUnit,
                                  row.selected && st.flyerInputCellSelected,
                                ]}
                              />
                              <TextInput
                                value={row.memo}
                                onChangeText={(value) => updateFlyerRow(row.id, "memo", value)}
                                placeholder="메모"
                                placeholderTextColor={C.textMuted}
                                style={[
                                  st.flyerInputCell,
                                  st.flyerCellMemo,
                                  row.selected && st.flyerInputCellSelected,
                                ]}
                              />
                            </View>
                          ))
                        )}
                      </View>
                    </ScrollView>
                  </View>
                ) : null}

              </>
            )}
          </ScrollView>
        </View>
      </View>

      <Modal
        visible={productModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setProductModalOpen(false)}
      >
        <View style={st.modalBackdrop}>
          <View style={st.modalCard}>
            <View style={st.modalHeader}>
              <View>
                <Text style={st.modalTitle}>Add Product</Text>
                <Text style={st.modalSub}>
                  Register product image, initial price, store, and active period.
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => setProductModalOpen(false)}
                style={[st.btn, st.btnGhost]}
              >
                <Text style={st.btnGhostText}>Close</Text>
              </Pressable>
            </View>

            <ScrollView style={st.modalBody} contentContainerStyle={st.modalBodyContent}>
              <View style={st.modalTopGrid}>
                <View style={[st.modalTopCell, isLg && st.modalTopCellHalf]}>
                  <Text style={st.fieldLabel}>Product Name</Text>
                  <TextInput
                    value={productName}
                    onChangeText={setProductName}
                    placeholder="Product name"
                    placeholderTextColor={C.textMuted}
                    style={st.input}
                  />
                </View>
                <View style={[st.modalTopCell, isLg && st.modalTopCellHalf]}>
                  <Text style={st.fieldLabel}>Custom Category</Text>
                  <TextInput
                    value={productCategoryCustom}
                    onChangeText={(value) => {
                      setProductCategoryCustom(value);
                      setProductCategory(value.trim());
                    }}
                    placeholder="Type custom category (optional)"
                    placeholderTextColor={C.textMuted}
                    style={st.input}
                  />
                  <Text style={st.dataMuted}>Selected: {productCategory.trim() || "None"}</Text>
                </View>
              </View>

              <Text style={st.fieldLabel}>Category</Text>
              <View style={st.choiceRow}>
                {categoryOptions.map((category) => {
                  const active = productCategory.trim().toLowerCase() === category.toLowerCase();
                  return (
                    <Pressable
                      key={category}
                      accessibilityRole="button"
                      onPress={() => {
                        setProductCategory(category);
                        setProductCategoryCustom("");
                      }}
                      style={[st.choiceChip, active && st.choiceChipActive]}
                    >
                      <Text style={[st.choiceChipText, active && st.choiceChipTextActive]}>{category}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={st.modalTopGrid}>
                <View style={st.modalTopCell}>
                  <Text style={st.fieldLabel}>Product Image</Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      void handleUploadProductImage();
                    }}
                    style={[st.imageUploadArea, (productImageUploading || submitting) && st.btnDisabled]}
                    disabled={productImageUploading || submitting}
                  >
                    {productThumb ? (
                      <Image source={{ uri: productThumb }} style={st.modalImagePreview} resizeMode="cover" />
                    ) : (
                      <View style={[st.modalImagePreview, st.modalImagePlaceholder]}>
                        <Text style={st.dataMuted}>Tap to upload product image</Text>
                      </View>
                    )}
                    <View style={st.imageUploadOverlay}>
                      {productImageUploading ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                      ) : null}
                      <Text style={st.imageUploadOverlayText}>
                        {productImageUploading
                          ? "Uploading..."
                          : productThumb
                            ? "Tap to replace image"
                            : "Tap to upload image"}
                      </Text>
                    </View>
                  </Pressable>
                  <Text style={st.dataMuted}>Click image area to upload to Supabase Storage.</Text>
                </View>
              </View>
              <View style={st.storePriceHeaderRow}>
                <Text style={st.fieldLabel}>Store | Price Sets</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={addStorePriceSet}
                  style={[st.btn, st.btnGhost]}
                  disabled={submitting}
                >
                  <Text style={st.btnGhostText}>Add Set</Text>
                </Pressable>
              </View>
              <View style={st.storePriceGrid}>
                {productStorePriceSets.map((set, index) => (
                  <View
                    key={set.id}
                    style={[
                      st.storePriceCard,
                      isLg ? st.storePriceCardThreeCol : st.storePriceCardTwoCol,
                    ]}
                  >
                    <View style={st.storePriceCardHeader}>
                      <Text style={st.storePriceCardTitle}>Set {index + 1}</Text>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => removeStorePriceSet(set.id)}
                        style={[st.btn, st.btnDangerSoft]}
                        disabled={submitting}
                      >
                        <Text style={st.btnDangerSoftText}>
                          {productStorePriceSets.length === 1 ? "Clear" : "Remove"}
                        </Text>
                      </Pressable>
                    </View>

                    <Text style={st.dataMuted}>Store</Text>
                    <View style={st.storePillRow}>
                      {recentStoreOptions.length === 0 ? (
                        <Text style={st.dataMuted}>No stores loaded.</Text>
                      ) : (
                        recentStoreOptions.map((store) => {
                          const active = set.storeId === store.id;
                          return (
                            <Pressable
                              key={`${set.id}-${store.id}`}
                              accessibilityRole="button"
                              onPress={() => updateStorePriceSet(set.id, "storeId", store.id)}
                              style={[st.storePill, active && st.storePillActive]}
                            >
                              <Text style={[st.storePillText, active && st.storePillTextActive]}>
                                {store.name}
                              </Text>
                            </Pressable>
                          );
                        })
                      )}
                    </View>

                    <TextInput
                      value={set.storeId}
                      onChangeText={(value) => updateStorePriceSet(set.id, "storeId", value)}
                      placeholder="Store ID"
                      placeholderTextColor={C.textMuted}
                      autoCapitalize="none"
                      autoCorrect={false}
                      style={st.input}
                    />
                    <TextInput
                      value={set.price}
                      onChangeText={(value) => updateStorePriceSet(set.id, "price", value)}
                      placeholder="Price"
                      placeholderTextColor={C.textMuted}
                      keyboardType="decimal-pad"
                      style={st.input}
                    />
                  </View>
                ))}
              </View>
              <Text style={st.dataMuted}>
                Enter store and price as one set. Multiple sets are supported.
              </Text>

              <Text style={st.fieldLabel}>Price Period</Text>
              <View style={st.formRow}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => handlePickPeriodDate("start")}
                  style={[st.btn, st.btnGhost, st.dateBtn]}
                >
                  <Text style={productPeriodStartDate ? st.dateBtnText : st.dateBtnPlaceholder}>
                    {productPeriodStartDate || "Select start date"}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => handlePickPeriodDate("end")}
                  style={[st.btn, st.btnGhost, st.dateBtn]}
                >
                  <Text style={productPeriodEndDate ? st.dateBtnText : st.dateBtnPlaceholder}>
                    {productPeriodEndDate || "Select end date"}
                  </Text>
                </Pressable>
              </View>
              <View style={st.formRow}>
                <TextInput
                  value={productPeriodStartDate}
                  onChangeText={setProductPeriodStartDate}
                  placeholder="Start date (YYYY-MM-DD)"
                  placeholderTextColor={C.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[st.input, st.inputNarrow]}
                />
                <TextInput
                  value={productPeriodEndDate}
                  onChangeText={setProductPeriodEndDate}
                  placeholder="End date (YYYY-MM-DD)"
                  placeholderTextColor={C.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[st.input, st.inputNarrow]}
                />
              </View>
              <Text style={st.dataMuted}>Date format: YYYY-MM-DD</Text>
            </ScrollView>

            <View style={st.modalActionRow}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setProductModalOpen(false)}
                style={[st.btn, st.btnGhost]}
              >
                <Text style={st.btnGhostText}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={handleCreateProduct}
                style={[st.btn, st.btnPrimary]}
                disabled={submitting}
              >
                <Text style={st.btnPrimaryText}>{submitting ? "Saving..." : "Create Product"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f3f4f7",
    ...(Platform.OS === "web" ? ({ minHeight: "100vh", height: "100vh", width: "100%" } as any) : {}),
  },
  workspace: {
    flex: 1,
    flexDirection: "row",
    gap: 0,
  },
  workspaceStack: {
    flexDirection: "column",
    gap: 12,
  },
  sidebar: {
    width: 280,
    minHeight: 0,
    height: "100%",
    borderRadius: 0,
    borderWidth: 1,
    borderColor: "#d8dee8",
    backgroundColor: "#ffffff",
    padding: 14,
    gap: 14,
    ...(Platform.OS === "web" ? ({ height: "100vh", alignSelf: "stretch" } as any) : {}),
  },
  sidebarMobile: {
    width: "100%",
    minHeight: 0,
    height: "auto",
    borderRadius: 14,
    position: "relative",
  },
  sidebarHeader: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dde3ee",
    backgroundColor: "#f5f8ff",
    padding: 12,
    gap: 4,
  },
  sidebarBrand: {
    color: "#2a3f7f",
    fontSize: 18,
    fontWeight: "800",
  },
  sidebarSub: {
    color: "#5d6a82",
    fontSize: 12,
    lineHeight: 17,
  },
  menuGroup: {
    gap: 8,
  },
  menuBtn: {
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#dfe4ec",
    backgroundColor: "#ffffff",
    paddingHorizontal: 11,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  menuBtnActive: {
    borderColor: "#8fa6f8",
    backgroundColor: "#edf2ff",
  },
  menuText: {
    color: "#2e3a4f",
    fontSize: 13,
    fontWeight: "700",
  },
  menuTextActive: {
    color: "#2f55d4",
  },
  menuBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: "#eceff4",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  menuBadgeActive: {
    backgroundColor: "#d6e0ff",
  },
  menuBadgeText: {
    color: "#4e5c74",
    fontSize: 11,
    fontWeight: "800",
  },
  menuBadgeTextActive: {
    color: "#2f55d4",
  },
  sidebarFooter: {
    marginTop: "auto",
    borderTopWidth: 1,
    borderTopColor: "#e5e9f1",
    paddingTop: 12,
    gap: 7,
  },
  sidebarUser: {
    color: "#2e3748",
    fontSize: 13,
    fontWeight: "700",
  },
  sidebarRole: {
    color: "#7a859a",
    fontSize: 12,
  },
  sidebarCollapsedToggle: {
    width: 54,
    height: 54,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#cfd7ea",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    ...(Platform.OS === "web"
      ? ({ position: "fixed", left: 12, bottom: 12, zIndex: 40, boxShadow: "0 8px 20px rgba(24,34,52,0.18)" } as any)
      : ({ position: "absolute", left: 12, bottom: 12 } as any)),
  },
  sidebarCollapsedToggleIcon: {
    color: "#2f55d4",
    fontSize: 28,
    fontWeight: "900",
    marginTop: -2,
  },
  mainPanel: {
    flex: 1,
    minWidth: 0,
    padding: 12,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 56,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    flexWrap: "wrap",
  },
  pageTitle: {
    color: "#2a2f3a",
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  pageSub: {
    color: "#677285",
    fontSize: 13,
    marginTop: 3,
  },
  infoCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d8dee8",
    backgroundColor: "#ffffff",
    padding: 16,
    gap: 6,
  },
  infoTitle: {
    color: "#2f3a52",
    fontSize: 20,
    fontWeight: "800",
  },
  infoBody: {
    color: "#616d83",
    fontSize: 13,
    lineHeight: 19,
  },
  authCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d8dee8",
    backgroundColor: "#ffffff",
    padding: 18,
    gap: 9,
    maxWidth: 520,
  },
  noticeCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d9e1ff",
    backgroundColor: "#eef3ff",
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  noticeText: {
    color: "#415590",
    fontSize: 13,
    lineHeight: 18,
  },
  mobileMenuRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  mobileMenuBtn: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#dde3ee",
    backgroundColor: "#ffffff",
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  mobileMenuBtnActive: {
    borderColor: "#8fa6f8",
    backgroundColor: "#edf2ff",
  },
  mobileMenuText: {
    color: "#3a465d",
    fontSize: 12,
    fontWeight: "700",
  },
  mobileMenuTextActive: {
    color: "#2f55d4",
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  statCard: {
    minWidth: 140,
    flexGrow: 1,
    borderRadius: 12,
    borderWidth: 0,
    backgroundColor: "#f8faff",
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 1,
  },
  statLabel: {
    color: "#748096",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statValue: {
    color: "#2b313d",
    fontSize: 22,
    lineHeight: 24,
    fontWeight: "800",
  },
  statHint: {
    color: "#6f7b8f",
    fontSize: 10,
    lineHeight: 12,
  },
  panelTitle: {
    color: "#2d3444",
    fontSize: 28,
    fontWeight: "800",
    marginTop: 2,
  },
  dualColumnGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  dataCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d8dee8",
    backgroundColor: "#ffffff",
    padding: 14,
    gap: 8,
    minWidth: 280,
    flexGrow: 1,
  },
  flyerPanel: {
    borderWidth: 1,
    borderColor: "#d3d9e4",
    backgroundColor: "#ffffff",
    minWidth: 280,
  },
  flyerToolbarBtn: {
    minHeight: 27,
    borderRadius: 3,
    borderColor: "#cdd4df",
    backgroundColor: "#e9edf3",
    paddingHorizontal: 13,
  },
  flyerToolbarBtnText: {
    color: "#455266",
    fontSize: 11,
    fontWeight: "700",
  },
  emptyStateCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e1e7f0",
    backgroundColor: "#f8fafc",
    padding: 16,
    gap: 6,
  },
  flyerTable: {
    borderWidth: 1,
    borderColor: "#cfd7e3",
    borderRadius: 0,
    overflow: "hidden",
    alignSelf: "flex-start",
    margin: 8,
  },
  flyerTableRow: {
    flexDirection: "row",
    alignItems: "stretch",
    minHeight: 32,
  },
  flyerTableRowSelected: {
    backgroundColor: "#cfe1ff",
  },
  flyerTableHeader: {
    backgroundColor: "#eef1f5",
  },
  flyerTableEmptyRow: {
    width: 1648,
    minHeight: 36,
    borderTopWidth: 1,
    borderTopColor: "#d9dee8",
    backgroundColor: "#ffffff",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  flyerHeaderCell: {
    borderRightWidth: 1,
    borderRightColor: "#d5dce7",
    color: "#4c5869",
    fontSize: 10,
    fontWeight: "800",
    paddingHorizontal: 7,
    paddingVertical: 7,
    textTransform: "uppercase",
  },
  flyerInputCell: {
    minHeight: 32,
    borderRadius: 0,
    borderWidth: 0,
    borderRightWidth: 1,
    borderRightColor: "#dbe1ea",
    borderTopWidth: 1,
    borderTopColor: "#e3e8f0",
    backgroundColor: "#ffffff",
    color: "#293346",
    paddingHorizontal: 7,
    fontSize: 11,
  },
  flyerInputCellSelected: {
    backgroundColor: "#cfe1ff",
  },
  flyerSelectCell: {
    width: 68,
    minHeight: 32,
    borderRightWidth: 1,
    borderRightColor: "#dbe1ea",
    borderTopWidth: 1,
    borderTopColor: "#e3e8f0",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  flyerSelectCellActive: {
    backgroundColor: "#cfe1ff",
  },
  flyerSelectText: {
    color: "#6a768e",
    fontSize: 11,
    fontWeight: "800",
  },
  flyerSelectTextActive: {
    color: "#2f55d4",
  },
  flyerCellSelect: {
    width: 68,
  },
  flyerCellMart: {
    width: 120,
  },
  flyerCellBranch: {
    width: 140,
  },
  flyerCellDate: {
    width: 116,
  },
  flyerCellName: {
    width: 220,
  },
  flyerCellCategory: {
    width: 120,
  },
  flyerCellBrand: {
    width: 130,
  },
  flyerCellPrice: {
    width: 100,
  },
  flyerCellUnit: {
    width: 90,
  },
  flyerCellMemo: {
    width: 320,
  },
  dataCardWide: {
    minWidth: 520,
    flex: 2,
  },
  dataCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  dataCardTitle: {
    color: "#2f3747",
    fontSize: 20,
    fontWeight: "800",
  },
  dataMuted: {
    color: "#6f7b92",
    fontSize: 12,
    lineHeight: 17,
  },
  dataRow: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e7f0",
    backgroundColor: "#fafbfd",
    paddingHorizontal: 11,
    paddingVertical: 9,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  dataRowMain: {
    flex: 1,
    gap: 2,
  },
  dataRowTitle: {
    color: "#323b4d",
    fontSize: 14,
    fontWeight: "700",
  },
  dataMeta: {
    color: "#56617a",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
  },
  formRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  input: {
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d8dee8",
    backgroundColor: "#f7f9fc",
    color: C.text,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  inputGrow: {
    flexGrow: 1,
    minWidth: 220,
  },
  inputNarrow: {
    minWidth: 150,
    flexGrow: 1,
  },
  productFilterCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f2",
    backgroundColor: "#f8faff",
    padding: 10,
    gap: 6,
  },
  productFilterInlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingRight: 8,
  },
  productSearchInputInline: {
    flexGrow: 1,
    minWidth: 280,
  },
  filterInputInline: {
    width: 96,
  },
  productFilterInlineGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  productFilterInlineLabel: {
    color: "#42526f",
    fontSize: 11,
    fontWeight: "700",
  },
  choiceRowNoWrap: {
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "center",
    gap: 6,
  },
  listRow: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e7f0",
    backgroundColor: "#fafbfd",
    paddingHorizontal: 11,
    paddingVertical: 9,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  listMain: {
    flex: 1,
    gap: 2,
  },
  productChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 2,
  },
  productMetaChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#dce4f1",
    backgroundColor: "#f2f6fd",
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  productMetaChipText: {
    color: "#3f4e6d",
    fontSize: 11,
    fontWeight: "700",
  },
  listRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  listThumb: {
    width: 54,
    height: 54,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#dce4ef",
    backgroundColor: "#eef2f8",
  },
  listTitle: {
    color: "#2f3748",
    fontSize: 14,
    fontWeight: "700",
  },
  listDate: {
    color: "#5b677f",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
  },
  listPrice: {
    color: "#2f55d4",
    fontSize: 13,
    fontWeight: "800",
  },
  inlineRow: {
    marginTop: 6,
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(17, 24, 39, 0.42)",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  modalCard: {
    width: "100%",
    maxWidth: 760,
    maxHeight: "90%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d8dee8",
    backgroundColor: "#ffffff",
    overflow: "hidden",
  },
  modalHeader: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e4e8f1",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  modalTitle: {
    color: "#2f3748",
    fontSize: 20,
    fontWeight: "800",
  },
  modalSub: {
    color: "#6c7890",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  modalBody: {
    maxHeight: 480,
  },
  modalBodyContent: {
    padding: 14,
    gap: 8,
  },
  modalTopGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  modalTopCell: {
    flexGrow: 1,
    minWidth: 260,
    gap: 7,
  },
  modalTopCellHalf: {
    flexBasis: "48%",
  },
  fieldLabel: {
    color: "#41506e",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  choiceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  choiceChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#d6deeb",
    backgroundColor: "#f7f9fc",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  choiceChipActive: {
    borderColor: "#8fa6f8",
    backgroundColor: "#edf2ff",
  },
  choiceChipText: {
    color: "#40506c",
    fontSize: 12,
    fontWeight: "700",
  },
  choiceChipTextActive: {
    color: "#2f55d4",
  },
  storePriceHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  storePriceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  storePriceCard: {
    flexGrow: 1,
  },
  storePriceCardTwoCol: {
    minWidth: 260,
    flexBasis: "48%",
  },
  storePriceCardThreeCol: {
    minWidth: 220,
    flexBasis: "31.5%",
  },
  storePriceCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  storePriceCardTitle: {
    color: "#2f3748",
    fontSize: 13,
    fontWeight: "800",
  },
  modalActionRow: {
    borderTopWidth: 1,
    borderTopColor: "#e4e8f1",
    padding: 12,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  modalImagePreview: {
    width: "100%",
    minHeight: 160,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dbe1ec",
    backgroundColor: "#eef1f7",
  },
  imageUploadArea: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  imageUploadOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 34,
    backgroundColor: "rgba(24, 34, 52, 0.62)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  imageUploadOverlayText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  modalImagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  storePillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  storePill: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#dbe2ef",
    backgroundColor: "#f7f9fc",
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 170,
    gap: 2,
  },
  storePillActive: {
    borderColor: "#8fa6f8",
    backgroundColor: "#edf2ff",
  },
  storePillText: {
    color: "#2f3748",
    fontSize: 12,
    fontWeight: "700",
  },
  storePillSubText: {
    color: "#66748f",
    fontSize: 11,
  },
  storePillTextActive: {
    color: "#2f55d4",
  },
  dateBtn: {
    minWidth: 190,
    justifyContent: "flex-start",
  },
  dateBtnText: {
    color: "#3a4865",
    fontSize: 12,
    fontWeight: "700",
  },
  dateBtnPlaceholder: {
    color: "#8a95ad",
    fontSize: 12,
    fontWeight: "600",
  },
  btn: {
    minHeight: 36,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  btnPrimary: {
    backgroundColor: "#3c6df0",
    borderColor: "#3c6df0",
  },
  btnPrimaryText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  btnGhost: {
    backgroundColor: "#ffffff",
    borderColor: "#d8dee8",
  },
  btnGhostText: {
    color: "#40506e",
    fontSize: 12,
    fontWeight: "700",
  },
  btnSidebar: {
    backgroundColor: "#ffffff",
    borderColor: "#d8dee8",
  },
  btnSidebarText: {
    color: "#40506e",
    fontSize: 12,
    fontWeight: "700",
  },
  btnLink: {
    backgroundColor: "#ffffff",
    borderColor: "#d8dee8",
    minHeight: 30,
    paddingHorizontal: 10,
  },
  btnLinkText: {
    color: "#2f55d4",
    fontSize: 12,
    fontWeight: "700",
  },
  btnDanger: {
    backgroundColor: "#fff2f2",
    borderColor: "#f0c0c0",
    minHeight: 32,
    minWidth: 74,
  },
  btnDangerText: {
    color: "#a53d3d",
    fontSize: 12,
    fontWeight: "700",
  },
  btnDangerSoft: {
    backgroundColor: "#fff6f6",
    borderColor: "#f3d1d1",
    minHeight: 28,
    paddingHorizontal: 10,
  },
  btnDangerSoftText: {
    color: "#b04a4a",
    fontSize: 11,
    fontWeight: "700",
  },
  btnDisabled: {
    opacity: 0.65,
  },
});
