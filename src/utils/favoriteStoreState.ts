export function normalizeFavoriteStoreIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const ids = value.flatMap((item) => {
    if (typeof item !== "string") return [];
    const id = item.trim();
    return id ? [id] : [];
  });

  return [...new Set(ids)];
}

export function mergeFavoriteStoreIds(...sources: string[][]): string[] {
  return normalizeFavoriteStoreIds(sources.flat());
}

export function toggleFavoriteStoreId(ids: string[], storeId: string): string[] {
  const normalizedId = storeId.trim();
  if (!normalizedId) return ids;

  return ids.includes(normalizedId)
    ? ids.filter((id) => id !== normalizedId)
    : [...ids, normalizedId];
}
