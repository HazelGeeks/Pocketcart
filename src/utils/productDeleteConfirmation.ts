import { productDisplayName } from "./productNames";

export type ProductDeleteMode = "single" | "bulk";

export type ProductDeleteTarget = {
  id: string;
  english_name?: string | null;
  korean_name: string;
};

export type ProductDeleteConfirmation = {
  mode: ProductDeleteMode;
  ids: string[];
  count: number;
  visibleNames: string[];
  remainingCount: number;
  prompt: string;
  confirmLabel: string;
};

const MAX_VISIBLE_PRODUCT_NAMES = 5;

export function buildProductDeleteConfirmation(
  products: ProductDeleteTarget[],
  mode: ProductDeleteMode,
): ProductDeleteConfirmation | null {
  const uniqueProducts = new Map<string, string>();

  products.forEach((product) => {
    const id = product.id.trim();
    if (!id || uniqueProducts.has(id)) return;
    uniqueProducts.set(id, productDisplayName(product));
  });

  const entries = Array.from(uniqueProducts.entries());
  if (entries.length === 0) return null;

  const count = entries.length;
  const visibleNames = entries
    .slice(0, MAX_VISIBLE_PRODUCT_NAMES)
    .map(([, name]) => name);
  const isBulk = mode === "bulk";
  const productLabel = count === 1 ? "product" : "products";
  const productButtonLabel = count === 1 ? "Product" : "Products";

  return {
    mode,
    ids: entries.map(([id]) => id),
    count,
    visibleNames,
    remainingCount: Math.max(0, count - visibleNames.length),
    prompt: isBulk
      ? `Delete the selected ${count} ${productLabel}?`
      : `Delete “${visibleNames[0]}”?`,
    confirmLabel: isBulk ? `Delete ${count} ${productButtonLabel}` : "Delete Product",
  };
}

export function removeDeletedProductIds(
  selectedIds: Iterable<string>,
  deletedIds: Iterable<string>,
): Set<string> {
  const next = new Set(selectedIds);
  for (const id of deletedIds) {
    next.delete(id);
  }
  return next;
}
