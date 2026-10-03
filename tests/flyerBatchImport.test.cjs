const test = require("node:test");
const assert = require("node:assert/strict");
const { extractFlyerBatch } = require("../.tmp-tests/utils/flyerBatchImport.js");
const { createFlyerRow } = require("../.tmp-tests/state/adminStore.js");
const { normalizeFlyerAiRows } = require("../.tmp-tests/utils/flyerAiRows.js");

const validProduct = { englishName: "Milk", mainCategory: "Dairy", price: "3.99", unit: "1 L" };

test("mixed files run sequentially, preserve successful rows and identify failures and empty files", async () => {
  const files = ["one.pdf", "broken.png", "empty.pdf", "last.jpg"].map((name) => ({ name }));
  const rows = [{ id: "existing", memo: "Keep my edits" }];
  const started = [];
  let active = 0;
  const result = await extractFlyerBatch(files, async (file) => {
    assert.equal(active++, 0);
    await Promise.resolve();
    active--;
    if (file.name === "broken.png") throw new Error("Unreadable file");
    if (file.name === "empty.pdf") return { rows: [] };
    return { rows: [createFlyerRow({ ...validProduct, id: file.name, memo: "Original offer" })], warning: file.name === "last.jpg" ? "Review price" : undefined };
  }, {
    onStart: (file, index) => started.push([file.name, index]),
    onRows: (added) => rows.push(...added),
  });
  assert.deepEqual(started, files.map((file, index) => [file.name, index]));
  assert.deepEqual(rows.map((row) => row.id), ["existing", "one.pdf", "last.jpg"]);
  assert.equal(rows[0].memo, "Keep my edits");
  assert.equal(rows[1].memo, "Source: one.pdf · Original offer");
  assert.equal(result.successCount, 2);
  assert.equal(result.rowCount, 2);
  assert.deepEqual(result.messages, ["broken.png: Unreadable file", "empty.pdf: No product rows found.", "last.jpg: Review price"]);
});

test("uploads deselect rows with Review issues for AI and OCR while keeping valid rows selected", async () => {
  const added = [];
  const inputs = [
    validProduct,
    { ...validProduct, price: "2/$5", memo: "Must buy 2" },
    { ...validProduct, englishName: "" },
    { ...validProduct, mainCategory: "", englishName: "Unclassified item" },
    { ...validProduct, unit: "" },
    { ...validProduct, saleStartDate: "invalid" },
    { ...validProduct, saleStartDate: "2026-10-08", saleEndDate: "2026-10-01" },
    { ...validProduct, selected: false },
  ];
  await extractFlyerBatch([{ name: "ai.pdf" }, { name: "ocr.png" }], async (file) => ({
    rows: file.name === "ai.pdf" ? normalizeFlyerAiRows(inputs) : inputs.map(createFlyerRow),
  }), {
    onStart: () => {},
    onRows: (rows) => added.push(...rows),
  });
  for (const rows of [added.slice(0, inputs.length), added.slice(inputs.length)]) {
    assert.deepEqual(rows.map((row) => row.selected), [true, false, false, false, false, false, false, false]);
    assert.equal(rows[1].price, "2/$5");
    assert.match(rows[1].memo, /Must buy 2/);
  }
});

test("cancelled file selection does no work", async () => {
  const unexpected = () => assert.fail("Must not run");
  assert.deepEqual(await extractFlyerBatch([], unexpected, { onStart: unexpected, onRows: unexpected }), {
    rowCount: 0, successCount: 0, messages: [],
  });
});
