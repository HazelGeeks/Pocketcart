const test = require("node:test");
const assert = require("node:assert/strict");
const { sourceModule } = require("./helpers/sourceModule.cjs");
const user = "b8166a99-1a1c-4701-a7ed-be273fb29cb2",
  id = "e44a428d-36d1-4315-bdcc-c866ac70869d";
async function call(rows, { storageOK = true, token = true } = {}) {
  let handle;
  const writes = [];
  sourceModule(
    "supabase/functions/delete-feed-post/index.ts",
    {},
    {
      Deno: {
        env: { get: (k) => (k === "SUPABASE_URL" ? "https://test.invalid" : "key") },
        serve: (f) => {
          handle = f;
        },
      },
      Response,
      AbortSignal,
      fetch: async (url, init) => {
        if (url.endsWith("/auth/v1/user")) return Response.json({ id: user });
        if (url.includes("/rest/v1/")) {
          assert.ok(url.includes("id=eq." + id + "&author_id=eq." + user));
          if (!init.method) return Response.json(rows);
        }
        writes.push([url, init]);
        return new Response(null, { status: !storageOK && url.includes("/storage/") ? 503 : 200 });
      },
    },
  );
  const response = await handle(
    new Request("https://test.invalid/", {
      method: "POST",
      headers: token ? { authorization: "Bearer session" } : {},
      body: JSON.stringify({ id, author_id: "ignored" }),
    }),
  );
  return { status: response.status, writes };
}
test("guests and non-owners cannot delete posts or storage objects", async () => {
  assert.equal((await call([], { token: false })).status, 401);
  const other = await call([]);
  assert.equal(other.status, 404);
  assert.equal(other.writes.length, 0);
});
test("an owner removes the attachment before the row, and can retry storage failures", async () => {
  const rows = [{ photo_path: user + "/" + id + ".jpg" }];
  const failed = await call(rows, { storageOK: false });
  assert.equal(failed.status, 503);
  assert.equal(failed.writes.length, 1);
  const ok = await call(rows);
  assert.equal(ok.status, 200);
  assert.equal(ok.writes.length, 2);
  assert.deepEqual(JSON.parse(ok.writes[0][1].body), { prefixes: [rows[0].photo_path] });
  assert.equal(ok.writes[1][1].method, "DELETE");
});
