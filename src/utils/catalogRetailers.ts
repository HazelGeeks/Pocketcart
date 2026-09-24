export type CatalogRetailer = { name: string; ids: string[] };
export function groupCatalogRetailers(stores: { id: string; name: string; brand?: string | null }[]): CatalogRetailer[] {
  const groups = new Map<string, CatalogRetailer>();
  for (const store of stores) {
    const name = store.brand?.trim() || store.name.split(" - ")[0].trim();
    const key = name.toLowerCase();
    const group = groups.get(key) ?? { name, ids: [] };
    if (!group.ids.includes(store.id)) group.ids.push(store.id);
    groups.set(key, group);
  }
  return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name));
}
export function toggleCatalogRetailer(selected: string[], retailer: CatalogRetailer): string[] {
  const checked = retailer.ids.every((id) => selected.includes(id));
  return checked ? selected.filter((id) => !retailer.ids.includes(id)) : [...new Set([...selected, ...retailer.ids])];
}
