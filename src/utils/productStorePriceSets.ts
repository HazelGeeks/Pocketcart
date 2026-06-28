import { dateOnlyToIso } from "./adminValidation";
import type { StorePriceSetInput } from "./adminScreenHelpers";
import type { AdminStore } from "../services/adminBackoffice";

export type ActiveStorePriceSet = {
  id: string;
  row: number;
  brand: string;
  storeId: string;
  price: string;
  periodStartDate: string;
  periodEndDate: string;
  periodStartIso: string;
  periodEndIso: string;
};

export type PreparedProductPriceSets =
  | {
      ok: true;
      activeSets: ActiveStorePriceSet[];
    }
  | { ok: false; error: string };

export function prepareProductPriceSets(params: {
  sets: StorePriceSetInput[];
  stores: AdminStore[];
}): PreparedProductPriceSets {
  const activeSets = params.sets
    .map((item, index) => ({
      id: item.id,
      row: index + 1,
      brand: item.brand.trim(),
      storeId: item.storeId.trim(),
      price: item.price.trim(),
      periodStartDate: item.periodStartDate.trim(),
      periodEndDate: item.periodEndDate.trim(),
    }))
    .filter(
      (item) =>
        item.brand.length > 0 ||
        item.storeId.length > 0 ||
        item.price.length > 0 ||
        item.periodStartDate.length > 0 ||
        item.periodEndDate.length > 0,
    );

  const partialSet = activeSets.find(
    (item) =>
      (!item.brand && !item.storeId) ||
      !item.price ||
      !item.periodStartDate ||
      !item.periodEndDate,
  );
  if (partialSet) {
    return {
      ok: false,
      error: `Set ${partialSet.row}: brand/store, price, and sale period are required together.`,
    };
  }

  const normalizedSets = activeSets.map((item) => {
    const periodStartIso = dateOnlyToIso(item.periodStartDate, false);
    const periodEndIso = dateOnlyToIso(item.periodEndDate, true);
    return { ...item, periodStartIso, periodEndIso };
  });

  const invalidDateSet = normalizedSets.find((item) => !item.periodStartIso || !item.periodEndIso);
  if (invalidDateSet) {
    return { ok: false, error: `Set ${invalidDateSet.row}: invalid sale period dates.` };
  }

  const reversedDateSet = normalizedSets.find(
    (item) =>
      item.periodStartIso &&
      item.periodEndIso &&
      new Date(item.periodEndIso).getTime() < new Date(item.periodStartIso).getTime(),
  );
  if (reversedDateSet) {
    return { ok: false, error: `Set ${reversedDateSet.row}: sale period end date must be after start date.` };
  }

  const storeBrandLabel = (store: AdminStore) => store.brand?.trim() || "Other";
  const expandedSets: ActiveStorePriceSet[] = [];
  for (const item of normalizedSets) {
    if (item.storeId) {
      expandedSets.push({
        ...item,
        periodStartIso: item.periodStartIso!,
        periodEndIso: item.periodEndIso!,
      });
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
      expandedSets.push({
        ...item,
        storeId: store.id,
        periodStartIso: item.periodStartIso!,
        periodEndIso: item.periodEndIso!,
      });
    });
  }

  const seenStoreIds = new Set<string>();
  for (const item of expandedSets) {
    const key = `${item.storeId.toLowerCase()}|${item.periodStartIso}`;
    if (seenStoreIds.has(key)) {
      return {
        ok: false,
        error: `Set ${item.row}: duplicate store and sale period is not allowed.`,
      };
    }
    seenStoreIds.add(key);
  }

  if (expandedSets.some((item) => Number.isNaN(Number(item.price)))) {
    return { ok: false, error: "Each set price must be a valid number." };
  }

  return {
    ok: true,
    activeSets: expandedSets,
  };
}
