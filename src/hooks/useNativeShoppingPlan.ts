import React from "react";
import type { NativeTabId } from "../screens/nativeAppData";
import { listLatestStorePricesForProducts, listProducts, type MarketProduct } from "../services/marketData";
import { buildShoppingRecommendation } from "../utils/shoppingOptimizer";
import { productDisplayName } from "../utils/productNames";
import { isCustomShoppingItem } from "../utils/shoppingListState";
import useShoppingList from "./useShoppingList";

type UseNativeShoppingPlanOptions = {
  activeTab: NativeTabId;
  favoriteStoreIds: string[];
  profileId: string | null;
  productById: Map<string, MarketProduct>;
};

export default function useNativeShoppingPlan({
  activeTab,
  favoriteStoreIds,
  profileId,
  productById,
}: UseNativeShoppingPlanOptions) {
  const [prices, setPrices] = React.useState<
    Awaited<ReturnType<typeof listLatestStorePricesForProducts>>["data"]
  >([]);
  const [catalogDetails, setCatalogDetails] = React.useState<MarketProduct[]>([]);
  const [pricesLoading, setPricesLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const requestIdRef = React.useRef(0);
  const {
    familyName, importPersonal, personalCount, reload,
    markStored,
    addCustomItem,
    toggleCompleted,
    undoRemove,
    undoCount,
    addProduct,
    changeQuantity,
    clear,
    items,
    loaded,
    removeProduct,
    syncMessage,
  } = useShoppingList(profileId);

  const productIds = React.useMemo(
    () => new Set(items.map((item) => item.productId)),
    [items],
  );
  const productKey = React.useMemo(
    () => items.filter((item) => !item.completed && !isCustomShoppingItem(item)).map((item) => item.productId).sort().join("|"),
    [items],
  );
  const missingDetailsKey = items.filter((item) => !isCustomShoppingItem(item) && !productById.has(item.productId))
    .map((item) => item.productId).sort().join("|");
  React.useEffect(() => {
    if (!loaded || activeTab !== "shopping" || !missingDetailsKey) return;
    let active = true;
    void listProducts({ productIds: missingDetailsKey.split("|"), onSaleOnly: false, includePriceSummaries: false })
      .then(({ data }) => { if (active) setCatalogDetails(data); })
      .catch(() => { /* Keep Cart entries visible with image placeholders if metadata cannot be loaded. */ });
    return () => { active = false; };
  }, [activeTab, loaded, missingDetailsKey]);
  const displayItems = React.useMemo(
    () => items.map((item) => {
      const product = productById.get(item.productId) ?? catalogDetails.find((entry) => entry.id === item.productId);
      return product ? { ...item, name: productDisplayName(product), category: product.category || item.category, thumbnailUrl: product.thumbnail_url } : item;
    }),
    [catalogDetails, items, productById],
  );
  const recommendation = React.useMemo(
    () => buildShoppingRecommendation(
      displayItems.filter((item) => !item.completed),
      prices.map((price) => ({
        productId: price.product_id,
        storeId: price.store_id,
        storeName: price.store_name,
        storeArea: price.store_area,
        price: price.price,
      })),
      favoriteStoreIds,
    ),
    [displayItems, favoriteStoreIds, prices],
  );

  const loadPrices = React.useCallback(async () => {
    const ids = productKey ? productKey.split("|") : [];
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (ids.length === 0) {
      setPrices([]);
      setMessage(null);
      setPricesLoading(false);
      return;
    }

    setPricesLoading(true);
    try {
      const result = await listLatestStorePricesForProducts(ids);
      if (requestId !== requestIdRef.current) return;
      setPrices(result.data);
      setMessage(result.error ? "Could not load prices. Reopen Cart to retry." : null);
    } catch {
      if (requestId !== requestIdRef.current) return;
      setPrices([]);
      setMessage("Could not load prices. Reopen Cart to retry.");
    } finally {
      if (requestId === requestIdRef.current) setPricesLoading(false);
    }
  }, [productKey]);

  React.useEffect(() => {
    if (!loaded || activeTab !== "shopping") return;
    void loadPrices();
  }, [activeTab, loadPrices, loaded]);

  return {
    familyName, importPersonal, personalCount, reload,
    profileId,
    markStored,
    addCustomItem,
    toggleCompleted,
    undoRemove,
    undoCount,
    addProduct,
    changeQuantity,
    clear,
    items: displayItems,
    loadPrices,
    message,
    productIds,
    recommendation,
    removeProduct,
    pricesLoading,
    listLoading: !loaded,
    syncMessage,
  };
}
