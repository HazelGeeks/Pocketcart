const test = require("node:test");
const assert = require("node:assert/strict");
const { webcrypto } = require("node:crypto");
const { sourceModule } = require("./helpers/sourceModule.cjs");

function controls(env = {}) {
  const calls = [];
  const module = sourceModule(
    "supabase/functions/back-office-flyer/costControl.ts",
    {},
    {
      crypto: webcrypto,
      TextEncoder,
      Uint8Array,
      AbortSignal,
      Deno: {
        env: {
          get: (key) =>
            ({
              SUPABASE_URL: "https://backend.invalid",
              SUPABASE_SERVICE_ROLE_KEY: "server-only",
              ...env,
            })[key],
        },
      },
      fetch: async (url, opts) => {
        calls.push({ url, opts, body: JSON.parse(opts.body) });
        return Response.json({ state: "claimed", claimId: "claim" });
      },
    },
  );
  return { module, calls };
}

test("file content and extraction settings define cache identity, filenames do not", async () => {
  const h = controls(),
    user = "admin";
  const first = await h.module.reserveExtraction(user, new File(["same flyer"], "first.pdf"), {
    model: "gpt-6-luna",
  });
  const duplicate = await h.module.reserveExtraction(
    user,
    new File(["same flyer"], "renamed.pdf"),
    { model: "gpt-6-luna" },
  );
  const changedModel = await h.module.reserveExtraction(
    user,
    new File(["same flyer"], "first.pdf"),
    { model: "other" },
  );
  const changedFile = await h.module.reserveExtraction(
    user,
    new File(["different flyer"], "first.pdf"),
    { model: "gpt-6-luna" },
  );
  assert.match(first.key, /^[a-f0-9]{64}$/);
  assert.equal(first.key, duplicate.key);
  assert.notEqual(first.key, changedModel.key);
  assert.notEqual(first.key, changedFile.key);
  assert.equal(h.calls[0].body.p_user_limit, 120);
  assert.equal(h.calls[0].body.p_global_limit, 300);
  assert.equal(h.calls[0].opts.headers.Authorization, "Bearer server-only");
});

test("invalid quota settings fail before attempting a reservation", async () => {
  for (const value of ["0", "5001", "NaN", "-1", "1.2"]) {
    const h = controls({ FLYER_DAILY_GLOBAL_LIMIT: value });
    await assert.rejects(
      h.module.reserveExtraction("admin", new File(["flyer"], "test.png"), {}),
      /Invalid FLYER_DAILY_GLOBAL_LIMIT/,
    );
    assert.equal(h.calls.length, 0);
  }
});
