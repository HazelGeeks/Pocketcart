import { createFlyerRow, type FlyerRow } from "../state/adminStore";
import { supabase, supabaseAnonKey } from "./supabaseClient";

type FlyerAiResponse = {
  rows?: Array<Partial<FlyerRow> & Record<string, unknown>>;
  data?: {
    rows?: Array<Partial<FlyerRow> & Record<string, unknown>>;
  };
  error?: string;
  message?: string;
  code?: string;
  warning?: string;
};

type FlyerAiResult = {
  rows: FlyerRow[];
  warning?: string;
};

const FLYER_AI_ENDPOINT = (process.env.EXPO_PUBLIC_FLYER_AI_ENDPOINT ?? "").trim();

export const hasFlyerAiEndpoint = FLYER_AI_ENDPOINT.length > 0;

function endpointLabel(): string {
  try {
    const url = new URL(FLYER_AI_ENDPOINT);
    return `${url.origin}${url.pathname}`;
  } catch (_error) {
    return FLYER_AI_ENDPOINT || "empty endpoint";
  }
}

function textValue(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

function rowValue(row: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = textValue(row[key]);
    if (value) return value;
  }
  return "";
}

function normalizeAiRow(row: Partial<FlyerRow> & Record<string, unknown>): FlyerRow {
  return createFlyerRow({
    selected: typeof row.selected === "boolean" ? row.selected : true,
    martName: rowValue(row, "martName", "mart_name", "storeBrand", "store_brand", "마트명", "마트브랜드", "marketName"),
    regionBranch: rowValue(row, "regionBranch", "region_branch", "storeName", "store_name", "branchName", "branch_name", "지역/지점", "branch", "location"),
    saleStartDate: rowValue(row, "saleStartDate", "sale_start_date", "세일 시작일", "startDate"),
    saleEndDate: rowValue(row, "saleEndDate", "sale_end_date", "세일 종료일", "endDate"),
    name: rowValue(row, "name", "koreanName", "korean_name", "한글명", "한국어명", "이름", "productName", "product_name"),
    englishName: rowValue(row, "englishName", "english_name", "영문명", "영어명", "englishProductName", "english_product_name"),
    mainCategory: rowValue(row, "mainCategory", "main_category", "category", "카테고리", "대분류"),
    subCategory: rowValue(row, "subCategory", "sub_category", "중분류"),
    brand: rowValue(row, "brand", "productBrand", "product_brand", "상품브랜드", "상품 브랜드", "브랜드"),
    price: rowValue(row, "price", "가격"),
    unit: rowValue(row, "unit", "단위"),
    memo: rowValue(row, "memo", "메모", "note", "ocrNote"),
  });
}

export async function extractFlyerRowsWithAi(file: File): Promise<FlyerAiResult> {
  if (!hasFlyerAiEndpoint) {
    return { rows: [] };
  }
  if (!/^https?:\/\//i.test(FLYER_AI_ENDPOINT)) {
    throw new Error("Flyer AI endpoint is not a valid HTTP URL.");
  }

  const formData = new FormData();
  formData.append("file", file, file.name);

  const session = supabase ? (await supabase.auth.getSession()).data.session : null;
  const headers: HeadersInit = {
    "x-client-info": "pocketcart-backoffice",
  };
  if (supabaseAnonKey) {
    headers.apikey = supabaseAnonKey;
  }
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  let response: Response;
  try {
    response = await fetch(FLYER_AI_ENDPOINT, {
      method: "POST",
      headers,
      body: formData,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network request failed";
    throw new Error(
      `Could not reach Flyer AI function (${endpointLabel()}). Check the function URL, CORS, and deployment. Original error: ${message}`,
    );
  }

  const payload = (await response.json().catch(() => ({}))) as FlyerAiResponse;

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(
        "Flyer AI function requires a signed-in Supabase session. Please sign in again or disable JWT verification for the function.",
      );
    }
    throw new Error(
      payload.error || payload.message || payload.code || `AI flyer import failed with ${response.status}.`,
    );
  }

  const rows = payload.rows ?? payload.data?.rows ?? [];
  return {
    rows: rows.map((row) => normalizeAiRow(row)).filter((row) => row.name || row.price),
    warning: payload.warning,
  };
}
