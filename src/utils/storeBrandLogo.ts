export type StoreBrandLogoKey =
  | "hMart"
  | "hannamMart"
  | "priceSmart"
  | "marketRibbon"
  | "tAndT"
  | "saveOnFoods"
  | "walmart";

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
  if (/(^|\s)save\s*on\s*foods(\s|$)/.test(identity)) return "saveOnFoods";
  if (/(^|\s)wal\s*mart(\s|$)/.test(identity)) return "walmart";
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

// Match each asset's background so circular map badges have no empty inset.
const STORE_LOGO_BACKGROUNDS: Partial<Record<StoreBrandLogoKey, string>> = {
  hMart: "#FFFFFF",
  hannamMart: "#C81B1F",
  marketRibbon: "#13594E",
  tAndT: "#007953",
  saveOnFoods: "#78BE20",
  walmart: "#0153E3",
};

export function getStoreLogoBackground(store: {
  brand?: string | null;
  name: string;
}): string | undefined {
  const key = getStoreBrandLogoKey(store);
  return key ? STORE_LOGO_BACKGROUNDS[key] : undefined;
}
