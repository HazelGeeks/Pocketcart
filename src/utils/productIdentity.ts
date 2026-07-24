import type { AdminProduct } from "../services/adminBackoffice";

export type ProductIdentityInput = {
  name: string;
  unit?: string | null;
  category: string;
};

export type ProductMatchInput = ProductIdentityInput & {
  productId?: string | null;
  englishName?: string | null;
  brand?: string | null;
  gtin?: string | null;
};

type ProductMatchCandidate = ProductIdentityInput & {
  id: string;
  english_name?: string | null;
  brand?: string | null;
  gtin?: string | null;
};

export type ProductMatchMethod =
  | "product_id"
  | "gtin"
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
      method: "gtin" | "canonical_identity" | "near_identity";
      candidateCount: number;
      candidateIds: string[];
    }
  | {
      status: "not_found";
      explicitIdentifier: boolean;
      reason: "product_id_not_found" | "gtin_not_found" | "no_match";
    };

function normalizeIdentityPart(value: string | null | undefined): string {
  return (value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

function normalizeLooseIdentityPart(value: string | null | undefined): string {
  return normalizeIdentityPart(value)
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

export function normalizeGtin(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

export function isValidGtin(value: string | null | undefined): boolean {
  const source = value?.trim() ?? "";
  if (!source || !/^[\d\s-]+$/.test(source)) return false;
  const gtin = normalizeGtin(source);
  if (![8, 12, 13, 14].includes(gtin.length)) return false;

  const digits = [...gtin].map(Number);
  const checkDigit = digits.pop();
  if (checkDigit === undefined) return false;
  const sum = digits
    .reverse()
    .reduce((total, digit, index) => total + digit * (index % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === checkDigit;
}

export function gtinValidationMessage(value: string | null | undefined): string | null {
  const source = value?.trim() ?? "";
  if (!source) return null;
  if (!/^[\d\s-]+$/.test(source)) {
    return "GTIN can contain only digits, spaces, and hyphens.";
  }
  const gtin = normalizeGtin(source);
  if (![8, 12, 13, 14].includes(gtin.length)) {
    return "GTIN must contain 8, 12, 13, or 14 digits.";
  }
  if (!isValidGtin(source)) {
    return "GTIN check digit is invalid.";
  }
  return null;
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

function candidateNames(product: {
  name: string;
  englishName?: string | null;
  english_name?: string | null;
}): Set<string> {
  return new Set(
    [product.name, product.englishName, product.english_name]
      .map(normalizeLooseIdentityPart)
      .filter(Boolean),
  );
}

function canonicalCandidates<T extends ProductMatchCandidate>(
  products: T[],
  input: ProductMatchInput,
): T[] {
  const inputNames = candidateNames(input);
  const inputUnit = normalizeLooseIdentityPart(input.unit);
  const inputBrand = normalizeLooseIdentityPart(input.brand);

  return products.filter((product) => {
    if (normalizeLooseIdentityPart(product.unit) !== inputUnit) return false;

    const productBrand = normalizeLooseIdentityPart(product.brand);
    if (inputBrand && productBrand && inputBrand !== productBrand) return false;

    const productNames = candidateNames(product);
    return [...inputNames].some((name) => productNames.has(name));
  });
}

function brandsCompatible(
  productBrand: string | null | undefined,
  inputBrand: string | null | undefined,
): boolean {
  const existing = normalizeLooseIdentityPart(productBrand);
  const incoming = normalizeLooseIdentityPart(inputBrand);
  return !existing || !incoming || existing === incoming;
}

function editDistance(left: string, right: string): number {
  if (left === right) return 0;
  if (!left) return right.length;
  if (!right) return left.length;

  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] +
          (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      );
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[right.length];
}

function namesAreNear(left: string, right: string): boolean {
  if (!left || !right || left === right) return false;
  const longest = Math.max(left.length, right.length);
  if (longest < 6) return false;
  if (Math.abs(left.length - right.length) > 2) return false;
  const distance = editDistance(left, right);
  return distance <= 2 && distance / longest <= 0.2;
}

function nearIdentityCandidates<T extends ProductMatchCandidate>(
  products: T[],
  input: ProductMatchInput,
): T[] {
  const inputNames = candidateNames(input);
  const inputUnit = normalizeLooseIdentityPart(input.unit);

  return products.filter((product) => {
    if (!inputUnit || normalizeLooseIdentityPart(product.unit) !== inputUnit) {
      return false;
    }
    if (!brandsCompatible(product.brand, input.brand)) return false;
    const productNames = candidateNames(product);
    return [...inputNames].some((inputName) =>
      [...productNames].some((productName) =>
        namesAreNear(inputName, productName),
      ),
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
      (candidate) =>
        isValidGtin(candidate.gtin) &&
        normalizeGtin(candidate.gtin) === gtin,
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
      brandsCompatible(product.brand, input.brand) &&
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
      candidateIds: (canonicalMatches.length > 0 ? canonicalMatches : legacyMatches)
        .map((candidate) => candidate.id),
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
