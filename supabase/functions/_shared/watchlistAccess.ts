import { activeWatchlist } from "./watchlistPlan.ts";

export async function eligibleWatchlist<T extends { id: string; user_id: string; product_id: string | null; created_at: string }>(items: T[]): Promise<T[]> {
  return activeWatchlist(items);
}
