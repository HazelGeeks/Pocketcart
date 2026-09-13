type Store = { brand: string | null; name: string; is_active: boolean };

export function notificationRetailers(stores: Store[]): string[] {
  const names = new Map<string, string>();
  for (const store of stores) {
    if (!store.is_active) continue;
    const name = store.brand?.trim() || store.name.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    const existing = names.get(key);
    if (!existing || name.localeCompare(existing, "en") < 0) names.set(key, name);
  }
  return [...names.values()].sort((a, b) => a.localeCompare(b, "en"));
}
