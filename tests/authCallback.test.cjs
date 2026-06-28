const test = require("node:test");
const assert = require("node:assert/strict");

const {
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
