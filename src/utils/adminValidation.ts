export type StoreImportStatus = "ready" | "duplicate" | "invalid";

export type StoreImportPreviewInput = {
  id?: string;
  brand?: string | null;
  name: string;
  area?: string;
};

export type StoreImportPreviewRow = {
  rowNumber: number;
  brand: string;
  name: string;
  area?: string;
  latitude: string;
  longitude: string;
  priceNote: string;
  address: string;
  placeId: string;
  phone: string;
  website: string;
  hours: string;
  storeType: string;
  isActive: boolean;
  status: StoreImportStatus;
  reason: string;
};

const STORE_IMPORT_HEADERS = {
  brand: ["brand", "store_brand", "브랜드"],
  name: ["name", "store_name", "마트명", "매장명", "스토어"],
  area: ["area", "region", "지역", "지역/지점", "지점"],
  latitude: ["latitude", "lat", "위도"],
  longitude: ["longitude", "lng", "lon", "경도"],
  priceNote: ["price_note", "note", "memo", "메모"],
  address: ["address", "주소"],
  placeId: ["place_id", "placeid", "google_place_id", "google_place", "장소id"],
  phone: ["phone", "tel", "telephone", "전화", "전화번호"],
  website: ["website", "url", "site", "웹사이트"],
  hours: ["hours", "business_hours", "운영시간", "영업시간"],
  storeType: ["store_type", "type", "타입", "매장타입"],
  isActive: ["is_active", "active", "status", "활성", "상태"],
};

export function isDateOnly(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
}

export function dateOnlyToIso(value: string, endOfDay: boolean): string | null {
  if (!isDateOnly(value)) return null;
  const [yearText, monthText, dayText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = endOfDay
    ? new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999))
    : new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  if (Number.isNaN(date.getTime())) return null;
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date.toISOString();
}

export function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (quoted) {
      if (char === "\"" && next === "\"") {
        cell += "\"";
        index += 1;
      } else if (char === "\"") {
        quoted = false;
      } else {
        cell += char;
      }
      continue;
    }

    if (char === "\"") {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some((value) => value.trim())) {
    rows.push(row);
  }

  return rows;
}

export function csvHeaderKey(value: string): string {
  return value.trim().replace(/^\uFEFF/, "").toLowerCase().replace(/\s+/g, "_");
}

export function csvRowValue(row: Record<string, string>, aliases: string[]): string {
  for (const alias of aliases) {
    const value = row[csvHeaderKey(alias)]?.trim();
    if (value) return value;
  }
  return "";
}

export function parseStoreActive(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (["false", "0", "no", "inactive", "disabled", "비활성"].includes(normalized)) return false;
  return true;
}

export function coordinateValidationMessage(latitude: string, longitude: string): string | null {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return "Latitude and longitude must be valid numbers.";
  if (lat < -90 || lat > 90) return "Latitude must be between -90 and 90.";
  if (lng < -180 || lng > 180) return "Longitude must be between -180 and 180.";
  return null;
}

export function validateProductInput(params: {
  name: string;
  category: string;
}): string | null {
  if (!params.name.trim() || !params.category.trim()) {
    return "Product name and category are required.";
  }
  return null;
}

export function validateStoreInput(
  params: {
    brand?: string;
    name: string;
    latitude: string;
    longitude: string;
  },
  existingStores: StoreImportPreviewInput[] = [],
  editingStoreId?: string | null,
): string | null {
  const name = params.name.trim();
  if (!name || !params.latitude.trim() || !params.longitude.trim()) {
    return "Branch name, latitude, and longitude are required.";
  }
  const coordinateError = coordinateValidationMessage(params.latitude, params.longitude);
  if (coordinateError) return coordinateError;

  const duplicate = existingStores.find((store) => {
    if (editingStoreId && "id" in store && store.id === editingStoreId) return false;
    const existingBrand = store.brand?.trim().toLowerCase() ?? "";
    const inputBrand = "brand" in params && typeof params.brand === "string"
      ? params.brand.trim().toLowerCase()
      : "";
    return existingBrand === inputBrand &&
      store.name.trim().toLowerCase() === name.toLowerCase();
  });
  if (duplicate) return "A store with the same brand and branch already exists.";
  return null;
}

export function validatePriceEntryInput(params: {
  productId: string;
  storeId: string;
  price: string;
  validFrom?: string;
  validTo?: string;
}): string | null {
  if (!params.productId.trim() || !params.storeId.trim() || !params.price.trim()) {
    return "Product, store, and price are required.";
  }
  const price = Number(params.price);
  if (!Number.isFinite(price) || price < 0) return "Price must be a valid non-negative number.";
  if (!params.validFrom?.trim() || !params.validTo?.trim()) {
    return "Sale period start and end dates are required.";
  }
  if (params.validFrom && !dateOnlyToIso(params.validFrom, false)) return "Valid from must be a valid date.";
  if (params.validTo && !dateOnlyToIso(params.validTo, true)) return "Valid to must be a valid date.";
  return null;
}

export function buildStoreImportPreview(
  headerRow: string[],
  dataRows: string[][],
  stores: StoreImportPreviewInput[],
): StoreImportPreviewRow[] {
  const headers = headerRow.map(csvHeaderKey);
  const existing = new Set(
    stores.map((store) => `${store.brand?.trim().toLowerCase() ?? ""}|${store.name.trim().toLowerCase()}`),
  );

  return dataRows.map((values, index) => {
    const record: Record<string, string> = {};
    headers.forEach((header, headerIndex) => {
      record[header] = values[headerIndex] ?? "";
    });

    const brand = csvRowValue(record, STORE_IMPORT_HEADERS.brand);
    const name = csvRowValue(record, STORE_IMPORT_HEADERS.name);
    const area = csvRowValue(record, STORE_IMPORT_HEADERS.area);
    const latitude = csvRowValue(record, STORE_IMPORT_HEADERS.latitude);
    const longitude = csvRowValue(record, STORE_IMPORT_HEADERS.longitude);
    const priceNote = csvRowValue(record, STORE_IMPORT_HEADERS.priceNote);
    const address = csvRowValue(record, STORE_IMPORT_HEADERS.address);
    const placeId = csvRowValue(record, STORE_IMPORT_HEADERS.placeId);
    const phone = csvRowValue(record, STORE_IMPORT_HEADERS.phone);
    const website = csvRowValue(record, STORE_IMPORT_HEADERS.website);
    const hours = csvRowValue(record, STORE_IMPORT_HEADERS.hours);
    const storeType = csvRowValue(record, STORE_IMPORT_HEADERS.storeType) || "grocery";
    const isActive = parseStoreActive(csvRowValue(record, STORE_IMPORT_HEADERS.isActive));
    const duplicateKey = `${brand.trim().toLowerCase()}|${name.trim().toLowerCase()}`;
    const coordinateError = latitude && longitude ? coordinateValidationMessage(latitude, longitude) : null;

    const base = {
      rowNumber: index + 2,
      brand,
      name,
      area,
      latitude,
      longitude,
      priceNote,
      address,
      placeId,
      phone,
      website,
      hours,
      storeType,
      isActive,
    };

    if (!name || !latitude || !longitude) {
      return { ...base, status: "invalid", reason: "Missing required fields" };
    }

    if (coordinateError) {
      return { ...base, status: "invalid", reason: coordinateError };
    }

    if (existing.has(duplicateKey)) {
      return { ...base, status: "duplicate", reason: "Duplicate brand and name" };
    }

    existing.add(duplicateKey);
    return { ...base, status: "ready", reason: "Ready" };
  });
}
