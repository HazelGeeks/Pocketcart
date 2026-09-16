const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const code = ts.transpileModule(fs.readFileSync("supabase/functions/delete-account/index.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function harness({ authenticated = true, apple = true, revokeFails = false, deleteFails = false, cleanupFails = false } = {}) {
  let handler;
  const events = [];
  const client = {
    auth: {
      getUser: async () => ({ data: { user: authenticated ? {
        id: "account", identities: apple ? [{ provider: "apple", identity_data: { sub: "apple-subject" } }] : [],
      } : null }, error: null }),
      admin: { deleteUser: async (id) => {
        events.push(["delete", id]);
        return { error: deleteFails ? { message: "Deletion failed" } : null };
      } },
    },
  };
  new Function("require", "exports", "Deno", code)(
    (name) => name.includes("supabase-js") ? { createClient: () => client } : {
      removeAccountReceiptPhotos: async () => { if (cleanupFails) throw new Error("Storage unavailable"); },
      revokeAppleAuthorization: async (_config, authorizationCode, subject) => {
        events.push(["revoke", authorizationCode, subject]);
        if (revokeFails) throw new Error("Provider unavailable");
      },
    }, {}, { env: { get: () => "configured" }, serve: (fn) => { handler = fn; } },
  );
  return { events, request: (body = {}) => handler(new Request("https://example.com/delete-account", {
    method: "POST", headers: { Authorization: "Bearer session" }, body: JSON.stringify(body),
  })) };
}

test("unauthenticated deletion cannot revoke or delete an account", async () => {
  const h = harness({ authenticated: false });
  assert.equal((await h.request({ appleAuthorizationCode: "code" })).status, 401);
  assert.deepEqual(h.events, []);
});
test("Apple authorization is revoked for the authenticated identity before account deletion", async () => {
  const h = harness();
  const result = await (await h.request({ appleAuthorizationCode: "code" })).json();
  assert.deepEqual(h.events, [["revoke", "code", "apple-subject"], ["delete", "account"]]);
  assert.deepEqual(result, { deleted: true, appleAuthorizationRevoked: true });
});
test("legacy Apple clients without a code retain their right to delete and receive the manual disconnect flag", async () => {
  const h = harness();
  const result = await (await h.request()).json();
  assert.deepEqual(h.events, [["delete", "account"]]);
  assert.deepEqual(result, { deleted: true, appleAuthorizationRevoked: false });
});
test("Apple provider outage does not block deletion or falsely claim revocation", async () => {
  const h = harness({ revokeFails: true });
  const result = await (await h.request({ appleAuthorizationCode: "code" })).json();
  assert.equal(result.deleted, true);
  assert.equal(result.appleAuthorizationRevoked, false);
});
test("email accounts never invoke Apple even if a code is provided", async () => {
  const h = harness({ apple: false });
  const result = await (await h.request({ appleAuthorizationCode: "code" })).json();
  assert.deepEqual(h.events, [["delete", "account"]]);
  assert.equal(result.appleAuthorizationRevoked, null);
});
test("a database deletion failure cannot produce a deleted response", async () => {
  const h = harness({ deleteFails: true });
  const response = await h.request({ appleAuthorizationCode: "code" });
  assert.equal(response.status, 500);
  assert.equal((await response.json()).deleted, undefined);
});

test("receipt cleanup failure keeps the account available for a retry", async () => {
  const h = harness({ cleanupFails: true, apple: false });
  const response = await h.request();
  assert.equal(response.status, 503);
  assert.deepEqual(h.events, []);
});
