export type ReceiptItem = {
  name: string;
  quantity: number;
  unitPriceCents: number | null;
  lineTotalCents: number;
};
export type ReceiptValues = {
  store_name: string;
  purchased_on: string;
  currency: string;
  total_cents: number;
  tax_cents: number;
  discount_cents: number;
  items: ReceiptItem[];
};
export type Receipt = ReceiptValues & {
  id: string;
  user_id: string;
  photo_path: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};
export type ReceiptPeriod = "day" | "week" | "month";
export const MAX_RECEIPT_CENTS = 100_000_000;
export const RECEIPT_CURRENCIES = ["CAD", "USD", "EUR", "GBP", "AUD"] as const;

// Parse decimal text as integer cents; never silently round a mistyped third decimal.
export function parseReceiptMoney(value: string): number | null {
  const text = value.trim();
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(text)) return null;
  const [whole, fraction = ""] = text.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return cents <= MAX_RECEIPT_CENTS ? cents : null;
}
export function receiptMoney(cents: number, currency: string) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency }).format(cents / 100);
}
export function receiptDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function dateFromKey(key: string) {
  return new Date(`${key}T12:00:00`);
}
export function isReceiptDate(value: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(dateFromKey(value).getTime()) &&
    receiptDate(dateFromKey(value)) === value &&
    value >= "2000-01-01" &&
    value <= "2100-12-31"
  );
}
export function receiptPeriodRange(period: ReceiptPeriod, anchor: string) {
  const start = dateFromKey(anchor);
  if (period === "week") start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  if (period === "month") start.setDate(1);
  const end = new Date(start);
  if (period === "month") end.setMonth(end.getMonth() + 1);
  else end.setDate(end.getDate() + (period === "week" ? 7 : 1));
  return { start: receiptDate(start), end: receiptDate(end) };
}
export function shiftReceiptPeriod(period: ReceiptPeriod, anchor: string, direction: number) {
  const date = dateFromKey(receiptPeriodRange(period, anchor).start);
  if (period === "month") date.setMonth(date.getMonth() + direction);
  else date.setDate(date.getDate() + direction * (period === "week" ? 7 : 1));
  return receiptDate(date);
}
export function receiptPeriodLabel(period: ReceiptPeriod, anchor: string) {
  const { start, end } = receiptPeriodRange(period, anchor);
  const format = (key: string) =>
    dateFromKey(key).toLocaleDateString("en-CA", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  if (period === "month")
    return dateFromKey(start).toLocaleDateString("en-CA", { month: "long", year: "numeric" });
  if (period === "day") return format(start);
  const last = dateFromKey(end);
  last.setDate(last.getDate() - 1);
  return `${format(start)} – ${format(receiptDate(last))}`;
}
export function receiptsForPeriod(receipts: Receipt[], period: ReceiptPeriod, anchor: string) {
  const { start, end } = receiptPeriodRange(period, anchor);
  return receipts.filter((r) => !r.deleted_at && r.purchased_on >= start && r.purchased_on < end);
}
export function receiptTotals(receipts: Receipt[]): Array<{ currency: string; cents: number }> {
  const totals = new Map<string, number>();
  for (const r of receipts)
    if (!r.deleted_at) totals.set(r.currency, (totals.get(r.currency) ?? 0) + r.total_cents);
  return Array.from(totals, ([currency, cents]) => ({ currency, cents })).sort((a, b) =>
    a.currency.localeCompare(b.currency),
  );
}
export function receiptReconciliation(values: ReceiptValues) {
  return (
    values.items.reduce((sum, item) => sum + item.lineTotalCents, 0) +
    values.tax_cents -
    values.discount_cents -
    values.total_cents
  );
}
export function validateReceipt(values: ReceiptValues, today = receiptDate()): string | null {
  const money = (n: number) => Number.isSafeInteger(n) && n >= 0 && n <= MAX_RECEIPT_CENTS;
  if (!values.store_name.trim() || values.store_name.trim().length > 160)
    return "Enter a store name (up to 160 characters).";
  if (!isReceiptDate(values.purchased_on) || values.purchased_on > today)
    return "Enter a valid purchase date, today or earlier (YYYY-MM-DD).";
  if (!(RECEIPT_CURRENCIES as readonly string[]).includes(values.currency))
    return "Choose a supported currency.";
  if (![values.total_cents, values.tax_cents, values.discount_cents].every(money))
    return "Enter valid amounts with up to two decimal places.";
  if (!values.items.length || values.items.length > 200)
    return "Add between 1 and 200 purchased items.";
  for (const item of values.items) {
    if (!item.name.trim() || item.name.trim().length > 200)
      return "Every item needs a name (up to 200 characters).";
    if (
      !Number.isFinite(item.quantity) ||
      item.quantity <= 0 ||
      item.quantity > 10000 ||
      Math.abs(Math.round(item.quantity * 1000) - item.quantity * 1000) > 0.00001
    )
      return "Enter quantities greater than zero with up to three decimal places.";
    if (
      !money(item.lineTotalCents) ||
      (item.unitPriceCents !== null && !money(item.unitPriceCents))
    )
      return "Check each item's unit price and line total.";
  }
  return null;
}
export function isPossibleDuplicate(a: ReceiptValues, b: ReceiptValues) {
  return (
    a.store_name.trim().toLowerCase() === b.store_name.trim().toLowerCase() &&
    a.purchased_on === b.purchased_on &&
    a.currency === b.currency &&
    a.total_cents === b.total_cents
  );
}
