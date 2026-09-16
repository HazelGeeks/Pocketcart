const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const code = ts.transpileModule(fs.readFileSync("src/hooks/useNativeAccount.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function harness() {
  const state = [];
  let cursor = 0;
  let authOptions;
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in state)) state[index] = initial;
      return [state[index], value => { state[index] = typeof value === "function" ? value(state[index]) : value; }];
    },
    useCallback: fn => fn,
    useEffect() {},
  };
  const modules = {
    react: { default: react },
    "./useBilling": { default: () => ({}) },
    "../services/supabaseClient": { hasSupabaseEnv: true },
    "../services/userProfile": {},
    "./useNativeAccountLinks": { default: () => {} },
    "./useNativeAuthActions": { default: options => { authOptions = options; return {}; } },
    "./useNativeProfileActions": { default: () => ({}) },
    "./useProfilePreferences": { default: () => ({ preferences: {}, loaded: true }) },
  };
  const exports = {};
  new Function("require", "exports", code)(id => {
    if (!modules[id]) throw new Error(`Unexpected import: ${id}`);
    return modules[id];
  }, exports);
  return {
    render() { cursor = 0; return exports.default({ activeTab: "more" }); },
    setSocialBusy(value) { authOptions.setSocialAuthLoading(value); },
  };
}

test("closing authentication returns to the original page and clears credentials", () => {
  const h = harness();
  h.render().setAccountRoute("subscription");
  h.render().openSignIn();
  let account = h.render();
  assert.equal(account.accountRoute, "auth");
  assert.equal(account.displayRoute, "subscription");
  account.setSignInPassword("private-test-value");
  account.setSignUpPassword("private-test-value");
  account.setMoreMessage("An earlier error");
  h.render().closeSubpage();
  account = h.render();
  assert.equal(account.accountRoute, "subscription");
  assert.equal(account.signInPassword, "");
  assert.equal(account.signUpPassword, "");
  assert.equal(account.moreMessage, null);
});

test("switching between sign-in and sign-up keeps the page behind the sheet", () => {
  const h = harness();
  h.render().openSignIn();
  h.render().openSignUp();
  const account = h.render();
  assert.equal(account.authMode, "signUp");
  assert.equal(account.displayRoute, "settings");
  account.closeSubpage();
  assert.equal(h.render().accountRoute, "settings");
});

test("email and social requests cannot be dismissed while pending", () => {
  const h = harness();
  h.render().openSignIn();
  h.render().setMoreLoading(true);
  h.render().closeSubpage();
  assert.equal(h.render().accountRoute, "auth");
  h.render().setMoreLoading(false);
  h.setSocialBusy("apple");
  h.render().closeSubpage();
  assert.equal(h.render().accountRoute, "auth");
  h.setSocialBusy(null);
  h.render().closeSubpage();
  assert.equal(h.render().accountRoute, "settings");
});
