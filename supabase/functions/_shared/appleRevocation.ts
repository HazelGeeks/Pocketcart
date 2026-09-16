type AppleConfig = {
  clientId: string;
  teamId: string;
  keyId: string;
  privateKey: string;
};

function base64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function encodeJson(value: unknown): string {
  return base64url(new TextEncoder().encode(JSON.stringify(value)));
}

export async function createAppleClientSecret(config: AppleConfig): Promise<string> {
  if (!config.clientId || !config.teamId || !config.keyId || !config.privateKey) {
    throw new Error("Apple revocation is not configured.");
  }
  const pemBody = config.privateKey.replace(/\\n/g, "\n")
    .replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "");
  const key = await crypto.subtle.importKey(
    "pkcs8",
    Uint8Array.from(atob(pemBody), (character) => character.charCodeAt(0)),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${encodeJson({ alg: "ES256", kid: config.keyId })}.${encodeJson({
    iss: config.teamId,
    iat: now,
    exp: now + 300,
    aud: "https://appleid.apple.com",
    sub: config.clientId,
  })}`;
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(unsigned),
  );
  return `${unsigned}.${base64url(new Uint8Array(signature))}`;
}

// Read only the token returned directly by Apple's HTTPS token endpoint.
// Never call this on a client-supplied identity token.
function appleResponseMatchesUser(token: unknown, subject: string, clientId: string): boolean {
  if (typeof token !== "string") return false;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const encoded = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, "=")));
    return payload.iss === "https://appleid.apple.com" &&
      payload.aud === clientId && payload.sub === subject &&
      typeof payload.exp === "number" && payload.exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

export async function revokeAppleAuthorization(
  config: AppleConfig,
  authorizationCode: string,
  appleSubject: string,
  request: typeof fetch = fetch,
): Promise<void> {
  if (!appleSubject || !authorizationCode || authorizationCode.length > 4096) {
    throw new Error("Apple reauthorization is required.");
  }
  const clientSecret = await createAppleClientSecret(config);
  const response = await request("https://appleid.apple.com/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: clientSecret,
      code: authorizationCode,
      grant_type: "authorization_code",
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error("Apple token exchange failed.");
  const tokens = await response.json();
  if (!appleResponseMatchesUser(tokens.id_token, appleSubject, config.clientId)) {
    throw new Error("Apple account does not match the account being deleted.");
  }
  const refreshToken = typeof tokens.refresh_token === "string" ? tokens.refresh_token : "";
  const accessToken = typeof tokens.access_token === "string" ? tokens.access_token : "";
  if (!refreshToken && !accessToken) throw new Error("Apple did not return a revocable token.");
  const revoked = await request("https://appleid.apple.com/auth/revoke", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: clientSecret,
      token: refreshToken || accessToken,
      token_type_hint: refreshToken ? "refresh_token" : "access_token",
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!revoked.ok) throw new Error("Apple token revocation failed.");
}
