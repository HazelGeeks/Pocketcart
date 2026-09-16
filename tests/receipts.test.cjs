const test = require("node:test");
const assert = require("node:assert/strict");
const r = require("../.tmp-tests/utils/receipts.js");
const d = require("../.tmp-tests/utils/receiptDraft.js");
const values = {
  store_name: "Market",
  purchased_on: "2026-09-15",
  currency: "CAD",
  total_cents: 1130,
  tax_cents: 130,
  discount_cents: 0,
  items: [{ name: "Milk", quantity: 2, unitPriceCents: 500, lineTotalCents: 1000 }],
};
const receipt = (patch = {}) => ({
  ...values,
  id: "1",
  user_id: "a",
  photo_path: null,
  created_at: "",
  updated_at: "",
  deleted_at: null,
  ...patch,
});
test("receipt money uses exact cents and rejects ambiguous/invalid amounts", () => {
  for (const [input, expected] of [
    ["0.10", 10],
    ["1.01", 101],
    ["999999.99", 99999999],
    ["0", 0],
    ["1.5", 150],
  ])
    assert.equal(r.parseReceiptMoney(input), expected);
  for (const input of ["", "1,200.00", "-1", "1.001", "1e3", "NaN", "Infinity", "1000000.01"])
    assert.equal(r.parseReceiptMoney(input), null, input);
});
test("calendar ranges cover Monday weeks, leap days and year boundaries", () => {
  assert.deepEqual(r.receiptPeriodRange("week", "2026-01-01"), {
    start: "2025-12-29",
    end: "2026-01-05",
  });
  assert.deepEqual(r.receiptPeriodRange("week", "2026-09-20"), {
    start: "2026-09-14",
    end: "2026-09-21",
  });
  assert.deepEqual(r.receiptPeriodRange("month", "2024-02-29"), {
    start: "2024-02-01",
    end: "2024-03-01",
  });
  assert.equal(r.shiftReceiptPeriod("month", "2026-01-31", 1), "2026-02-01");
  assert.equal(r.shiftReceiptPeriod("day", "2024-03-01", -1), "2024-02-29");
  assert.equal(r.isReceiptDate("2026-02-29"), false);
  assert.equal(r.isReceiptDate("2024-02-29"), true);
  assert.equal(r.isReceiptDate("2026-13-01"), false);
});
test("DST changes do not move receipt dates or week boundaries", () => {
  const old = process.env.TZ;
  process.env.TZ = "America/Vancouver";
  try {
    assert.deepEqual(r.receiptPeriodRange("day", "2026-03-08"), {
      start: "2026-03-08",
      end: "2026-03-09",
    });
    assert.deepEqual(r.receiptPeriodRange("week", "2026-11-01"), {
      start: "2026-10-26",
      end: "2026-11-02",
    });
    assert.equal(r.receiptDate(new Date("2026-09-16T06:59:00Z")), "2026-09-15");
  } finally {
    if (old === undefined) delete process.env.TZ;
    else process.env.TZ = old;
  }
});
test("period totals use purchase date and total paid, separating currencies and deleted rows", () => {
  const rows = [
    receipt(),
    receipt({ id: "2", purchased_on: "2026-09-16", currency: "USD", total_cents: 888 }),
    receipt({ id: "3", deleted_at: "deleted" }),
    receipt({ id: "4", purchased_on: "2026-09-21" }),
  ];
  const week = r.receiptsForPeriod(rows, "week", "2026-09-15");
  assert.deepEqual(
    week.map((x) => x.id),
    ["1", "2"],
  );
  assert.deepEqual(r.receiptTotals(week), [
    { currency: "CAD", cents: 1130 },
    { currency: "USD", cents: 888 },
  ]);
  assert.equal(
    r.receiptTotals([receipt({ total_cents: 10 }), receipt({ total_cents: 20 })])[0].cents,
    30,
  );
});
test("receipt validation and reconciliation allow weighted items and item discounts without changing paid total", () => {
  assert.equal(r.validateReceipt(values, "2026-09-15"), null);
  assert.equal(r.receiptReconciliation(values), 0);
  assert.equal(r.receiptReconciliation({ ...values, total_cents: 1129 }), 1);
  const weighted = {
    ...values,
    items: [{ name: "Apples, kg", quantity: 0.725, unitPriceCents: null, lineTotalCents: 999 }],
  };
  assert.equal(r.validateReceipt(weighted, "2026-09-15"), null);
  for (const patch of [
    { purchased_on: "2026-09-16" },
    { purchased_on: "2026-02-30" },
    { currency: "" },
    { total_cents: NaN },
    { items: [] },
    { items: [{ ...values.items[0], quantity: 0 }] },
    { items: [{ ...values.items[0], lineTotalCents: 5.001 }] },
  ])
    assert.ok(r.validateReceipt({ ...values, ...patch }, "2026-09-15"));
});
test("AI output never converts unreadable values into zero or guesses a date/currency", () => {
  const draft = d.extractedReceiptDraft({
    store_name: "Market",
    total_cents: null,
    items: [{ name: "Milk", quantity: null, unitPriceCents: null, lineTotalCents: -5 }],
  });
  assert.equal(draft.date, "");
  assert.equal(draft.currency, "");
  assert.equal(draft.total, "");
  assert.equal(draft.tax, "");
  assert.equal(draft.items[0].quantity, "");
  assert.equal(draft.items[0].lineTotal, "");
  assert.ok(r.validateReceipt(d.receiptDraftValues(draft)));
  assert.deepEqual(d.receiptDraftValues(d.receiptDraft(values)), values);
});
test("duplicate warning requires store, purchase date, currency and paid total match", () => {
  assert.equal(r.isPossibleDuplicate(values, { ...values, store_name: "  MARKET  " }), true);
  assert.equal(r.isPossibleDuplicate(values, { ...values, currency: "USD" }), false);
  assert.equal(r.isPossibleDuplicate(values, { ...values, total_cents: 1131 }), false);
});

test("Scan has an Account back destination and Receipts remains a root tab", () => {
  const { hasNativeBackDestination } = require("../.tmp-tests/utils/nativeBackNavigation.js");
  const { TABS } = require("../.tmp-tests/screens/nativeAppData.js");
  assert.equal(hasNativeBackDestination("scan", "catalog", "settings"), true);
  assert.equal(hasNativeBackDestination("receipts", "catalog", "settings"), false);
  assert.deepEqual(TABS.map(tab => tab.id), ["home", "shopping", "freezer", "receipts", "more"]);
});
