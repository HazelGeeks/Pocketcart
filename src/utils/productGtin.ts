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
