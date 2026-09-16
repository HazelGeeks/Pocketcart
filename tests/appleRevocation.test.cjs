const test = require("node:test");
const assert = require("node:assert/strict");
const { generateKeyPairSync, verify } = require("node:crypto");
const { createAppleClientSecret, revokeAppleAuthorization } =
  require("../.tmp-tests/supabase/functions/_shared/appleRevocation.js");
const { privateKey, publicKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
const config = {
  clientId: "com.pocketcart.app", teamId: "test-team", keyId: "test-key",
  privateKey: privateKey.export({ format: "pem", type: "pkcs8" }),
};
const token = (overrides = {}) => `header.${Buffer.from(JSON.stringify({
  iss: "https://appleid.apple.com", aud: config.clientId, sub: "apple-user",
  exp: Math.floor(Date.now() / 1000) + 60, ...overrides,
})).toString("base64url")}.signature`;

test("Apple client secret is a verifiable ES256 JWT restricted to the app and five minutes", async () => {
  const parts = (await createAppleClientSecret(config)).split(".");
  const header = JSON.parse(Buffer.from(parts[0], "base64url"));
  const payload = JSON.parse(Buffer.from(parts[1], "base64url"));
  assert.equal(header.alg, "ES256");
  assert.equal(header.kid, config.keyId);
  assert.equal(payload.sub, config.clientId);
  assert.equal(payload.iss, config.teamId);
  assert.equal(payload.aud, "https://appleid.apple.com");
  assert.equal(payload.exp - payload.iat, 300);
  assert.equal(verify("sha256", Buffer.from(parts.slice(0, 2).join(".")),
    { key: publicKey, dsaEncoding: "ieee-p1363" }, Buffer.from(parts[2], "base64url")), true);
});

test("Apple exchanges the fresh code then revokes the returned refresh token", async () => {
  const calls = [];
  await revokeAppleAuthorization(config, "fresh-code", "apple-user", async (url, init) => {
    calls.push({ url, body: new URLSearchParams(init.body) });
    return calls.length === 1
      ? Response.json({ id_token: token(), refresh_token: "refresh", access_token: "access" })
      : new Response(null, { status: 200 });
  });
  assert.equal(calls[0].url, "https://appleid.apple.com/auth/token");
  assert.equal(calls[0].body.get("code"), "fresh-code");
  assert.equal(calls[0].body.get("grant_type"), "authorization_code");
  assert.equal(calls[1].url, "https://appleid.apple.com/auth/revoke");
  assert.equal(calls[1].body.get("token"), "refresh");
  assert.equal(calls[1].body.get("token_type_hint"), "refresh_token");
});

for (const wrongClaim of [{ sub: "another-user" }, { aud: "another-app" },
  { iss: "https://example.com" }, { exp: 1 }]) {
  test(`Apple refuses revocation when provider claims do not match: ${JSON.stringify(wrongClaim)}`, async () => {
    let calls = 0;
    await assert.rejects(revokeAppleAuthorization(config, "code", "apple-user", async () => {
      calls++;
      return Response.json({ id_token: token(wrongClaim), refresh_token: "never-revoke" });
    }), /does not match/);
    assert.equal(calls, 1);
  });
}

test("Apple can revoke an access token when no refresh token is returned", async () => {
  let calls = 0;
  await revokeAppleAuthorization(config, "code", "apple-user", async (_url, init) => {
    if (++calls === 1) return Response.json({ id_token: token(), access_token: "access" });
    const body = new URLSearchParams(init.body);
    assert.equal(body.get("token_type_hint"), "access_token");
    assert.equal(body.get("token"), "access");
    return new Response(null, { status: 200 });
  });
});

test("Apple exchange and revocation failures are not reported as success", async () => {
  await assert.rejects(revokeAppleAuthorization(config, "code", "apple-user",
    async () => new Response(null, { status: 400 })), /exchange failed/);
  let calls = 0;
  await assert.rejects(revokeAppleAuthorization(config, "code", "apple-user", async () =>
    ++calls === 1 ? Response.json({ id_token: token(), refresh_token: "refresh" })
      : new Response(null, { status: 500 })), /revocation failed/);
});

test("Apple missing configuration and authorization fail before any network request", async () => {
  let calls = 0;
  const request = async () => { calls++; return Response.json({}); };
  await assert.rejects(revokeAppleAuthorization({ ...config, privateKey: "" }, "code", "user", request), /not configured/);
  await assert.rejects(revokeAppleAuthorization(config, "", "user", request), /reauthorization/);
  assert.equal(calls, 0);
});
