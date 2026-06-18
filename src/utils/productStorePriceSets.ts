import { dateOnlyToIso } from "./adminValidation";
import type { StorePriceSetInput } from "./adminScreenHelpers";

export type ActiveStorePriceSet = {
  id: string;
  row: number;
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
      storeId: item.storeId.trim(),
      price: item.price.trim(),
    }))
    .filter((item) => item.storeId.length > 0 || item.price.length > 0);

  const partialSet = activeSets.find((item) => !item.storeId || !item.price);
  if (partialSet) {
    return {
      ok: false,
      error: `Set ${partialSet.row}: store and price are required together.`,
    };
  }

  const seenStoreIds = new Set<string>();
  for (const item of activeSets) {
    const key = item.storeId.toLowerCase();
    if (seenStoreIds.has(key)) {
      return {
        ok: false,
        error: `Set ${item.row}: duplicate store is not allowed.`,
      };
    }
    seenStoreIds.add(key);
  }

  if (activeSets.some((item) => Number.isNaN(Number(item.price)))) {
    return { ok: false, error: "Each set price must be a valid number." };
  }

  if (activeSets.length > 0 && (!periodStart || !periodEnd)) {
    return { ok: false, error: "Price period start/end are required. Select dates." };
  }

  if (activeSets.length > 0 && (!periodStartIso || !periodEndIso)) {
    return { ok: false, error: "Invalid date format. Use valid date picker values." };
  }

  return {
    ok: true,
    activeSets,
    periodStartIso,
    periodEndIso,
  };
}
