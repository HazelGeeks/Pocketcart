const ORIGIN = "https://pocketcart.hazelgeeks.workers.dev";
const TOKEN = /^[a-f0-9]{64}$/;
export function parseFamilyInvite(value: string): string | null {
  const text = value.trim();
  if (TOKEN.test(text)) return text;
  try {
    const url = new URL(text);
    const app = url.protocol === "pocketcart:" && url.hostname === "family";
    const web = url.origin === ORIGIN && url.pathname === "/family.html";
    if (!app && !web) return null;
    const token = new URLSearchParams(url.hash.slice(1)).get("invite") ?? url.searchParams.get("invite");
    return token && TOKEN.test(token) ? token : null;
  } catch { return null; }
}
export function familyInviteUrl(token: string) {
  if (!TOKEN.test(token)) throw new Error("Invalid family invite");
  return `${ORIGIN}/family.html#invite=${token}`;
}
