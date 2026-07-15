export type ShoppingListEntry = {
  productId: string;
  name: string;
  quantity: number;
};

export type ShoppingPrice = {
  productId: string;
  storeId: string;
  storeName: string;
  storeArea: string | null;
  price: number;
};

export type ShoppingPlanItem = {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type ShoppingPlanStop = {
  storeId: string;
  storeName: string;
  storeArea: string | null;
  subtotal: number;
  items: ShoppingPlanItem[];
};

export type ShoppingPlan = {
  kind: "single" | "split";
  total: number;
  stops: ShoppingPlanStop[];
};

export type ShoppingRecommendation = {
  bestSingle: ShoppingPlan | null;
  bestSplit: ShoppingPlan | null;
  recommended: ShoppingPlan | null;
  unpricedProductIds: string[];
};

type StoreInfo = Pick<ShoppingPrice, "storeId" | "storeName" | "storeArea">;

const roundMoney = (value: number): number => Math.round(value * 100) / 100;

export function buildShoppingRecommendation(
  entries: ShoppingListEntry[],
  prices: ShoppingPrice[],
): ShoppingRecommendation {
  const validEntries = entries.filter(
    (entry) => entry.productId.trim() && Number.isFinite(entry.quantity) && entry.quantity > 0,
  );
  const priceByProductAndStore = new Map<string, ShoppingPrice>();
  const stores = new Map<string, StoreInfo>();

  for (const price of prices) {
    if (!price.productId || !price.storeId || !Number.isFinite(price.price) || price.price < 0) {
      continue;
    }
    const key = `${price.productId}\u0000${price.storeId}`;
    const existing = priceByProductAndStore.get(key);
    if (!existing || price.price < existing.price) {
      priceByProductAndStore.set(key, price);
    }
    stores.set(price.storeId, price);
  }

  const pricedEntries = validEntries.filter((entry) =>
    [...stores.keys()].some((storeId) =>
      priceByProductAndStore.has(`${entry.productId}\u0000${storeId}`),
    ),
  );
  const unpricedProductIds = validEntries
    .filter((entry) => !pricedEntries.some((priced) => priced.productId === entry.productId))
    .map((entry) => entry.productId);

  if (pricedEntries.length === 0) {
    return { bestSingle: null, bestSplit: null, recommended: null, unpricedProductIds };
  }

  const storeIds = [...stores.keys()];
  const singlePlans = storeIds
    .map((storeId) => buildPlan(pricedEntries, [storeId], priceByProductAndStore, stores))
    .filter((plan): plan is ShoppingPlan => plan !== null);

  const splitPlans: ShoppingPlan[] = [];
  for (let first = 0; first < storeIds.length; first += 1) {
    for (let second = first + 1; second < storeIds.length; second += 1) {
      const plan = buildPlan(
        pricedEntries,
        [storeIds[first], storeIds[second]],
        priceByProductAndStore,
        stores,
      );
      if (plan && plan.stops.length === 2) splitPlans.push(plan);
    }
  }

  const bestSingle = lowestPlan(singlePlans);
  const bestSplit = lowestPlan(splitPlans);
  const recommended =
    bestSplit && (!bestSingle || bestSplit.total < bestSingle.total)
      ? bestSplit
      : bestSingle ?? bestSplit;

  return { bestSingle, bestSplit, recommended, unpricedProductIds };
}

function buildPlan(
  entries: ShoppingListEntry[],
  storeIds: string[],
  prices: Map<string, ShoppingPrice>,
  stores: Map<string, StoreInfo>,
): ShoppingPlan | null {
  const itemsByStore = new Map<string, ShoppingPlanItem[]>();

  for (const entry of entries) {
    const candidates = storeIds
      .map((storeId) => prices.get(`${entry.productId}\u0000${storeId}`))
      .filter((price): price is ShoppingPrice => Boolean(price))
      .sort((a, b) => a.price - b.price);
    const selected = candidates[0];
    if (!selected) return null;

    const items = itemsByStore.get(selected.storeId) ?? [];
    items.push({
      productId: entry.productId,
      name: entry.name,
      quantity: entry.quantity,
      unitPrice: selected.price,
      total: roundMoney(selected.price * entry.quantity),
    });
    itemsByStore.set(selected.storeId, items);
  }

  const stops = [...itemsByStore.entries()].map(([storeId, items]) => {
    const store = stores.get(storeId)!;
    return {
      storeId,
      storeName: store.storeName,
      storeArea: store.storeArea,
      subtotal: roundMoney(items.reduce((sum, item) => sum + item.total, 0)),
      items,
    };
  });

  return {
    kind: stops.length === 1 ? "single" : "split",
    total: roundMoney(stops.reduce((sum, stop) => sum + stop.subtotal, 0)),
    stops,
  };
}

function lowestPlan(plans: ShoppingPlan[]): ShoppingPlan | null {
  return plans.sort((a, b) => a.total - b.total)[0] ?? null;
}
