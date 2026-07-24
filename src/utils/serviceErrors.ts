export function isSignInRequiredMessage(
  message: string | null | undefined,
): boolean {
  return message?.trim().toLowerCase() === "please sign in first.";
}
