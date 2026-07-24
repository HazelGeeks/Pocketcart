export type PushRegistrationState = {
  granted: boolean;
  registered: boolean;
  token: string | null;
};

export function isPushRegistrationReady(
  result: PushRegistrationState,
): boolean {
  return result.granted && result.registered && Boolean(result.token?.trim());
}
