import React from "react";
import {
  buildPreviousPriceRows,
  buildPriceChart,
  type HomeRoute,
  type NativeTabId,
} from "../screens/nativeAppData";
import {
  listProductPriceDetails,
  listProducts,
  type MarketProduct,
} from "../services/marketData";

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
  const [sortMode, setSortMode] = React.useState<"deals" | "lowestPrice" | "biggestDrop">("deals");
  const [onSaleOnly, setOnSaleOnly] = React.useState(true);
  const [query, setQuery] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const [category, setCategory] = React.useState("All");
  const [products, setProducts] = React.useState<MarketProduct[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = React.useState("");
  const [linkedProduct, setLinkedProduct] = React.useState<MarketProduct | null>(null);
  const [priceHistory, setPriceHistory] = React.useState<
    Awaited<ReturnType<typeof listProductPriceDetails>>["data"]["history"]
  >([]);
  const [storePrices, setStorePrices] = React.useState<
    Awaited<ReturnType<typeof listProductPriceDetails>>["data"]["storePrices"]
  >([]);
  const [historyLoading, setHistoryLoading] = React.useState(false);
  const [storePricesLoading, setStorePricesLoading] = React.useState(false);
  const [historyMessage, setHistoryMessage] = React.useState<string | null>(null);
  const [actionMessage, setActionMessage] = React.useState<string | null>(null);
  const [addSubmitting, setAddSubmitting] = React.useState(false);
  const [storeFilterIds, setStoreFilterIds] = React.useState<string[] | null>(null);
  const [storeFilterName, setStoreFilterName] = React.useState<string | null>(null);
  const productsRequestIdRef = React.useRef(0);
  const priceDetailsRequestIdRef = React.useRef(0);
  const pendingProductOpenRef = React.useRef(false);

  const scopedProducts = React.useMemo(() => {
    if (!storeFilterIds) return products;
    return products.filter((product) => storeFilterIds.includes(product.preferred_store_id ?? ""));
  }, [products, storeFilterIds]);

  const categories = React.useMemo(
    () => [...new Set(scopedProducts.map((product) => product.category).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b)),
    [scopedProducts],
  );
  const visibleCategory = categories.includes(category) ? category : "All";
  const filteredProducts = React.useMemo(
    () => visibleCategory === "All"
      ? scopedProducts
      : scopedProducts.filter((product) => product.category === visibleCategory),
    [scopedProducts, visibleCategory],
  );

  React.useEffect(() => {
    if (!loading && !message && category !== visibleCategory) setCategory(visibleCategory);
  }, [category, loading, message, visibleCategory]);

  const selectedProduct = React.useMemo(
    () =>
      (linkedProduct?.id === selectedProductId ? linkedProduct : null) ??
      filteredProducts.find((product) => product.id === selectedProductId) ??
      filteredProducts[0] ??
      null,
    [filteredProducts, linkedProduct, selectedProductId],
  );

  const productById = React.useMemo(
    () =>
      new Map(
        [...products, ...(linkedProduct ? [linkedProduct] : [])].map((product) => [
          product.id,
          product,
        ]),
      ),
    [linkedProduct, products],
  );

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 400);
    return () => clearTimeout(timer);
  }, [query]);

  const chart = React.useMemo(() => {
    if (!selectedProduct || priceHistory.length === 0) return null;
    return buildPriceChart(priceHistory, width, horizontalPad);
  }, [horizontalPad, priceHistory, selectedProduct, width]);

  const previousPriceRows = React.useMemo(() => buildPreviousPriceRows(chart), [chart]);

  const loadProducts = React.useCallback(async () => {
    const requestId = productsRequestIdRef.current + 1;
    productsRequestIdRef.current = requestId;
    setLoading(true);
    const { data, error } = await listProducts({
      search: debouncedQuery,
      preferredStoreIds: storeFilterIds ?? favoriteStoreIds,
      onSaleOnly,
    });
    if (productsRequestIdRef.current !== requestId) return;
    setProducts(data);
    setLoading(false);
    setMessage(error ?? null);
  }, [debouncedQuery, favoriteStoreIds, onSaleOnly, storeFilterIds]);

  const loadProductPriceDetails = React.useCallback(async (productId: string) => {
    const requestId = priceDetailsRequestIdRef.current + 1;
    priceDetailsRequestIdRef.current = requestId;
    if (!productId) {
      setPriceHistory([]);
      setStorePrices([]);
      setHistoryLoading(false);
      setStorePricesLoading(false);
      return;
    }
    setHistoryLoading(true);
    setStorePricesLoading(true);
    const { data, error } = await listProductPriceDetails(productId);
    if (priceDetailsRequestIdRef.current !== requestId) return;
    setPriceHistory(data.history);
    setStorePrices(data.storePrices);
    setHistoryLoading(false);
    setStorePricesLoading(false);
    setHistoryMessage(error ?? null);
  }, []);

  React.useEffect(() => {
    if (activeTab !== "home") return;
    if (pendingProductOpenRef.current) pendingProductOpenRef.current = false;
    else setRoute("catalog");
  }, [activeTab]);

  React.useEffect(() => {
    if (activeTab !== "home") return;
    void loadProducts();
  }, [activeTab, loadProducts]);

  React.useEffect(() => {
    if (linkedProduct?.id === selectedProductId) return;
    if (filteredProducts.length === 0) {
      setSelectedProductId("");
      return;
    }
    if (!filteredProducts.some((product) => product.id === selectedProductId)) {
      setSelectedProductId(filteredProducts[0].id);
    }
  }, [filteredProducts, linkedProduct, selectedProductId]);

  React.useEffect(() => {
    if (route === "catalog") setLinkedProduct(null);
  }, [route]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: clear action feedback after navigation or product changes
  React.useEffect(() => {
    setActionMessage(null);
  }, [route, selectedProductId]);

  React.useEffect(() => {
    if (activeTab !== "home" || route !== "detail" || !selectedProductId) return;
    void loadProductPriceDetails(selectedProductId);
  }, [activeTab, loadProductPriceDetails, route, selectedProductId]);

  const setRetailerFilter = React.useCallback(
    (storeIds: string[], storeName: string) => {
      setStoreFilterIds(storeIds);
      setStoreFilterName(storeName);
      setRoute("catalog");
      setSelectedProductId("");
      onOpenHome();
      showToast(`Showing deals at ${storeName}.`);
    },
    [onOpenHome, showToast],
  );

  const setStoreFilter = React.useCallback((id: string, name: string) => {
    setRetailerFilter([id], name);
  }, [setRetailerFilter]);

  const clearStoreFilter = React.useCallback(() => {
    setStoreFilterIds(null);
    setStoreFilterName(null);
  }, []);

  const openProduct = React.useCallback(
    (product: MarketProduct) => {
      pendingProductOpenRef.current = true;
      setLinkedProduct(product);
      setSelectedProductId(product.id);
      setRoute("detail");
      onOpenHome();
    },
    [onOpenHome],
  );

  return {
    actionMessage,
    addSubmitting,
    categories,
    category: visibleCategory,
    chart,
    clearStoreFilter,
    filteredProducts,
    historyLoading,
    historyMessage,
    loading,
    message,
    onSaleOnly,
    openProduct,
    previousPriceRows,
    productById,
    query,
    route,
    selectedProduct,
    setActionMessage,
    setAddSubmitting,
    setCategory,
    setOnSaleOnly,
    setQuery,
    setRoute,
    setSelectedProductId,
    setSortMode,
    setStoreFilter,
    setRetailerFilter,
    sortMode,
    storeFilterName,
    storePrices,
    storePricesLoading,
  };
}
