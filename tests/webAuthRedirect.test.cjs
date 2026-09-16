const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");

const code = ts.transpileModule(fs.readFileSync("src/services/userProfile.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

for (const [name, browserOrigin, expected] of [
  ["custom-domain web", "https://pocketcart.app", "https://pocketcart.app/"],
  ["legacy web", "https://pocketcart.hazelgeeks.workers.dev", "https://pocketcart.hazelgeeks.workers.dev/"],
  ["native app", null, "pocketcart://auth/callback"],
]) {
  test(`${name} email confirmation and password reset use the correct return destination`, async () => {
    const calls = [];
    const exports = {};
    const supabase = { auth: {
      signUp: async (params) => {
        calls.push(params.options.emailRedirectTo);
        return { data: { user: null, session: null }, error: null };
      },
      resetPasswordForEmail: async (_email, options) => {
        calls.push(options.redirectTo);
        return { error: null };
      },
    } };
    const modules = {
      "./supabaseClient": { hasSupabaseEnv: true, supabase },
      "../utils/authCallback": {},
    };
    new Function("require", "exports", "process", "window", "document", code)(
      (id) => modules[id], exports,
      { env: { EXPO_PUBLIC_AUTH_REDIRECT_URL: "pocketcart://auth/callback" } },
      browserOrigin ? { location: { origin: browserOrigin } } : {},
      browserOrigin ? {} : undefined,
    );
    await exports.signUpUser({ name: "Test", email: "test@example.invalid", password: "test-only" });
    await exports.requestPasswordReset("test@example.invalid");
    assert.deepEqual(calls, [expected, expected]);
  });
}
