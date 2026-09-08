import type { AdminStore } from "../services/adminBackoffice";
import { csvHeaderKey } from "./adminValidation";
import { localDatePartsToIso } from "./businessDateTime";

function parseStoreIdCandidate(candidate: string): string | null {
  const trimmed = candidate.trim();
  if (!trimmed) return null;
  return trimmed;
}

function normalizedLookupKey(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase().replace(/[^a-z0-9가-힣]+/g, "");
}

function storeNameKey(value: string): string {
  return normalizedLookupKey(value);
}

export function createProductCsvStoreResolver(stores: AdminStore[]) {
  const storeById = new Map(stores.map((store) => [store.id.trim().toLowerCase(), store.id]));
  return {
    resolveStoreIds(storeIdValue: string, storeNameValue: string, storeBrandValue: string): string[] {
      const directStoreId = parseStoreIdCandidate(storeIdValue);
      if (directStoreId) return [storeById.get(directStoreId.toLowerCase()) ?? directStoreId];

      const brand = normalizedLookupKey(storeBrandValue);
      const eligible = stores.filter((store) => !brand || normalizedLookupKey(store.brand) === brand);
      const find = (name: string) => eligible.filter((store) => {
        const key = storeNameKey(name);
        return storeNameKey(store.name) === key || storeNameKey(`${store.brand ?? ""} - ${store.name}`) === key;
      });
      const name = storeNameValue.trim();
      if (!name) return eligible.filter((store) => brand && store.is_active !== false).map((store) => store.id);

      // Try the actual name first: a real branch name may itself contain an ampersand.
      const exact = find(name);
      if (exact.length === 1) return [exact[0].id];
      if (exact.length > 1) return [];
      const names = name.split(/\s*(?:\||&|;|,)\s*|\s+and\s+/i).filter(Boolean);
      const ids = new Set<string>();
      for (const candidate of names) {
        const matches = find(candidate);
        // Never silently import only some branches or fall back to a different retailer.
        if (matches.length !== 1) return [];
        ids.add(matches[0].id);
      }
      return [...ids];
    },
  };
}

export function productCsvRecordFromRow(headers: string[], values: string[]): Record<string, string> {
  const record: Record<string, string> = {};
  const counts = new Map<string, number>();

  headers.forEach((header, headerIndex) => {
    const key = csvHeaderKey(header);
    const count = counts.get(key) ?? 0;
    counts.set(key, count + 1);

    if (key === "store_brand" && count === 1 && !record.store_name) {
      record.store_name = values[headerIndex] ?? "";
      return;
    }

    if (count === 0) {
      record[key] = values[headerIndex] ?? "";
      return;
    }

    record[`${key}_${count + 1}`] = values[headerIndex] ?? "";
  });

  return record;
}

export function productCsvDateToIso(value: string, endOfDay: boolean): string | null {
  const trimmed = value.trim();
  const dateOnlyMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  const parts = dateOnlyMatch
    ? {
        year: Number(dateOnlyMatch[1]),
        month: Number(dateOnlyMatch[2]),
        day: Number(dateOnlyMatch[3]),
      }
    : slashMatch
      ? {
          year: Number(slashMatch[3]),
          month: Number(slashMatch[1]),
          day: Number(slashMatch[2]),
        }
      : null;

  if (!parts) return null;

  return localDatePartsToIso({ ...parts, endOfDay });
}
