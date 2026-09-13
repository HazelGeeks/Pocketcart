export const FREE_ALERT_PRODUCTS = 5;
type Watch = { id: string; user_id: string; product_id: string | null; created_at: string };
export function activeWatchlist<T extends Watch>(items: T[], isPlus: boolean): T[] {
  const sorted = [...items].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
  const products = new Set<string>();
  return sorted.filter(item => {
    const key = item.product_id ?? item.id;
    if (products.has(key)) return true;
    if (!isPlus && products.size >= FREE_ALERT_PRODUCTS) return false;
    products.add(key); return true;
  });
}
