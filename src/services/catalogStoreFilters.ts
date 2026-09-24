import AsyncStorage from "@react-native-async-storage/async-storage";

export type CatalogStoreFilter = { ids: string[]; name: string } | null;
export function normalizeCatalogStoreFilter(value: unknown): CatalogStoreFilter {
  if (!value || typeof value !== "object") return null;
  const entry = value as { ids?: unknown; name?: unknown };
  if (!Array.isArray(entry.ids) || typeof entry.name !== "string") return null;
  const ids = [...new Set(entry.ids.filter((id): id is string => typeof id === "string" && Boolean(id.trim())).map((id) => id.trim()))];
  const name = entry.name.trim();
  return ids.length && name ? { ids, name } : null;
}
const key = (profileId: string | null) => `pc-catalog-stores-v1.${profileId ? `user.${profileId}` : "guest"}`;
let writes: Promise<unknown> = Promise.resolve();
export async function readCatalogStoreFilter(profileId: string | null): Promise<CatalogStoreFilter> {
  await writes.catch(() => undefined);
  const raw = await AsyncStorage.getItem(key(profileId));
  try { return normalizeCatalogStoreFilter(raw ? JSON.parse(raw) : null); } catch { return null; }
}
export function saveCatalogStoreFilter(profileId: string | null, value: CatalogStoreFilter) {
  const storageKey = key(profileId);
  const payload = JSON.stringify(normalizeCatalogStoreFilter(value));
  const next = writes.catch(() => undefined).then(() => AsyncStorage.setItem(storageKey, payload));
  writes = next;
  return next;
}
