import type { FlyerRow } from "../state/adminStore";
import { normalizeFlyerAiRows } from "../utils/flyerAiRows";
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
    rows: normalizeFlyerAiRows(rows),
    warning: payload.warning,
  };
}
