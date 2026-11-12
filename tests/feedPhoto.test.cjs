const test = require("node:test");
const assert = require("node:assert/strict");
const { sourceModule } = require("./helpers/sourceModule.cjs");
const id = "12345678-1234-4000-8000-123456789abc";
const path = id + "/" + id + ".jpg";
function handler(rows) {
  let run;
  const calls = [];
  sourceModule(
    "supabase/functions/feed-photo/index.ts",
    {},
    {
      URL,
      Response,
      AbortSignal,
      Deno: {
        env: { get: (k) => (k === "SUPABASE_URL" ? "https://test.invalid" : "test-key") },
        serve: (fn) => {
          run = fn;
        },
      },
      fetch: async (url) => {
        calls.push(url);
        return calls.length === 1
          ? Response.json(rows)
          : new Response(Uint8Array.from([255, 216, 255]), {
              headers: { "X-Upstream-Path": path },
            });
      },
    },
  );
  return { calls, get: () => run(new Request("https://example.test/feed-photo?id=" + id)) };
}
test("anonymous media authorizes by published anonymous post and streams bytes without upstream headers or redirect", async () => {
  const s = handler([{ photo_path: path }]);
  const res = await s.get();
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("content-type"), "image/jpeg");
  assert.equal(res.headers.get("location"), null);
  assert.equal(res.headers.get("x-upstream-path"), null);
  assert.match(s.calls[0], /is_anonymous=is.true/);
  assert.deepEqual(Array.from(new Uint8Array(await res.arrayBuffer())), [255, 216, 255]);
});
test("missing or invalid anonymous media never reaches storage", async () => {
  for (const rows of [[], [{ photo_path: null }], [{ photo_path: "../another-bucket" }]]) {
    const s = handler(rows);
    assert.equal((await s.get()).status, 404);
    assert.equal(s.calls.length, 1);
  }
});
