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

function storeIdentityKey(params: { brand?: string | null; name: string }): string {
  return `${normalizedLookupKey(params.brand)}|${storeNameKey(params.name)}`;
}

export function createProductCsvStoreResolver(stores: AdminStore[]) {
  const storeById = new Map(stores.map((store) => [store.id.trim().toLowerCase(), store.id]));
  const storeIdByName = new Map<string, string>();
  const storeIdByIdentity = new Map<string, string>();

  stores.forEach((store) => {
    storeIdByName.set(storeNameKey(store.name), store.id);
    storeIdByIdentity.set(storeIdentityKey(store), store.id);
    if (store.brand?.trim()) {
      storeIdByName.set(storeNameKey(`${store.brand.trim()} - ${store.name.trim()}`), store.id);
    }
  });

  return {
    resolveStoreIds(storeIdValue: string, storeNameValue: string, storeBrandValue: string): string[] {
      const directStoreId = parseStoreIdCandidate(storeIdValue);
      if (directStoreId) {
        return [storeById.get(directStoreId.toLowerCase()) ?? directStoreId];
      }

      const ids: string[] = [];
      const seen = new Set<string>();
      const candidates = storeNameValue
        .split("|")
        .map((value) => storeNameKey(value))
        .filter(Boolean);

      for (const candidate of candidates) {
        const identityMatch = storeIdByIdentity.get(storeIdentityKey({ brand: storeBrandValue, name: candidate }));
        const match = identityMatch ?? storeIdByName.get(candidate);
        if (!match || seen.has(match)) continue;
        ids.push(match);
        seen.add(match);
      }

      return ids;
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
