export type SaleSessionInput = {
  validFrom?: string | null;
  validTo?: string | null;
  observedAt: string;
};

export function normalizeSessionDate(value: string | null | undefined): string | null {
  const source = value?.trim();
  if (!source) return null;
  const parsed = new Date(source);
  return Number.isNaN(parsed.getTime()) ? source : parsed.toISOString();
}

export function saleSessionStart(input: SaleSessionInput): string {
  return normalizeSessionDate(input.validFrom) ??
    normalizeSessionDate(input.observedAt) ??
    input.observedAt;
}

export function saleSessionEnd(input: SaleSessionInput): string | null {
  return normalizeSessionDate(input.validTo);
}

export function saleSessionKey(input: SaleSessionInput): string {
  return `${saleSessionStart(input)}\u0000${saleSessionEnd(input) ?? "open"}`;
}

export function saleSessionStartFromKey(key: string): string {
  return key.split("\u0000", 1)[0] ?? key;
}
