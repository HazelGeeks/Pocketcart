import type { AdminProduct } from "../services/adminBackoffice";
import { isValidGtin, normalizeGtin } from "./productIdentity";
import { productDisplayName } from "./productNames";

export type ProductDuplicateMethod = "gtin" | "name_and_unit";

export type ProductDuplicateGroup = {
  id: string;
  method: ProductDuplicateMethod;
  label: string;
  products: AdminProduct[];
};

function normalizeIdentityText(value: string | null | undefined): string {
  return (value ?? "")
    .trim()
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

function productNameKeys(product: AdminProduct): string[] {
  return [
    ...new Set(
      [product.english_name, product.korean_name]
        .map(normalizeIdentityText)
        .filter((value) => value.length >= 3),
    ),
  ];
}

function knownBrandsAreCompatible(products: AdminProduct[]): boolean {
  const brands = new Set(
    products
      .map((product) => normalizeIdentityText(product.brand))
      .filter(Boolean),
  );
  return brands.size <= 1;
}

function uniqueProducts(products: AdminProduct[]): AdminProduct[] {
  return [
    ...new Map(products.map((product) => [product.id, product])).values(),
  ].sort((left, right) =>
    productDisplayName(left).localeCompare(productDisplayName(right), undefined, { sensitivity: "base" }),
  );
}

function groupSignature(products: AdminProduct[]): string {
  return products.map((product) => product.id).sort().join("|");
}

function gtinGroups(products: AdminProduct[]): ProductDuplicateGroup[] {
  const byGtin = new Map<string, AdminProduct[]>();
  products.forEach((product) => {
    if (!isValidGtin(product.gtin)) return;
    const gtin = normalizeGtin(product.gtin);
    byGtin.set(gtin, [...(byGtin.get(gtin) ?? []), product]);
  });

  return [...byGtin.entries()].flatMap(([gtin, candidates]) => {
    const unique = uniqueProducts(candidates);
    if (unique.length < 2) return [];
    return [{
      id: `gtin:${gtin}`,
      method: "gtin" as const,
      label: `GTIN ${gtin}`,
      products: unique,
    }];
  });
}

function nameAndUnitGroups(products: AdminProduct[]): ProductDuplicateGroup[] {
  const byIdentity = new Map<string, {
    label: string;
    products: AdminProduct[];
  }>();

  products.forEach((product) => {
    const unit = normalizeIdentityText(product.unit);
    if (!unit) return;
    productNameKeys(product).forEach((nameKey) => {
      const identity = `${nameKey}|${unit}`;
      const existing = byIdentity.get(identity);
      byIdentity.set(identity, {
        label: existing?.label ?? productDisplayName(product),
        products: [...(existing?.products ?? []), product],
      });
    });
  });

  return [...byIdentity.entries()].flatMap(([identity, candidate]) => {
    const unique = uniqueProducts(candidate.products);
    if (unique.length < 2 || !knownBrandsAreCompatible(unique)) return [];
    return [{
      id: `name-unit:${identity}`,
      method: "name_and_unit" as const,
      label: candidate.label,
      products: unique,
    }];
  });
}

export function buildProductDuplicateGroups(
  products: AdminProduct[],
): ProductDuplicateGroup[] {
  const groups = [
    ...gtinGroups(products),
    ...nameAndUnitGroups(products),
  ].sort((left, right) => {
    if (left.method !== right.method) return left.method === "gtin" ? -1 : 1;
    if (left.products.length !== right.products.length) {
      return right.products.length - left.products.length;
    }
    return left.label.localeCompare(right.label, undefined, { sensitivity: "base" });
  });

  const seenProductSets = new Set<string>();
  const acceptedNameGroups: Array<Set<string>> = [];
  return groups.filter((group) => {
    const signature = groupSignature(group.products);
    if (seenProductSets.has(signature)) return false;
    const productIds = new Set(group.products.map((product) => product.id));
    if (
      group.method === "name_and_unit" &&
      acceptedNameGroups.some((accepted) =>
        [...productIds].every((productId) => accepted.has(productId)),
      )
    ) {
      return false;
    }
    seenProductSets.add(signature);
    if (group.method === "name_and_unit") acceptedNameGroups.push(productIds);
    return true;
  });
}
