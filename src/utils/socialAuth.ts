const NEW_USER_WINDOW_MS = 10_000;

export function isNewlyCreatedUser(createdAt: string, lastSignInAt?: string): boolean {
  if (!lastSignInAt) return false;

  const created = Date.parse(createdAt);
  const signedIn = Date.parse(lastSignInAt);
  return Number.isFinite(created) && Number.isFinite(signedIn)
    ? Math.abs(signedIn - created) < NEW_USER_WINDOW_MS
    : false;
}
