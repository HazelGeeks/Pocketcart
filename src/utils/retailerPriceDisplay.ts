export type RetailerPriceSource = {
  id: string;
  price: number;
  store_name: string;
};

export type RetailerPriceRow<T extends RetailerPriceSource> = {
  retailerName: string;
  source: T;
};

export function retailerNameFromStoreDisplayName(value: string): string {
  const normalized = value.trim();
  if (!normalized) return "Unknown retailer";

  const branchSeparator = normalized.indexOf(" - ");
  return branchSeparator >= 0
    ? normalized.slice(0, branchSeparator).trim() || normalized
    : normalized;
}

export function selectLowestPriceByRetailer<T extends RetailerPriceSource>(
  rows: T[],
): RetailerPriceRow<T>[] {
  const lowestByRetailer = new Map<string, RetailerPriceRow<T>>();

  for (const row of rows) {
    const retailerName = retailerNameFromStoreDisplayName(row.store_name);
    const key = retailerName.toLocaleLowerCase("en-US");
    const existing = lowestByRetailer.get(key);

    if (
      !existing ||
      row.price < existing.source.price ||
      (row.price === existing.source.price && row.id.localeCompare(existing.source.id) < 0)
    ) {
      lowestByRetailer.set(key, { retailerName, source: row });
    }
  }

  return [...lowestByRetailer.values()].sort(
    (left, right) =>
      left.source.price - right.source.price || left.retailerName.localeCompare(right.retailerName),
  );
}
