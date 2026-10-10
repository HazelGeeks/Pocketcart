const test = require("node:test");
const assert = require("node:assert/strict");
const { extractFlyerBatch } = require("../.tmp-tests/utils/flyerBatchImport.js");
const { createFlyerRow } = require("../.tmp-tests/state/adminStore.js");
const { normalizeFlyerAiRows } = require("../.tmp-tests/utils/flyerAiRows.js");

const validProduct = { englishName: "Milk", mainCategory: "Dairy", price: "3.99", unit: "1 L" };

test("quota exhaustion stops the batch before requesting remaining files", async () => {
  let calls = 0;
  const result = await extractFlyerBatch(["one","two","three"].map(name => ({name})), async () => {
    calls++;
    throw Object.assign(new Error("Daily limit reached"), {status:429,usage:null});
  }, { onStart() {}, onRows() {} });
  assert.equal(calls,1);
  assert.equal(result.rowCount,0);
  assert.match(result.messages.join(" "),/2 file\(s\) skipped/);
  assert.equal(result.usage.totalTokens,0);
});

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
    usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0, models: [],
      unknownFiles: 0, reportedFiles: 0, estimatedCostUsd: 0 },
  });
});

test("batch usage includes empty and failed files and identifies missing reports", async () => {
  const usage = { model: "gpt-6-luna", inputTokens: 1000, outputTokens: 200, totalTokens: 1200,
    cachedInputTokens: 400, cacheWriteInputTokens: 200, reasoningTokens: 50, estimatedCostUsd: 0.000169 };
  const result = await extractFlyerBatch(
    ["good", "empty", "failed", "old-server", "ocr"].map((name) => ({ name })),
    async (file) => {
      if (file.name === "failed") throw Object.assign(new Error("Invalid output"), { usage });
      if (file.name === "old-server") return { rows: [] };
      if (file.name === "ocr") return { rows: [], usage: null };
      return { rows: file.name === "good" ? [createFlyerRow(validProduct)] : [], usage };
    }, { onStart: () => {}, onRows: () => {} },
  );
  assert.equal(result.usage.totalTokens, 3600);
  assert.equal(result.usage.reportedFiles, 4);
  assert.equal(result.usage.unknownFiles, 1);
  assert.ok(Math.abs(result.usage.estimatedCostUsd - 0.000507) < 1e-12);
});

test("a 30-file batch processes every file in order without truncating rows", async () => {
  const files = Array.from({ length: 30 }, (_, index) => ({ name: `flyer-${index}.pdf` }));
  const started = [];
  const added = [];
  const result = await extractFlyerBatch(files, async (file) => ({
    rows: [createFlyerRow({ ...validProduct, id: file.name })],
  }), {
    onStart: (file) => started.push(file.name),
    onRows: (rows) => added.push(...rows),
  });
  assert.deepEqual(started, files.map((file) => file.name));
  assert.deepEqual(added.map((row) => row.id), started);
  assert.equal(result.successCount, 30);
  assert.equal(result.rowCount, 30);
  assert.deepEqual(result.messages, []);
});

test("over-limit batches fail before extracting or adding any rows", async () => {
  const unexpected = () => assert.fail("Must not run");
  await assert.rejects(
    extractFlyerBatch(Array.from({ length: 31 }, () => ({ name: "flyer.pdf" })), unexpected, {
      onStart: unexpected, onRows: unexpected,
    }),
    /Select up to 30 images or PDFs/,
  );
});
