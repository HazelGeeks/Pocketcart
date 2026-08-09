export type CategoryImageUrls = Record<string, string>;

type CategoryImageCandidate = {
  category: string;
  thumbnail_url: string | null;
};

export function categoryImageKey(category: string) {
  return category.trim().toLowerCase();
}

export function mergeCategoryImageUrls(
  current: CategoryImageUrls,
  products: CategoryImageCandidate[],
) {
  const next = { ...current };
  let changed = false;

  for (const product of products) {
    const key = categoryImageKey(product.category);
    const imageUrl = product.thumbnail_url?.trim();
    if (!key || !imageUrl || next[key]) continue;
    next[key] = imageUrl;
    changed = true;
  }

  return changed ? next : current;
}
