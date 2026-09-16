import { parseReceiptMoney, receiptDate, type ReceiptValues } from "./receipts";
export type ReceiptItemDraft = {
  key: string;
  name: string;
  quantity: string;
  unitPrice: string;
  lineTotal: string;
};
export type ReceiptDraft = {
  store: string;
  date: string;
  currency: string;
  total: string;
  tax: string;
  discount: string;
  items: ReceiptItemDraft[];
};
export type ReceiptPhoto = { uri: string; base64: string; mimeType: "image/jpeg" | "image/png" };
export function emptyReceiptItem(key: string): ReceiptItemDraft {
  return { key, name: "", quantity: "1", unitPrice: "", lineTotal: "" };
}
export function receiptDraft(values?: ReceiptValues): ReceiptDraft {
  if (!values)
    return {
      store: "",
      date: receiptDate(),
      currency: "CAD",
      total: "",
      tax: "0.00",
      discount: "0.00",
      items: [emptyReceiptItem("first")],
    };
  return {
    store: values.store_name,
    date: values.purchased_on,
    currency: values.currency,
    total: (values.total_cents / 100).toFixed(2),
    tax: (values.tax_cents / 100).toFixed(2),
    discount: (values.discount_cents / 100).toFixed(2),
    items: values.items.map((item, index) => ({
      key: String(index),
      name: item.name,
      quantity: String(item.quantity),
      unitPrice: item.unitPriceCents === null ? "" : (item.unitPriceCents / 100).toFixed(2),
      lineTotal: (item.lineTotalCents / 100).toFixed(2),
    })),
  };
}
export function receiptDraftValues(draft: ReceiptDraft): ReceiptValues {
  return {
    store_name: draft.store.trim(),
    purchased_on: draft.date.trim(),
    currency: draft.currency,
    total_cents: parseReceiptMoney(draft.total) ?? Number.NaN,
    tax_cents: parseReceiptMoney(draft.tax) ?? Number.NaN,
    discount_cents: parseReceiptMoney(draft.discount) ?? Number.NaN,
    items: draft.items.map((item) => ({
      name: item.name.trim(),
      quantity: /^\d+(\.\d{1,3})?$/.test(item.quantity.trim()) ? Number(item.quantity) : Number.NaN,
      unitPriceCents: item.unitPrice.trim()
        ? (parseReceiptMoney(item.unitPrice) ?? Number.NaN)
        : null,
      lineTotalCents: parseReceiptMoney(item.lineTotal) ?? Number.NaN,
    })),
  };
}
// AI output is untrusted. Missing/invalid fields stay blank for explicit review.
export function extractedReceiptDraft(value: unknown): ReceiptDraft {
  const v = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const text = (x: unknown) => (typeof x === "string" ? x.slice(0, 200) : "");
  const amount = (x: unknown) =>
    typeof x === "number" && Number.isSafeInteger(x) && x >= 0 && x <= 100_000_000
      ? (x / 100).toFixed(2)
      : "";
  const items = Array.isArray(v.items)
    ? v.items.slice(0, 200).map((raw, index) => {
        const item = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
        return {
          key: `read-${index}`,
          name: text(item.name),
          quantity:
            typeof item.quantity === "number" && item.quantity > 0 ? String(item.quantity) : "",
          unitPrice: amount(item.unitPriceCents),
          lineTotal: amount(item.lineTotalCents),
        };
      })
    : [];
  return {
    store: text(v.store_name),
    date: text(v.purchased_on),
    currency: text(v.currency),
    total: amount(v.total_cents),
    tax: amount(v.tax_cents),
    discount: amount(v.discount_cents),
    items: items.length ? items : [emptyReceiptItem("first")],
  };
}
