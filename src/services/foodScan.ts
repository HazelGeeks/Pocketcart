import { supabaseAnonKey, supabaseUrl } from "./supabaseClient";

export type FoodScanMode = "fresh" | "label";

export type FoodScanResult = {
  productName: string;
  category: string;
  confidence: number;
  summary: string;
  ripenessLevel: "unripe" | "ready" | "overripe" | "unknown" | "not_applicable";
  ripenessConfidence: number;
  evidence: string[];
  ingredients: string[];
  allergens: string[];
  nutritionHighlights: string[];
  nextSteps: string[];
  safetyNote: string;
  requiresConfirmation: boolean;
};

type FoodScanResponse = {
  result?: Partial<FoodScanResult>;
  error?: string;
  message?: string;
};

const explicitEndpoint = (process.env.EXPO_PUBLIC_FOOD_SCAN_ENDPOINT ?? "").trim();
const defaultEndpoint = supabaseUrl.trim()
  ? `${supabaseUrl.replace(/\/$/, "")}/functions/v1/food-scan`
  : "";
const endpoint = explicitEndpoint || defaultEndpoint;

export const hasFoodScanEndpoint = Boolean(endpoint && supabaseAnonKey.trim());

function normalizeTextArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function normalizeConfidence(value: unknown): number {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function normalizeResult(value: Partial<FoodScanResult> | undefined): FoodScanResult {
  const ripenessLevels = new Set<FoodScanResult["ripenessLevel"]>([
    "unripe",
    "ready",
    "overripe",
    "unknown",
    "not_applicable",
  ]);
  const ripenessLevel = ripenessLevels.has(value?.ripenessLevel as FoodScanResult["ripenessLevel"])
    ? value?.ripenessLevel as FoodScanResult["ripenessLevel"]
    : "unknown";

  return {
    productName: value?.productName?.trim() || "Unrecognized food",
    category: value?.category?.trim() || "Unknown",
    confidence: normalizeConfidence(value?.confidence),
    summary: value?.summary?.trim() || "The image did not contain enough detail for a reliable result.",
    ripenessLevel,
    ripenessConfidence: normalizeConfidence(value?.ripenessConfidence),
    evidence: normalizeTextArray(value?.evidence),
    ingredients: normalizeTextArray(value?.ingredients),
    allergens: normalizeTextArray(value?.allergens),
    nutritionHighlights: normalizeTextArray(value?.nutritionHighlights),
    nextSteps: normalizeTextArray(value?.nextSteps),
    safetyNote: value?.safetyNote?.trim() || "Use this result as general guidance only. When in doubt, do not consume the food.",
    requiresConfirmation: value?.requiresConfirmation !== false,
  };
}

export async function analyzeFoodPhoto(params: {
  base64: string;
  barcode?: string | null;
  mimeType: "image/jpeg" | "image/png";
  mode: FoodScanMode;
}): Promise<FoodScanResult> {
  if (!hasFoodScanEndpoint) {
    throw new Error("Food Scan is not connected yet. Configure Supabase and deploy the food-scan function.");
  }
  if (!params.base64.trim()) {
    throw new Error("The captured photo is empty. Please take another photo.");
  }

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        "Content-Type": "application/json",
        "x-client-info": "pocketcart-food-scan",
      },
      body: JSON.stringify({
        imageBase64: params.base64,
        barcode: params.barcode?.trim() || null,
        mimeType: params.mimeType,
        mode: params.mode,
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network request failed";
    throw new Error(`Could not reach Food Scan. ${message}`);
  }

  const payload = await response.json().catch(() => ({})) as FoodScanResponse;
  if (!response.ok) {
    throw new Error(payload.error || payload.message || `Food Scan failed with ${response.status}.`);
  }
  if (!payload.result) {
    throw new Error("Food Scan returned an empty result. Please take another photo.");
  }

  return normalizeResult(payload.result);
}
