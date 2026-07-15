const test = require("node:test");
const assert = require("node:assert/strict");

const {
  classifyAuthCallbackType,
  isAuthCallbackUrl,
  parseAuthCallbackUrl,
} = require("../.tmp-tests/utils/authCallback.js");

test("parseAuthCallbackUrl reads Supabase implicit hash tokens", () => {
  const params = parseAuthCallbackUrl(
    "pocketcart://auth/callback#access_token=access123&refresh_token=refresh456&type=signup",
  );

  assert.equal(params.hasAuthParams, true);
  assert.equal(params.accessToken, "access123");
  assert.equal(params.refreshToken, "refresh456");
  assert.equal(params.type, "signup");
});

test("parseAuthCallbackUrl reads PKCE code query callbacks", () => {
  const params = parseAuthCallbackUrl(
    "pocketcart://auth/callback?code=code123&type=recovery",
  );

  assert.equal(params.hasAuthParams, true);
  assert.equal(params.code, "code123");
  assert.equal(params.type, "recovery");
});

test("parseAuthCallbackUrl reads Supabase callback errors", () => {
  const params = parseAuthCallbackUrl(
    "pocketcart://auth/callback#error=access_denied&error_description=Email+link+is+invalid",
  );

  assert.equal(params.hasAuthParams, true);
  assert.equal(params.error, "access_denied");
  assert.equal(params.errorDescription, "Email link is invalid");
});

test("isAuthCallbackUrl recognizes app callbacks and token/error links only", () => {
  assert.equal(isAuthCallbackUrl("pocketcart://auth/callback?code=abc"), true);
  assert.equal(isAuthCallbackUrl("com.pocketcart.app://auth/callback#access_token=abc"), true);
  assert.equal(isAuthCallbackUrl("https://example.com/finish?access_token=abc"), true);
  assert.equal(isAuthCallbackUrl("https://example.com/finish?error=denied"), true);
  assert.equal(isAuthCallbackUrl("pocketcart://product/123"), false);
  assert.equal(isAuthCallbackUrl("https://example.com/?code=ordinary-code"), false);
});

test("classifyAuthCallbackType routes recovery and verification flows", () => {
  assert.equal(classifyAuthCallbackType("recovery"), "passwordRecovery");
  assert.equal(classifyAuthCallbackType("signup"), "emailVerification");
  assert.equal(classifyAuthCallbackType("email_change"), "emailVerification");
  assert.equal(classifyAuthCallbackType("magiclink"), "signIn");
  assert.equal(classifyAuthCallbackType(null), "signIn");
});
