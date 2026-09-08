const test = require("node:test");
const assert = require("node:assert/strict");
const { extractFlyerBatch } = require("../.tmp-tests/utils/flyerBatchImport.js");

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
    return { rows: [{ id: file.name, memo: "Original offer" }], warning: file.name === "last.jpg" ? "Review price" : undefined };
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

test("cancelled file selection does no work", async () => {
  const unexpected = () => assert.fail("Must not run");
  assert.deepEqual(await extractFlyerBatch([], unexpected, { onStart: unexpected, onRows: unexpected }), {
    rowCount: 0, successCount: 0, messages: [],
  });
});
