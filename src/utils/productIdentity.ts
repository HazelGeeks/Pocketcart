import type { AdminProduct } from "../services/adminBackoffice";

export type ProductIdentityInput = {
  name: string;
  unit?: string | null;
  category: string;
};

function normalizeIdentityPart(value: string | null | undefined): string {
  return (value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

export function productIdentityKey(product: ProductIdentityInput): string {
  return [
    normalizeIdentityPart(product.name),
    normalizeIdentityPart(product.unit),
    normalizeIdentityPart(product.category),
  ].join("|");
}

export function findMatchingProduct(
  products: AdminProduct[],
  input: ProductIdentityInput,
  excludeProductId?: string | null,
): AdminProduct | null {
  const key = productIdentityKey(input);
  return (
    products.find((product) => {
      if (excludeProductId && product.id === excludeProductId) return false;
      return productIdentityKey(product) === key;
    }) ?? null
  );
}
