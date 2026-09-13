const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const source = fs.readFileSync("supabase/functions/admin-flyer-notification/index.ts", "utf8");
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
function harness({
  user = true,
  admin = true,
  accessError = null,
  rows = [],
  tokenError = null,
  deliveryError = null,
} = {}) {
  let handler;
  const updates = [];
  let claims = 0;
  let deliveries = 0;
  const client = {
    auth: { getUser: async () => ({ data: { user: user ? { id: "admin" } : null }, error: null }) },
    rpc: async (name) =>
      name === "is_admin"
        ? { data: admin, error: accessError }
        : (claims++, { data: rows, error: null }),
    from: (table) => {
      let mutation;
      const q = {
        select: () => q,
        eq: () => q,
        order: () => q,
        range: () => q,
        update: (value) => {
          mutation = value;
          return q;
        },
        single: async () => ({
          data: { id: "alert", user_id: "user", title: "Flyer", body: "Deals" },
          error: null,
        }),
        // biome-ignore lint/suspicious/noThenProperty: Supabase query builders are intentionally thenable.
        then: (resolve) =>
          Promise.resolve(
            table === "user_push_tokens"
              ? {
                  data: [{ id: "token", user_id: "user", token: "ExpoPushToken[test]" }],
                  error: tokenError,
                }
              : (updates.push(mutation), { data: null, error: null }),
          ).then(resolve),
      };
      return q;
    },
  };
  const requireMock = (name) =>
    name.includes("supabase-js")
      ? { createClient: () => client }
      : {
          deliverPushAlerts: async () => {
            deliveries++;
            if (deliveryError) throw new Error(deliveryError);
            return { sent: 1, failed: 0 };
          },
        };
  new Function("require", "exports", "Deno", code)(
    requireMock,
    {},
    {
      env: { get: () => "configured" },
      serve: (fn) => {
        handler = fn;
      },
    },
  );
  return {
    request: (body) =>
      handler(
        new Request("https://example.com", {
          method: "POST",
          headers: { Authorization: "Bearer test" },
          body: JSON.stringify(body ?? { campaignId: "11111111-1111-1111-1111-111111111111" }),
        }),
      ),
    updates,
    get claims() {
      return claims;
    },
    get deliveries() {
      return deliveries;
    },
  };
}
test("broadcast worker rejects unauthenticated users before claiming or delivering", async () => {
  const h = harness({ user: false });
  assert.equal((await h.request()).status, 401);
  assert.equal(h.claims, 0);
  assert.equal(h.deliveries, 0);
});
for (const admin of [false, null, "true"])
  test(`broadcast worker fails closed for admin result ${admin}`, async () => {
    const h = harness({ admin });
    assert.equal((await h.request()).status, 403);
    assert.equal(h.claims, 0);
  });
test("broadcast worker rejects an admin lookup failure", async () => {
  const h = harness({ accessError: { message: "offline" } });
  assert.equal((await h.request()).status, 403);
  assert.equal(h.claims, 0);
});
test("broadcast worker rejects invalid campaign input", async () => {
  const h = harness();
  assert.equal((await h.request({ campaignId: "invalid" })).status, 400);
  assert.equal(h.claims, 0);
});
test("broadcast worker records Expo acceptance without claiming device delivery", async () => {
  const h = harness({ rows: [{ user_id: "user", alert_id: "alert" }] });
  assert.equal((await h.request()).status, 200);
  assert.equal(h.deliveries, 1);
  assert.deepEqual(h.updates, [{ status: "accepted", accepted: 1, failed: 0 }]);
});
test("broadcast worker records an uncertain send without retrying the push", async () => {
  const h = harness({
    rows: [{ user_id: "user", alert_id: "alert" }],
    deliveryError: "Receipt write failed",
  });
  assert.equal((await h.request()).status, 200);
  assert.equal(h.deliveries, 1);
  assert.equal(h.updates[0].error, "Receipt write failed");
  assert.equal(h.updates[0].status, "failed");
});
test("broadcast worker does not send when token lookup fails", async () => {
  const h = harness({
    rows: [{ user_id: "user", alert_id: "alert" }],
    tokenError: { message: "Token lookup failed" },
  });
  assert.equal((await h.request()).status, 200);
  assert.equal(h.deliveries, 0);
  assert.equal(h.updates[0].error, "Token lookup failed");
});
