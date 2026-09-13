const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const { notificationLoadError } = require("../.tmp-tests/utils/notificationForm.js");
const code = ts.transpileModule(fs.readFileSync("src/services/adminNotifications.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
function dashboard(responses) {
  const exported = {};
  new Function("require", "exports", code)(
    (name) =>
      name.includes("notificationForm")
        ? { notificationLoadError }
        : { supabase: { rpc: (name) => responses[name]() } },
    exported,
  );
  return exported.loadNotificationDashboard();
}
test("history failure does not discard a successfully loaded notification audience", async () => {
  const result = await dashboard({
    flyer_notification_audience: async () => ({ data: { users: 3, pushUsers: 1 }, error: null }),
    flyer_notification_history: async () => ({
      data: null,
      error: { message: "History unavailable" },
    }),
  });
  assert.deepEqual(result.audience, { users: 3, pushUsers: 1 });
  assert.equal(result.audienceError, null);
  assert.equal(result.historyError, "History unavailable");
});
test("network rejection produces a finished error state while retaining history", async () => {
  const result = await dashboard({
    flyer_notification_audience: async () => {
      throw new Error("offline");
    },
    flyer_notification_history: async () => ({ data: [{ id: "existing" }], error: null }),
  });
  assert.equal(result.audience, null);
  assert.match(result.audienceError, /Unable to load/);
  assert.equal(result.history[0].id, "existing");
});
test("missing RPC is reported as incomplete setup", async () => {
  const missing = async () => ({
    data: null,
    error: { code: "PGRST202", message: "Could not find function" },
  });
  const result = await dashboard({
    flyer_notification_audience: missing,
    flyer_notification_history: missing,
  });
  assert.match(result.audienceError, /setup is incomplete/);
  assert.match(result.historyError, /setup is incomplete/);
});
