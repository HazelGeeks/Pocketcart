const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const code = ts.transpileModule(
  fs.readFileSync("supabase/functions/_shared/receiptPhotoCleanup.ts", "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText;
function cleanup(fetch) {
  const exports = {};
  new Function("exports", "fetch", code)(exports, fetch);
  return exports.removeAccountReceiptPhotos("https://db.test", "secret", "owner");
}
test("account deletion removes every photo batch through storage before user deletion", async () => {
  let lists = 0;
  const removed = [];
  await cleanup(async (url, options) => {
    const body = JSON.parse(options.body);
    if (url.includes("/list/")) {
      assert.equal(body.prefix, "owner/");
      assert.equal(body.offset, 0);
      return Response.json(
        ++lists === 1 ? [{ name: "10000000-0000-0000-0000-000000000010.jpg" }] : [],
      );
    }
    removed.push(body.prefixes);
    return Response.json([]);
  });
  assert.equal(lists, 2);
  assert.deepEqual(removed, [["owner/10000000-0000-0000-0000-000000000010.jpg"]]);
});
test("account photo cleanup tolerates a not-yet-created bucket but fails closed on outages", async () => {
  await cleanup(async () => Response.json({ message: "Bucket not found" }, { status: 400 }));
  await assert.rejects(
    cleanup(async () => Response.json({ message: "unavailable" }, { status: 503 })),
    /cleanup failed/,
  );
});
test("account cleanup refuses unexpected paths and a deletion that makes no progress", async () => {
  await assert.rejects(
    cleanup(async () => Response.json([{ name: "../another-account.jpg" }])),
    /needs support/,
  );
  await assert.rejects(
    cleanup(async (url) =>
      Response.json(
        url.includes("/list/") ? [{ name: "10000000-0000-0000-0000-000000000010.jpg" }] : [],
      ),
    ),
    /not completed/,
  );
});
