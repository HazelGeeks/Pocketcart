export type AuthCallbackParams = {
  accessToken: string | null;
  refreshToken: string | null;
  code: string | null;
  error: string | null;
  errorDescription: string | null;
  type: string | null;
  hasAuthParams: boolean;
};

const AUTH_PARAM_KEYS = [
  "access_token",
  "refresh_token",
  "code",
  "error",
  "error_description",
  "type",
];

function appendParams(rawParams: string, target: URLSearchParams) {
  if (!rawParams) return;

  const normalized = rawParams.replace(/^[?#]/, "");
  const queryStart = normalized.indexOf("?");
  const query = queryStart >= 0 ? normalized.slice(queryStart + 1) : normalized;

  for (const [key, value] of new URLSearchParams(query).entries()) {
    target.set(key, value);
  }
}

export function parseAuthCallbackUrl(url: string): AuthCallbackParams {
  const params = new URLSearchParams();
  const queryStart = url.indexOf("?");
  const hashStart = url.indexOf("#");

  if (queryStart >= 0) {
    const queryEnd = hashStart >= 0 ? hashStart : url.length;
    appendParams(url.slice(queryStart + 1, queryEnd), params);
  }

  if (hashStart >= 0) {
    appendParams(url.slice(hashStart + 1), params);
  }

  return {
    accessToken: params.get("access_token"),
    refreshToken: params.get("refresh_token"),
    code: params.get("code"),
    error: params.get("error"),
    errorDescription: params.get("error_description"),
    type: params.get("type"),
    hasAuthParams: AUTH_PARAM_KEYS.some((key) => params.has(key)),
  };
}
