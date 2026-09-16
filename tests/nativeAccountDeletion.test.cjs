const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const code = ts.transpileModule(fs.readFileSync("src/services/nativeSocialAuth.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function harness({ apple = true, available = true, authError = null,
  credentialUser = "apple-subject", sessionThrows = false } = {}) {
  const calls = [];
  const exports = {};
  const modules = {
    "expo-apple-authentication": {
      isAvailableAsync: async () => available,
      signInAsync: async () => {
        calls.push("reauthorize");
        if (authError) throw authError;
        return { user: credentialUser, authorizationCode: "fresh-code" };
      },
    },
    "expo-crypto": {}, "expo-web-browser": {},
    "react-native": { Platform: { OS: "ios" } },
    "./supabaseClient": { supabase: { auth: { getUser: async () => {
      if (sessionThrows) throw new Error("Network failed");
      return { data: { user: { identities: apple
        ? [{ provider: "apple", identity_data: { sub: "apple-subject" } }] : [] } }, error: null };
    } } } },
    "./userProfile": { deleteCurrentUserAccount: async (authorizationCode) => {
      calls.push(["delete", authorizationCode]);
      return { data: null, error: null };
    } },
    "../utils/socialAuth": {},
  };
  new Function("require", "exports", code)((name) => modules[name], exports);
  return { calls, run: exports.deleteNativeUserAccount };
}

test("native Apple deletion passes a fresh code without changing the Supabase session", async () => {
  const h = harness();
  assert.equal((await h.run()).error, null);
  assert.deepEqual(h.calls, ["reauthorize", ["delete", "fresh-code"]]);
});
test("cancelling Apple reauthorization preserves the account", async () => {
  const h = harness({ authError: { code: "ERR_REQUEST_CANCELED" } });
  assert.match((await h.run()).error, /cancelled/);
  assert.deepEqual(h.calls, ["reauthorize"]);
});
test("a different Apple account cannot authorize deletion of the current account", async () => {
  const h = harness({ credentialUser: "another-apple-user" });
  assert.match((await h.run()).error, /linked/);
  assert.deepEqual(h.calls, ["reauthorize"]);
});
test("Apple outage preserves the ability to delete a confirmed account", async () => {
  const h = harness({ authError: new Error("Apple is unavailable") });
  assert.equal((await h.run()).error, null);
  assert.deepEqual(h.calls, ["reauthorize", ["delete", undefined]]);
});
test("email users delete without an Apple prompt", async () => {
  const h = harness({ apple: false });
  assert.equal((await h.run()).error, null);
  assert.deepEqual(h.calls, [["delete", undefined]]);
});
test("an unreadable session gives an error without deleting", async () => {
  const h = harness({ sessionThrows: true });
  assert.match((await h.run()).error, /sign in again/);
  assert.deepEqual(h.calls, []);
});
