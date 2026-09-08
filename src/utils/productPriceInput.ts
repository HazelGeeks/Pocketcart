/** Accept a single advertised amount, never the first number in an offer or size. */
export function normalizeProductPrice(value: string): string | null {
  const text = value.trim();
  const cents = text.match(/^(\d{1,2})\s*¢$/);
  if (cents) return (Number(cents[1]) / 100).toFixed(2);
  const amount = text.match(/^(?:(?:CAD|CA\$|C\$|\$)\s*)?((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?)(?:\s*CAD)?$/i);
  if (!amount) return null;
  const normalized = amount[1].replace(/,/g, "");
  return Number.isFinite(Number(normalized)) ? normalized : null;
}
