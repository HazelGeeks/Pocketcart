import type { AdminProduct } from "../services/adminBackoffice";
import {
  normalizeLooseIdentityPart,
  normalizeProductUnit,
  productFamilyName,
} from "./productIdentityNormalization";
import { productDisplayName } from "./productNames";

export type ProductDuplicateMethod = "name_and_unit" | "name_family_and_unit";

export type ProductDuplicateGroup = {
  id: string;
  method: ProductDuplicateMethod;
  label: string;
  products: AdminProduct[];
};

function productNameKeys(product: AdminProduct): string[] {
  return [
    ...new Set(
      [product.english_name, product.korean_name]
        .map(normalizeLooseIdentityPart)
        .filter((value) => value.length >= 3),
    ),
  ];
}

function productNameFamilyKeys(product: AdminProduct): string[] {
  return [
    ...new Set(
      [product.english_name, product.korean_name]
        .map(productFamilyName)
        .filter((value) => value.length >= 3),
    ),
  ];
}

function knownBrandsAreCompatible(products: AdminProduct[]): boolean {
  const brands = new Set(
    products.map((product) => normalizeLooseIdentityPart(product.brand)).filter(Boolean),
  );
  return brands.size <= 1;
}

function uniqueProducts(products: AdminProduct[]): AdminProduct[] {
  return [...new Map(products.map((product) => [product.id, product])).values()].sort(
    (left, right) =>
      productDisplayName(left).localeCompare(productDisplayName(right), undefined, {
        sensitivity: "base",
      }),
  );
}

function groupSignature(products: AdminProduct[]): string {
  return products
    .map((product) => product.id)
    .sort()
    .join("|");
}

function nameAndUnitGroups(
  products: AdminProduct[],
  method: ProductDuplicateMethod,
): ProductDuplicateGroup[] {
  const byIdentity = new Map<
    string,
    {
      label: string;
      products: AdminProduct[];
    }
  >();

  products.forEach((product) => {
    const unit = normalizeProductUnit(product.unit);
    if (!unit) return;
    const nameKeys =
      method === "name_and_unit" ? productNameKeys(product) : productNameFamilyKeys(product);
    nameKeys.forEach((nameKey) => {
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
    return [
      {
        id: `${method}:${identity}`,
        method,
        label: candidate.label,
        products: unique,
      },
    ];
  });
}

export function buildProductDuplicateGroups(products: AdminProduct[]): ProductDuplicateGroup[] {
  const groups = [
    ...nameAndUnitGroups(products, "name_and_unit"),
    ...nameAndUnitGroups(products, "name_family_and_unit"),
  ].sort((left, right) => {
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
      acceptedNameGroups.some((accepted) =>
        [...productIds].every((productId) => accepted.has(productId)),
      )
    ) {
      return false;
    }
    seenProductSets.add(signature);
    acceptedNameGroups.push(productIds);
    return true;
  });
}
