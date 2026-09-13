import React from "react";
import { listProducts, type MarketProduct } from "../services/marketData";
import type { MyFreezerItem } from "../services/myFreezer";
import type { ShoppingListItem } from "../utils/shoppingListState";
import { freezerProductId } from "../utils/freezerProductImages";

export default function useFreezerProductImages(items: MyFreezerItem[], cart: ShoppingListItem[]) {
  const [products, setProducts] = React.useState<MarketProduct[]>([]);
  const linkedItems = items.map(item => ({ ...item, product_id: freezerProductId(item, cart) }));
  const key = [...new Set(linkedItems.flatMap(item => item.product_id ? [item.product_id] : []))].sort().join("|");
  React.useEffect(() => {
    let active = true;
    if (!key) { setProducts([]); return; }
    const ids = key.split("|");
    const load = async () => {
      const results: MarketProduct[] = [];
      for (let index = 0; index < ids.length; index += 100) {
        if (!active) return;
        const result = await listProducts({ productIds: ids.slice(index, index + 100), onSaleOnly: false, includePriceSummaries: false });
        if (result.error) throw new Error(result.error);
        results.push(...result.data);
      }
      if (active) setProducts(results);
    };
    void load().catch(() => { /* Keep food visible with available Cart images or placeholders. */ });
    return () => { active = false; };
  }, [key]);
  const byId = new Map(products.map(product => [product.id, product]));
  return linkedItems.map(item => {
    const product = item.product_id ? byId.get(item.product_id) : null;
    const cartItem = item.product_id ? cart.find(row => row.productId === item.product_id) : null;
    return { ...item, thumbnail_url: product ? product.thumbnail_url : cartItem?.thumbnailUrl ?? null,
      category: product?.category ?? cartItem?.category };
  });
}
