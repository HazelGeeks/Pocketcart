type SalePeriodPrice = {
  product_id: string;
  store_id: string;
  valid_from: string;
  valid_to: string | null;
  observed_at: string;
};

export function isSalePriceActive(
  price: SalePeriodPrice,
  nowMs = Date.now(),
): boolean {
  const startMs = new Date(price.valid_from || price.observed_at).getTime();
  if (!Number.isFinite(startMs) || startMs > nowMs) return false;
  if (!price.valid_to) return true;

  const endMs = new Date(price.valid_to).getTime();
  return Number.isFinite(endMs) && endMs >= nowMs;
}

export function buildOnSaleProductIdSet(
  prices: SalePeriodPrice[],
  nowMs = Date.now(),
): Set<string> {
  const productIds = new Set<string>();
  prices.forEach((price) => {
    const productId = price.product_id.trim();
    if (productId && isSalePriceActive(price, nowMs)) {
      productIds.add(productId);
    }
  });
  return productIds;
}

export function buildOnSaleStoreIdsByProduct(
  prices: SalePeriodPrice[],
  nowMs = Date.now(),
): Map<string, Set<string>> {
  const storeIdsByProduct = new Map<string, Set<string>>();
  prices.forEach((price) => {
    const productId = price.product_id.trim();
    const storeId = price.store_id.trim();
    if (!productId || !storeId || !isSalePriceActive(price, nowMs)) return;

    const storeIds = storeIdsByProduct.get(productId) ?? new Set<string>();
    storeIds.add(storeId);
    storeIdsByProduct.set(productId, storeIds);
  });
  return storeIdsByProduct;
}
