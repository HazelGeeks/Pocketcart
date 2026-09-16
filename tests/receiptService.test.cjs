const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const values = {
  store_name: "Market",
  purchased_on: "2026-09-15",
  currency: "CAD",
  total_cents: 100,
  tax_cents: 0,
  discount_cents: 0,
  items: [{ name: "Milk", quantity: 1, unitPriceCents: 100, lineTotalCents: 100 }],
};
const row = {
  ...values,
  id: "receipt",
  user_id: "owner",
  photo_path: null,
  updated_at: "version1",
  created_at: "time",
  deleted_at: null,
};
const photo = {
  uri: "file://test.jpg",
  mimeType: "image/jpeg",
  base64: Buffer.from([255, 216, 255, 1, 2, 3]).toString("base64"),
};
function harness({
  sessionUser = "owner",
  existing = null,
  writeRow = row,
  uploadError = null,
  removeError = null,
} = {}) {
  const calls = [];
  const client = {
    auth: {
      getSession: async () => ({ data: { session: { user: { id: sessionUser } } }, error: null }),
    },
    storage: {
      from: () => ({
        upload: async (path, bytes) => {
          calls.push(["upload", path, Array.from(new Uint8Array(bytes))]);
          return { error: uploadError };
        },
        remove: async (paths) => {
          calls.push(["remove", paths]);
          if (removeError) throw Error("offline");
          return { error: null };
        },
      }),
    },
    from: () => {
      let operation = "read";
      const q = {};
      for (const method of ["select", "eq", "is", "not", "order", "range"])
        q[method] = (...args) => {
          calls.push([method, ...args]);
          return q;
        };
      for (const method of ["insert", "update", "delete"])
        q[method] = (...args) => {
          operation = method;
          calls.push([method, ...args]);
          return q;
        };
      q.maybeSingle = q.single = async () => ({
        data: operation === "read" ? existing : writeRow,
        error: null,
      });
      // biome-ignore lint/suspicious/noThenProperty: models the awaitable Supabase query builder.
      q.then = (resolve, reject) =>
        Promise.resolve({ data: writeRow, error: null }).then(resolve, reject);
      return q;
    },
  };
  const code = ts.transpileModule(fs.readFileSync("src/services/receipts.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  new Function("require", "exports", code)(
    (name) =>
      name === "./supabaseClient"
        ? { supabase: client }
        : name === "../utils/receipts"
          ? require("../.tmp-tests/utils/receipts.js")
          : name === "../utils/paginatedQuery"
            ? {}
            : require(name),
    exports,
  );
  return { service: exports, calls };
}
test("receipt save refuses an account switch before touching storage or rows", async () => {
  const h = harness({ sessionUser: "other" });
  await assert.rejects(
    h.service.saveReceipt({ userId: "owner", id: "receipt", values, photo }),
    /account changed/,
  );
  assert.deepEqual(h.calls, []);
});
test("retrying a committed draft does not upload or insert again", async () => {
  const h = harness({ existing: row });
  assert.deepEqual(
    await h.service.saveReceipt({ userId: "owner", id: "receipt", values, photo }),
    row,
  );
  assert.ok(!h.calls.some((c) => ["upload", "insert", "update"].includes(c[0])));
});
test("retrying with changes after an uncertain save does not falsely confirm those changes", async () => {
  const h = harness({ existing: row });
  await assert.rejects(
    h.service.saveReceipt({
      userId: "owner",
      id: "receipt",
      values: { ...values, total_cents: 200 },
      photo,
    }),
    /already saved/,
  );
});
test("receipt photos upload decoded bytes before the row references them", async () => {
  const h = harness();
  await h.service.saveReceipt({ userId: "owner", id: "receipt", values, photo });
  const upload = h.calls.find((c) => c[0] === "upload");
  assert.deepEqual(upload.slice(1), ["owner/receipt.jpg", [255, 216, 255, 1, 2, 3]]);
  const insert = h.calls.find((c) => c[0] === "insert");
  assert.equal(insert[1].photo_path, "owner/receipt.jpg");
  assert.ok(h.calls.indexOf(upload) < h.calls.indexOf(insert));
});
test("storage failure never creates a receipt falsely claiming a saved photo", async () => {
  const h = harness({ uploadError: { message: "Offline" } });
  await assert.rejects(h.service.saveReceipt({ userId: "owner", id: "receipt", values, photo }));
  assert.ok(!h.calls.some((c) => c[0] === "insert"));
});
test("stale cross-device edits fail instead of overwriting", async () => {
  const h = harness({ writeRow: null });
  await assert.rejects(
    h.service.saveReceipt({ userId: "owner", id: "receipt", values, photo: null, existing: row }),
    /changed on another device/,
  );
  assert.ok(h.calls.some((c) => c[0] === "eq" && c[1] === "updated_at" && c[2] === "version1"));
});
test("storage cleanup failure retains a tombstone for retry and reports the committed logical deletion", async () => {
  const deleted = { ...row, photo_path: "owner/receipt.jpg", deleted_at: "deleted" };
  const h = harness({ writeRow: deleted, removeError: true });
  await h.service.deleteReceipt("owner", { ...row, photo_path: "owner/receipt.jpg" });
  assert.ok(h.calls.some((c) => c[0] === "remove"));
  assert.ok(!h.calls.some((c) => c[0] === "delete"));
});

test("retry comparison ignores PostgreSQL JSONB object key ordering", async () => {
  const stored = {
    ...row,
    items: [{ lineTotalCents: 100, quantity: 1, name: "Milk", unitPriceCents: 100 }],
  };
  const h = harness({ existing: stored });
  assert.deepEqual(
    await h.service.saveReceipt({ userId: "owner", id: "receipt", values, photo }),
    stored,
  );
});
