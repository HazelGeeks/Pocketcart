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

type UseNativeCatalogOptions = {
  activeTab: NativeTabId;
  horizontalPad: number;
  onOpenHome: () => void;
  showToast: (message: string) => void;
  width: number;
};

export default function useNativeCatalog({
  activeTab,
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

  const filteredProducts = React.useMemo(() => {
    if (!storeFilterId) return products;
    return products.filter((product) => product.best_store_id === storeFilterId);
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

  const chart = React.useMemo(() => {
    if (!selectedProduct || priceHistory.length === 0) return null;
    return buildPriceChart(priceHistory, width, horizontalPad);
  }, [horizontalPad, priceHistory, selectedProduct, width]);

  const previousPriceRows = React.useMemo(
    () => buildPreviousPriceRows(chart),
    [chart],
  );

  const loadProducts = React.useCallback(async () => {
    setLoading(true);
    const { data, error } = await listProducts({
      search: query,
      category: category === "All" ? undefined : category,
    });
    setProducts(data);
    setLoading(false);
    setMessage(error ?? null);
  }, [category, query]);

  const loadCategories = React.useCallback(async () => {
    const { data, error } = await listProductCategories();
    setCategories(data);
    if (error) setMessage(error);
  }, []);

  const loadPriceHistory = React.useCallback(async (productId: string) => {
    if (!productId) {
      setPriceHistory([]);
      return;
    }
    setHistoryLoading(true);
    const { data, error } = await listProductPriceHistory(productId);
    setPriceHistory(data);
    setHistoryLoading(false);
    setHistoryMessage(error ?? null);
  }, []);

  const loadStorePrices = React.useCallback(async (productId: string) => {
    if (!productId) {
      setStorePrices([]);
      return;
    }
    setStorePricesLoading(true);
    const { data, error } = await listLatestStorePricesForProduct(productId);
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
