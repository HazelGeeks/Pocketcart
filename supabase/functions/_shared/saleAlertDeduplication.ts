export type SaleAlertIdentity = {
  user_id: string;
  alert_key: string;
};

export function dedupeSaleAlertPayloads<T extends SaleAlertIdentity>(
  payloads: T[],
): T[] {
  const seenKeys = new Set<string>();
  return payloads.filter((payload) => {
    const key = `${payload.user_id}\u0000${payload.alert_key}`;
    if (seenKeys.has(key)) return false;
    seenKeys.add(key);
    return true;
  });
}
