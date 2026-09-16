const ORIGIN = "https://pocketcart.hazelgeeks.workers.dev";
// Build 10 and older accept only this origin when pasting an invite. Keep newly
// generated links compatible until the updated native parser is distributed.
const WEB_ORIGINS = new Set([ORIGIN, "https://pocketcart.app", "https://www.pocketcart.app"]);
const TOKEN = /^[a-f0-9]{64}$/;
export function parseFamilyInvite(value: string): string | null {
  const text = value.trim();
  if (TOKEN.test(text)) return text;
  try {
    const url = new URL(text);
    const app = url.protocol === "pocketcart:" && url.hostname === "family";
    const web = WEB_ORIGINS.has(url.origin) && (url.pathname === "/family.html" || url.pathname === "/family");
    if (!app && !web) return null;
    const token = new URLSearchParams(url.hash.slice(1)).get("invite") ?? url.searchParams.get("invite");
    return token && TOKEN.test(token) ? token : null;
  } catch { return null; }
}
export function familyInviteUrl(token: string) {
  if (!TOKEN.test(token)) throw new Error("Invalid family invite");
  return `${ORIGIN}/family#invite=${token}`;
}
