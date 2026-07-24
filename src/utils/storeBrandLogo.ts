export type StoreBrandLogoKey =
  | "hMart"
  | "hannamMart"
  | "priceSmart"
  | "marketRibbon"
  | "tAndT";

export function getStoreBrandLogoKey(store: {
  brand?: string | null;
  name: string;
}): StoreBrandLogoKey | null {
  const identity = `${store.brand ?? ""} ${store.name}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  if (/(^|\s)h\s*mart(\s|$)/.test(identity)) return "hMart";
  if (/(^|\s)hannam(?:\s+supermarket|\s+mart)?(\s|$)/.test(identity)) {
    return "hannamMart";
  }
  if (/(^|\s)price\s*smart(\s|$)/.test(identity)) return "priceSmart";
  if (/(^|\s)(?:t\s+t|tnt)(?:\s+supermarket)?(\s|$)/.test(identity)) {
    return "tAndT";
  }
  if (
    /(^|\s)market\s+ribbon(\s|$)/.test(identity) ||
    /(^|\s)ribbon\s+market(\s|$)/.test(identity)
  ) {
    return "marketRibbon";
  }
  return null;
}
