import type { MarketProduct } from "../services/marketData";
import type { FreezerItemDraft } from "./freezerItem";
import { productDisplayName } from "./productNames";

export function applyFreezerProduct(draft: FreezerItemDraft, product: MarketProduct): FreezerItemDraft {
  return {
    ...draft,
    name: productDisplayName(product).slice(0, 100),
    productId: product.id,
    unit: (product.unit ?? "").slice(0, 30),
  };
}
