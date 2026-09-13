import React from "react";
import { listProducts, type MarketProduct } from "../services/marketData";

export default function useNativeAlertProduct(activeTab: string, openProduct: (product: MarketProduct) => void, showToast: (message: string) => void) {
  const generation = React.useRef(0);
  React.useEffect(() => { generation.current++; return () => { generation.current++; }; }, [activeTab]);
  return React.useCallback(async (id: string) => {
    const request = ++generation.current;
    try {
      const result = await listProducts({ productIds: [id], onSaleOnly: false });
      if (request !== generation.current) return;
      if (result.error || !result.data[0]) { showToast("Could not load this product. Please try again."); return; }
      openProduct(result.data[0]);
    } catch { if (request === generation.current) showToast("Could not load this product. Please try again."); }
  }, [openProduct, showToast]);
}
