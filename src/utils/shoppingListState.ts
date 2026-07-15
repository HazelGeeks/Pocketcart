export type ShoppingListItem = {
  productId: string;
  name: string;
  unit: string | null;
  quantity: number;
};

type ShoppingListProduct = Pick<ShoppingListItem, "name" | "unit"> & { id: string };

export function normalizeShoppingListItems(value: unknown): ShoppingListItem[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (typeof item !== "object" || item === null) return [];

    const candidate = item as Partial<ShoppingListItem>;
    if (typeof candidate.productId !== "string" || typeof candidate.name !== "string") {
      return [];
    }

    return [{
      productId: candidate.productId,
      name: candidate.name,
      unit: typeof candidate.unit === "string" ? candidate.unit : null,
      quantity: Math.max(1, Math.min(99, Math.round(Number(candidate.quantity) || 1))),
    }];
  });
}

export function addShoppingListProduct(
  items: ShoppingListItem[],
  product: ShoppingListProduct,
): ShoppingListItem[] {
  const existing = items.find((item) => item.productId === product.id);
  if (existing) {
    return items.map((item) =>
      item.productId === product.id
        ? { ...item, quantity: Math.min(99, item.quantity + 1) }
        : item,
    );
  }

  return [...items, {
    productId: product.id,
    name: product.name,
    unit: product.unit,
    quantity: 1,
  }];
}

export function changeShoppingListQuantity(
  items: ShoppingListItem[],
  productId: string,
  delta: number,
): ShoppingListItem[] {
  return items.flatMap((item) => {
    if (item.productId !== productId) return [item];
    const quantity = item.quantity + delta;
    return quantity <= 0 ? [] : [{ ...item, quantity: Math.min(99, quantity) }];
  });
}

export function removeShoppingListProduct(
  items: ShoppingListItem[],
  productId: string,
): ShoppingListItem[] {
  return items.filter((item) => item.productId !== productId);
}
