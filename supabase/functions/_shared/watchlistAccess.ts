import { revenueCatHasAccess } from "./billingEntitlement.ts";
import { activeWatchlist } from "./watchlistPlan.ts";

export async function verifiedWatchlistPlus(userId: string): Promise<boolean> {
  const key = Deno.env.get("REVENUECAT_SECRET_API_KEY");
  if (!key) return false; // Free tier works before billing is configured.
  const result = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`, {
    headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(10000),
  });
  if (result.status === 404) return false;
  if (!result.ok) throw new Error("Subscription verification unavailable. Please try again.");
  const body = await result.json();
  return revenueCatHasAccess(body.subscriber, "pocketcart_plus", Date.now(), Deno.env.get("REVENUECAT_ALLOW_SANDBOX") === "true");
}

export async function eligibleWatchlist<T extends { id: string; user_id: string; product_id: string | null; created_at: string }>(items: T[]): Promise<T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const group = groups.get(item.user_id) ?? [];
    group.push(item); groups.set(item.user_id, group);
  }
  const allowed: T[] = [];
  // Bounded provider traffic; outages never grant additional paid slots.
  const entries = [...groups];
  for (let from = 0; from < entries.length; from += 8) {
    const batch = await Promise.all(entries.slice(from, from + 8).map(async ([userId, group]) => {
      const plus = group.length > 5 ? await verifiedWatchlistPlus(userId).catch(() => false) : false;
      return activeWatchlist(group, plus);
    }));
    for (const group of batch) allowed.push(...group);
  }
  return allowed;
}
