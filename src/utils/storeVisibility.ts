export type StoreVisibilityCandidate = {
  name: string;
  area?: string | null;
  price_note?: string | null;
  is_active?: boolean | null;
};

export function looksLikeProductStoreRecord(store: StoreVisibilityCandidate): boolean {
  const joined = `${store.name} ${store.area ?? ""} ${store.price_note ?? ""}`.toLowerCase();
  if (/\$\s*\d|\b\d+(?:\.\d{1,2})?\s*(?:ea|each|lb|kg|g|ml|l|pk|pack|ct)\b/i.test(joined)) {
    return true;
  }
  if (/^(eggs?|milk|bread|apple|banana|chicken|beef|pork|rice|ramen)\b/i.test(store.name.trim())) {
    return true;
  }
  return false;
}

export function isCustomerVisibleStore(store: StoreVisibilityCandidate): boolean {
  return store.is_active !== false && !looksLikeProductStoreRecord(store);
}
