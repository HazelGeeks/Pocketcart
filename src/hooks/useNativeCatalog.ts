import React from "react";
import {
  listLatestStorePricesForProduct,
  listProductCategories,
  listProductPriceHistory,
  listProducts,
  type MarketProduct,
} from "../services/marketData";
import {
  buildPreviousPriceRows,
  buildPriceChart,
  type HomeRoute,
  type NativeTabId,
} from "../screens/nativeAppData";
import {
  mergeCategoryImageUrls,
  type CategoryImageUrls,
} from "../utils/categoryImages";

type UseNativeCatalogOptions = {
  activeTab: NativeTabId;
  favoriteStoreIds: string[];
  horizontalPad: number;
  onOpenHome: () => void;
  showToast: (message: string) => void;
  width: number;
};

export default function useNativeCatalog({
  activeTab,
  favoriteStoreIds,
  horizontalPad,
  onOpenHome,
  showToast,
  width,
}: UseNativeCatalogOptions) {
  const [route, setRoute] = React.useState<HomeRoute>("catalog");
  const [sortMode, setSortMode] = React.useState<
    "deals" | "lowestPrice" | "biggestDrop"
  >("deals");
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState("All");
  const [products, setProducts] = React.useState<MarketProduct[]>([]);
  const [categories, setCategories] = React.useState<string[]>([]);
  const [categoryImageUrls, setCategoryImageUrls] = React.useState<CategoryImageUrls>({});
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = React.useState("");
  const [priceHistory, setPriceHistory] = React.useState<
    Awaited<ReturnType<typeof listProductPriceHistory>>["data"]
  >([]);
  const [storePrices, setStorePrices] = React.useState<
    Awaited<ReturnType<typeof listLatestStorePricesForProduct>>["data"]
  >([]);
  const [historyLoading, setHistoryLoading] = React.useState(false);
  const [storePricesLoading, setStorePricesLoading] = React.useState(false);
  const [historyMessage, setHistoryMessage] = React.useState<string | null>(null);
  const [actionMessage, setActionMessage] = React.useState<string | null>(null);
  const [addSubmitting, setAddSubmitting] = React.useState(false);
  const [storeFilterId, setStoreFilterId] = React.useState<string | null>(null);
  const [storeFilterName, setStoreFilterName] = React.useState<string | null>(null);
  const productsRequestIdRef = React.useRef(0);
  const categoriesRequestIdRef = React.useRef(0);
  const historyRequestIdRef = React.useRef(0);
  const storePricesRequestIdRef = React.useRef(0);

  const filteredProducts = React.useMemo(() => {
    if (!storeFilterId) return products;
    return products.filter((product) => product.preferred_store_id === storeFilterId);
  }, [products, storeFilterId]);

  const selectedProduct = React.useMemo(
    () =>
      filteredProducts.find((product) => product.id === selectedProductId) ??
      filteredProducts[0] ??
      null,
    [filteredProducts, selectedProductId],
  );

  const productById = React.useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  React.useEffect(() => {
    setCategoryImageUrls((current) => mergeCategoryImageUrls(current, products));
  }, [products]);

  const chart = React.useMemo(() => {
    if (!selectedProduct || priceHistory.length === 0) return null;
    return buildPriceChart(priceHistory, width, horizontalPad);
  }, [horizontalPad, priceHistory, selectedProduct, width]);

  const previousPriceRows = React.useMemo(
    () => buildPreviousPriceRows(chart),
    [chart],
  );

  const loadProducts = React.useCallback(async () => {
    const requestId = productsRequestIdRef.current + 1;
    productsRequestIdRef.current = requestId;
    setLoading(true);
    const { data, error } = await listProducts({
      search: query,
      category: category === "All" ? undefined : category,
      preferredStoreIds: storeFilterId ? [storeFilterId] : favoriteStoreIds,
    });
    if (productsRequestIdRef.current !== requestId) return;
    setProducts(data);
    setLoading(false);
    setMessage(error ?? null);
  }, [category, favoriteStoreIds, query, storeFilterId]);

  const loadCategories = React.useCallback(async () => {
    const requestId = categoriesRequestIdRef.current + 1;
    categoriesRequestIdRef.current = requestId;
    const { data, error } = await listProductCategories();
    if (categoriesRequestIdRef.current !== requestId) return;
    setCategories(data);
    if (error) setMessage(error);
  }, []);

  const loadPriceHistory = React.useCallback(async (productId: string) => {
    const requestId = historyRequestIdRef.current + 1;
    historyRequestIdRef.current = requestId;
    if (!productId) {
      setPriceHistory([]);
      setHistoryLoading(false);
      return;
    }
    setHistoryLoading(true);
    const { data, error } = await listProductPriceHistory(productId);
    if (historyRequestIdRef.current !== requestId) return;
    setPriceHistory(data);
    setHistoryLoading(false);
    setHistoryMessage(error ?? null);
  }, []);

  const loadStorePrices = React.useCallback(async (productId: string) => {
    const requestId = storePricesRequestIdRef.current + 1;
    storePricesRequestIdRef.current = requestId;
    if (!productId) {
      setStorePrices([]);
      setStorePricesLoading(false);
      return;
    }
    setStorePricesLoading(true);
    const { data, error } = await listLatestStorePricesForProduct(productId);
    if (storePricesRequestIdRef.current !== requestId) return;
    setStorePrices(data);
    setStorePricesLoading(false);
    if (error) setHistoryMessage(error);
  }, []);

  React.useEffect(() => {
    if (activeTab !== "home") return;
    setRoute("catalog");
    void loadCategories();
  }, [activeTab, loadCategories]);

  React.useEffect(() => {
    if (activeTab !== "home") return;
    void loadProducts();
  }, [activeTab, loadProducts]);

  React.useEffect(() => {
    if (filteredProducts.length === 0) {
      setSelectedProductId("");
      return;
    }
    if (!filteredProducts.some((product) => product.id === selectedProductId)) {
      setSelectedProductId(filteredProducts[0].id);
    }
  }, [filteredProducts, selectedProductId]);

  React.useEffect(() => {
    setActionMessage(null);
  }, [route, selectedProductId]);

  React.useEffect(() => {
    if (activeTab !== "home" || route !== "detail" || !selectedProductId) return;
    void loadPriceHistory(selectedProductId);
    void loadStorePrices(selectedProductId);
  }, [activeTab, loadPriceHistory, loadStorePrices, route, selectedProductId]);

  const setStoreFilter = React.useCallback(
    (storeId: string, storeName: string) => {
      setStoreFilterId(storeId);
      setStoreFilterName(storeName);
      setRoute("catalog");
      setSelectedProductId("");
      onOpenHome();
      showToast(`Showing deals at ${storeName}.`);
    },
    [onOpenHome, showToast],
  );

  const clearStoreFilter = React.useCallback(() => {
    setStoreFilterId(null);
    setStoreFilterName(null);
  }, []);

  return {
    actionMessage,
    addSubmitting,
    categories,
    categoryImageUrls,
    category,
    chart,
    clearStoreFilter,
    filteredProducts,
    historyLoading,
    historyMessage,
    loading,
    message,
    previousPriceRows,
    productById,
    query,
    route,
    selectedProduct,
    setActionMessage,
    setAddSubmitting,
    setCategory,
    setQuery,
    setRoute,
    setSelectedProductId,
    setSortMode,
    setStoreFilter,
    sortMode,
    storeFilterName,
    storePrices,
    storePricesLoading,
  };
}
