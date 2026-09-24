type Watch = { id: string; user_id: string; product_id: string | null; created_at: string };

/** Every saved product alert is active; subscription status does not gate alerts. */
export function activeWatchlist<T extends Watch>(items: T[]): T[] {
  return [...items].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
}
