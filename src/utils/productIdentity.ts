import type { AdminProduct } from "../services/adminBackoffice";
import { isValidGtin, normalizeGtin } from "./productGtin";
import {
  normalizeIdentityPart,
  normalizeLooseIdentityPart,
  normalizeProductUnit,
  productBrandsCompatible,
  productCandidateNames,
  productFamilyName,
} from "./productIdentityNormalization";
import { productNamesAreNear } from "./productIdentitySimilarity";

export { gtinValidationMessage, isValidGtin, normalizeGtin } from "./productGtin";
export { normalizeProductUnit } from "./productIdentityNormalization";

export type ProductIdentityInput = {
  koreanName: string;
  englishName?: string | null;
  unit?: string | null;
  category: string;
};

export type ProductMatchInput = ProductIdentityInput & {
  productId?: string | null;
  brand?: string | null;
  gtin?: string | null;
};

export type ProductAliasCandidate = {
  product_id: string;
  alias_name: string;
  unit?: string | null;
};

type ProductMatchCandidate = {
  id: string;
  korean_name: string;
  english_name?: string | null;
  unit?: string | null;
  category: string;
  brand?: string | null;
  gtin?: string | null;
};

export type ProductMatchMethod =
  | "product_id"
  | "gtin"
  | "alias"
  | "legacy_identity"
  | "canonical_identity";

export type ProductMatchResult<T extends ProductMatchCandidate> =
  | {
      status: "matched";
      product: T;
      method: ProductMatchMethod;
    }
  | {
      status: "ambiguous";
      method: "gtin" | "alias" | "canonical_identity" | "name_family" | "near_identity";
      candidateCount: number;
      candidateIds: string[];
    }
  | {
      status: "not_found";
      explicitIdentifier: boolean;
      reason: "product_id_not_found" | "gtin_not_found" | "no_match";
    };

export function productIdentityKey(product: ProductIdentityInput | ProductMatchCandidate): string {
  const primaryName =
    "koreanName" in product
      ? product.englishName || product.koreanName
      : product.english_name || product.korean_name;
  return [
    normalizeIdentityPart(primaryName),
    normalizeProductUnit(product.unit),
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

function canonicalCandidates<T extends ProductMatchCandidate>(
  products: T[],
  input: ProductMatchInput,
): T[] {
  const inputNames = productCandidateNames(input);
  const inputUnit = normalizeProductUnit(input.unit);
  const inputBrand = normalizeLooseIdentityPart(input.brand);

  return products.filter((product) => {
    if (normalizeProductUnit(product.unit) !== inputUnit) return false;

    const productBrand = normalizeLooseIdentityPart(product.brand);
    if (inputBrand && productBrand && inputBrand !== productBrand) return false;

    const productNames = productCandidateNames(product);
    return [...inputNames].some((name) => productNames.has(name));
  });
}

function nameFamilyCandidates<T extends ProductMatchCandidate>(
  products: T[],
  input: ProductMatchInput,
): T[] {
  const inputNames = new Set(
    [input.englishName, input.koreanName].map(productFamilyName).filter(Boolean),
  );
  const inputUnit = normalizeProductUnit(input.unit);
  return products.filter((product) => {
    if (!inputUnit || normalizeProductUnit(product.unit) !== inputUnit) return false;
    if (!productBrandsCompatible(product.brand, input.brand)) return false;
    const names = [product.english_name, product.korean_name]
      .map(productFamilyName)
      .filter(Boolean);
    return names.some((name) => inputNames.has(name));
  });
}

function aliasCandidates<T extends ProductMatchCandidate>(
  products: T[],
  aliases: ProductAliasCandidate[],
  input: ProductMatchInput,
): T[] {
  const names = productCandidateNames(input);
  const inputUnit = normalizeProductUnit(input.unit);
  const productById = new Map(products.map((product) => [product.id, product]));
  const matches = aliases.flatMap((alias) => {
    if (!names.has(normalizeLooseIdentityPart(alias.alias_name))) return [];
    if (normalizeProductUnit(alias.unit) !== inputUnit) return [];
    const product = productById.get(alias.product_id);
    if (!product || !productBrandsCompatible(product.brand, input.brand)) return [];
    return [product];
  });
  return [...new Map(matches.map((product) => [product.id, product])).values()];
}

function nearIdentityCandidates<T extends ProductMatchCandidate>(
  products: T[],
  input: ProductMatchInput,
): T[] {
  const inputNames = productCandidateNames(input);
  const inputUnit = normalizeProductUnit(input.unit);

  return products.filter((product) => {
    if (!inputUnit || normalizeProductUnit(product.unit) !== inputUnit) {
      return false;
    }
    if (!productBrandsCompatible(product.brand, input.brand)) return false;
    const productNames = productCandidateNames(product);
    return [...inputNames].some((inputName) =>
      [...productNames].some((productName) => productNamesAreNear(inputName, productName)),
    );
  });
}

/**
 * Resolve a CSV row to one existing product without guessing.
 *
 * Stable identifiers win. Text matching is only accepted when it produces one
 * unambiguous candidate; callers should stop and ask for review otherwise.
 */
export function resolveProductMatch<T extends ProductMatchCandidate>(
  products: T[],
  input: ProductMatchInput,
  options?: { aliases?: ProductAliasCandidate[] },
): ProductMatchResult<T> {
  const productId = input.productId?.trim() ?? "";
  if (productId) {
    const product = products.find(
      (candidate) => candidate.id.toLowerCase() === productId.toLowerCase(),
    );
    return product
      ? { status: "matched", product, method: "product_id" }
      : {
          status: "not_found",
          explicitIdentifier: true,
          reason: "product_id_not_found",
        };
  }

  const gtin = isValidGtin(input.gtin) ? normalizeGtin(input.gtin) : "";
  if (gtin) {
    const matches = products.filter(
      (candidate) => isValidGtin(candidate.gtin) && normalizeGtin(candidate.gtin) === gtin,
    );
    if (matches.length === 1) {
      return { status: "matched", product: matches[0], method: "gtin" };
    }
    if (matches.length > 1) {
      return {
        status: "ambiguous",
        method: "gtin",
        candidateCount: matches.length,
        candidateIds: matches.map((candidate) => candidate.id),
      };
    }
  }

  const legacyMatches = products.filter(
    (product) =>
      productBrandsCompatible(product.brand, input.brand) &&
      productIdentityKey(product) === productIdentityKey(input),
  );
  if (legacyMatches.length === 1) {
    return {
      status: "matched",
      product: legacyMatches[0],
      method: "legacy_identity",
    };
  }

  const canonicalMatches = canonicalCandidates(products, input);
  if (canonicalMatches.length === 1) {
    return {
      status: "matched",
      product: canonicalMatches[0],
      method: "canonical_identity",
    };
  }
  if (canonicalMatches.length > 1 || legacyMatches.length > 1) {
    return {
      status: "ambiguous",
      method: "canonical_identity",
      candidateCount: Math.max(canonicalMatches.length, legacyMatches.length),
      candidateIds: (canonicalMatches.length > 0 ? canonicalMatches : legacyMatches).map(
        (candidate) => candidate.id,
      ),
    };
  }

  const aliasMatches = aliasCandidates(products, options?.aliases ?? [], input);
  if (aliasMatches.length === 1) {
    return { status: "matched", product: aliasMatches[0], method: "alias" };
  }
  if (aliasMatches.length > 1) {
    return {
      status: "ambiguous",
      method: "alias",
      candidateCount: aliasMatches.length,
      candidateIds: aliasMatches.map((candidate) => candidate.id),
    };
  }

  const familyMatches = nameFamilyCandidates(products, input);
  const exactIds = new Set(
    [...canonicalMatches, ...legacyMatches].map((candidate) => candidate.id),
  );
  const familyOnlyMatches = familyMatches.filter((candidate) => !exactIds.has(candidate.id));
  if (familyOnlyMatches.length > 0) {
    return {
      status: "ambiguous",
      method: "name_family",
      candidateCount: familyOnlyMatches.length,
      candidateIds: familyOnlyMatches.map((candidate) => candidate.id),
    };
  }

  const nearMatches = nearIdentityCandidates(products, input);
  if (nearMatches.length > 0) {
    return {
      status: "ambiguous",
      method: "near_identity",
      candidateCount: nearMatches.length,
      candidateIds: nearMatches.map((candidate) => candidate.id),
    };
  }

  return {
    status: "not_found",
    explicitIdentifier: Boolean(gtin),
    reason: gtin ? "gtin_not_found" : "no_match",
  };
}
