export type SaleAlertSessionSource = {
  validFrom?: string | null;
  validTo?: string | null;
  observedAt: string;
};

export type CanonicalSaleAlertIdentity = {
  alertKey: string;
  saleStartedAt: string;
  saleEndsAt: string | null;
};

function normalizedTimestamp(value: string | null | undefined): string | null {
  const source = value?.trim();
  if (!source) return null;
  const parsed = new Date(source);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function buildCanonicalSaleAlertIdentity(params: {
  productId: string;
  storeId: string | null;
  session: SaleAlertSessionSource;
}): CanonicalSaleAlertIdentity | null {
  const saleStartedAt = normalizedTimestamp(params.session.validFrom) ??
    normalizedTimestamp(params.session.observedAt);
  if (!saleStartedAt) return null;

  const saleEndsAt = normalizedTimestamp(params.session.validTo);
  const sessionKey = `${saleStartedAt}..${saleEndsAt ?? "open"}`.toLowerCase();
  return {
    alertKey: [params.productId, sessionKey, params.storeId ?? "any-store"].join("|"),
    saleStartedAt,
    saleEndsAt,
  };
}
