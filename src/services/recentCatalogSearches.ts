import AsyncStorage from "@react-native-async-storage/async-storage";
import { normalizeRecentSearches } from "../utils/catalogSearch";

const storageKey = (profileId: string | null) => `pc-catalog-searches-v1.${profileId ? `user.${profileId}` : "guest"}`;
let writes: Promise<unknown> = Promise.resolve();

export async function readRecentCatalogSearches(profileId: string | null) {
  await writes.catch(() => undefined);
  const raw = await AsyncStorage.getItem(storageKey(profileId));
  try { return normalizeRecentSearches(raw ? JSON.parse(raw) : []); }
  catch { return []; }
}

export function updateRecentCatalogSearches(profileId: string | null, mutate: (current: string[]) => string[]) {
  const key = storageKey(profileId);
  const next = writes.catch(() => undefined).then(async () => {
    const raw = await AsyncStorage.getItem(key);
    let current: string[] = [];
    try { current = normalizeRecentSearches(raw ? JSON.parse(raw) : []); } catch { /* Discard malformed history. */ }
    const result = normalizeRecentSearches(mutate(current));
    await AsyncStorage.setItem(key, JSON.stringify(result));
    return result;
  });
  writes = next;
  return next;
}
