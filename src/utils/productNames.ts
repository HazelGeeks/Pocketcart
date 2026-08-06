export type ProductNameFields = {
  english_name?: string | null;
  korean_name?: string | null;
};

function cleanName(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

/** English is the customer-facing product name; Korean is the fallback. */
export function productDisplayName(product: ProductNameFields): string {
  return cleanName(product.english_name) || cleanName(product.korean_name) || "Unnamed product";
}

/** Show Korean as supporting copy only when it adds information. */
export function productSecondaryName(product: ProductNameFields): string | null {
  const primary = productDisplayName(product);
  const koreanName = cleanName(product.korean_name);
  if (!koreanName || koreanName.localeCompare(primary, undefined, { sensitivity: "base" }) === 0) {
    return null;
  }
  return koreanName;
}

export function productNameSearchText(product: ProductNameFields): string {
  return [cleanName(product.english_name), cleanName(product.korean_name)]
    .filter(Boolean)
    .join(" ");
}
