// Successful public reads only; bounded memory and shared concurrent requests.
export function requestCache<T>(ttlMs: number, maxEntries = 100) {
  const entries = new Map<string, { value: T; expiresAt: number }>();
  const pending = new Map<string, Promise<T>>();
  return async (
    key: string,
    read: () => Promise<T>,
    cacheable: (value: T) => boolean = () => true,
    expiresAt: (value: T) => number = () => Date.now() + ttlMs,
  ): Promise<T> => {
    const entry = entries.get(key);
    if (entry && entry.expiresAt > Date.now()) return entry.value;
    entries.delete(key);
    const inflight = pending.get(key);
    if (inflight) return inflight;
    const request = read()
      .then((value) => {
        if (cacheable(value)) {
          while (entries.size >= maxEntries) entries.delete(entries.keys().next().value!);
          entries.set(key, { value, expiresAt: Math.min(Date.now() + ttlMs, expiresAt(value)) });
        }
        return value;
      })
      .finally(() => pending.delete(key));
    pending.set(key, request);
    return request;
  };
}
