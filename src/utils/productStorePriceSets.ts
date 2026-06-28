import { dateOnlyToIso } from "./adminValidation";
import type { StorePriceSetInput } from "./adminScreenHelpers";
import type { AdminStore } from "../services/adminBackoffice";

export type ActiveStorePriceSet = {
  id: string;
  row: number;
  brand: string;
  storeId: string;
  price: string;
};

export type PreparedProductPriceSets =
  | {
      ok: true;
      activeSets: ActiveStorePriceSet[];
      periodStartIso: string | null;
      periodEndIso: string | null;
    }
  | { ok: false; error: string };

export function prepareProductPriceSets(params: {
  sets: StorePriceSetInput[];
  stores: AdminStore[];
  periodStartDate: string;
  periodEndDate: string;
}): PreparedProductPriceSets {
  const periodStart = params.periodStartDate.trim();
  const periodEnd = params.periodEndDate.trim();
  const periodStartIso = dateOnlyToIso(periodStart, false);
  const periodEndIso = dateOnlyToIso(periodEnd, true);
  const activeSets = params.sets
    .map((item, index) => ({
      id: item.id,
      row: index + 1,
      brand: item.brand.trim(),
      storeId: item.storeId.trim(),
      price: item.price.trim(),
    }))
    .filter((item) => item.brand.length > 0 || item.storeId.length > 0 || item.price.length > 0);

  const partialSet = activeSets.find((item) => (!item.brand && !item.storeId) || !item.price);
  if (partialSet) {
    return {
      ok: false,
      error: `Set ${partialSet.row}: brand/store and price are required together.`,
    };
  }

  const storeBrandLabel = (store: AdminStore) => store.brand?.trim() || "Other";
  const expandedSets: ActiveStorePriceSet[] = [];
  for (const item of activeSets) {
    if (item.storeId) {
      expandedSets.push(item);
      continue;
    }

    const matchingStores = params.stores.filter((store) => storeBrandLabel(store) === item.brand);
    if (matchingStores.length === 0) {
      return {
        ok: false,
        error: `Set ${item.row}: no branches found for ${item.brand}.`,
      };
    }

    matchingStores.forEach((store) => {
      expandedSets.push({ ...item, storeId: store.id });
    });
  }

  const seenStoreIds = new Set<string>();
  for (const item of expandedSets) {
    const key = item.storeId.toLowerCase();
    if (seenStoreIds.has(key)) {
      return {
        ok: false,
        error: `Set ${item.row}: duplicate store is not allowed.`,
      };
    }
    seenStoreIds.add(key);
  }

  if (expandedSets.some((item) => Number.isNaN(Number(item.price)))) {
    return { ok: false, error: "Each set price must be a valid number." };
  }

  if (expandedSets.length > 0 && (!periodStart || !periodEnd)) {
    return { ok: false, error: "Price period start/end are required. Select dates." };
  }

  if (expandedSets.length > 0 && (!periodStartIso || !periodEndIso)) {
    return { ok: false, error: "Invalid date format. Use valid date picker values." };
  }

  return {
    ok: true,
    activeSets: expandedSets,
    periodStartIso,
    periodEndIso,
  };
}
