type ProductNames = {
  koreanName?: string | null;
  korean_name?: string | null;
  englishName?: string | null;
  english_name?: string | null;
};

export function normalizeIdentityPart(value: string | null | undefined): string {
  return (value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

export function normalizeLooseIdentityPart(value: string | null | undefined): string {
  return normalizeIdentityPart(value)
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

export function normalizeProductUnit(value: string | null | undefined): string {
  const compact = normalizeLooseIdentityPart(value);
  const units: Record<string, string> = {
    lb: "lb",
    lbs: "lb",
    perlb: "lb",
    pound: "lb",
    pounds: "lb",
    kg: "kg",
    kgs: "kg",
    perkg: "kg",
    kilogram: "kg",
    kilograms: "kg",
    g: "g",
    gram: "g",
    grams: "g",
    perg: "g",
    l: "l",
    litre: "l",
    litres: "l",
    liter: "l",
    liters: "l",
    perl: "l",
    ml: "ml",
    millilitre: "ml",
    millilitres: "ml",
    milliliter: "ml",
    milliliters: "ml",
    perml: "ml",
    ea: "ea",
    each: "ea",
    perea: "ea",
    pereach: "ea",
  };
  return units[compact] ?? compact;
}

export function productCandidateNames(product: ProductNames): Set<string> {
  return new Set(
    [product.englishName, product.english_name, product.koreanName, product.korean_name]
      .map(normalizeLooseIdentityPart)
      .filter(Boolean),
  );
}

export function productFamilyName(value: string | null | undefined): string {
  return normalizeLooseIdentityPart(
    (value ?? "").replace(
      /\((?:from|grown in|product of|imported from|locally grown)[^)]*\)/giu,
      "",
    ),
  );
}

export function productBrandsCompatible(
  existingBrand: string | null | undefined,
  incomingBrand: string | null | undefined,
): boolean {
  const existing = normalizeLooseIdentityPart(existingBrand);
  const incoming = normalizeLooseIdentityPart(incomingBrand);
  return !existing || !incoming || existing === incoming;
}
