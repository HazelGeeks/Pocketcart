import React from "react";
import type { NativeTabId } from "../screens/nativeAppData";
import { listLatestStorePricesForProduct } from "../services/marketData";
import { settleLatestListResults } from "../utils/asyncRequestResults";
import { buildShoppingRecommendation } from "../utils/shoppingOptimizer";
import useShoppingList from "./useShoppingList";

type UseNativeShoppingPlanOptions = {
  activeTab: NativeTabId;
  favoriteStoreIds: string[];
  profileId: string | null;
};

export default function useNativeShoppingPlan({
  activeTab,
  favoriteStoreIds,
  profileId,
}: UseNativeShoppingPlanOptions) {
  const [prices, setPrices] = React.useState<
    Awaited<ReturnType<typeof listLatestStorePricesForProduct>>["data"]
  >([]);
  const [pricesLoading, setPricesLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const requestIdRef = React.useRef(0);
  const {
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
    () => [...productIds].sort().join("|"),
    [productIds],
  );
  const recommendation = React.useMemo(
    () => buildShoppingRecommendation(
      items,
      prices.map((price) => ({
        productId: price.product_id,
        storeId: price.store_id,
        storeName: price.store_name,
        storeArea: price.store_area,
        price: price.price,
      })),
      favoriteStoreIds,
    ),
    [favoriteStoreIds, items, prices],
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
    const results = await Promise.all(
      ids.map((productId) => listLatestStorePricesForProduct(productId)),
    );
    const settled = settleLatestListResults(
      requestId,
      requestIdRef.current,
      results,
    );
    if (!settled) return;

    setPrices(settled.data);
    setMessage(settled.message);
    setPricesLoading(false);
  }, [productKey]);

  React.useEffect(() => {
    if (!loaded || activeTab !== "shopping") return;
    void loadPrices();
  }, [activeTab, loadPrices, loaded]);

  return {
    addProduct,
    changeQuantity,
    clear,
    items,
    loadPrices,
    message,
    productIds,
    recommendation,
    removeProduct,
    pricesLoading,
    syncMessage,
  };
}
