import { flyerExtractionPrompt as prompt } from "./prompt.ts";

type FlyerRow = {
  pageIndex?: number;
  sourceLabel?: string;
  martName: string;
  regionBranch: string;
  saleStartDate: string;
  saleEndDate: string;
  englishName: string;
  koreanName: string;
  mainCategory: string;
  subCategory: string;
  brand: string;
  price: string;
  unit: string;
  memo: string;
};

type OpenAiResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
      type?: string;
    }>;
  }>;
  error?: {
    message?: string;
  };
};

type GoogleVisionAnnotateResponse = {
  responses?: Array<{
    fullTextAnnotation?: {
      text?: string;
    };
    textAnnotations?: Array<{
      description?: string;
    }>;
    error?: {
      message?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

type GoogleVisionFilesResponse = {
  responses?: Array<{
    responses?: GoogleVisionAnnotateResponse["responses"];
    error?: {
      message?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    rows: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          martName: { type: "string" },
          regionBranch: { type: "string" },
          saleStartDate: { type: "string" },
          saleEndDate: { type: "string" },
          englishName: { type: "string" },
          koreanName: { type: "string" },
          mainCategory: { type: "string", enum: ["", "Produce", "Meat", "Seafood", "Dairy", "Eggs", "Bakery", "Beverages", "Frozen Food", "Noodles", "Rice & Grains", "Rice Cakes", "Sauces & Condiments", "Snacks", "Prepared Foods", "Ready Meals", "Houseware", "Grocery"] },
          subCategory: { type: "string" },
          brand: { type: "string" },
          price: { type: "string" },
          unit: { type: "string" },
          memo: { type: "string" },
          pageIndex: { type: "number" },
          sourceLabel: { type: "string" },

        },
        required: [
          "martName",
          "regionBranch",
          "saleStartDate",
          "saleEndDate",
          "englishName",
          "koreanName",
          "mainCategory",
          "subCategory",
          "brand",
          "price",
          "unit",
          "memo",
          "pageIndex",
          "sourceLabel",
        ],
      },
    },
  },
  required: ["rows"],
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function stripMarkdownFence(value: string): string {
  return value
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function outputText(payload: OpenAiResponse): string {
  if (payload.output_text) return payload.output_text;
  for (const item of payload.output ?? []) {
    for (const content of item.content ?? []) {
      if (typeof content.text === "string") return content.text;
    }
  }
  return "";
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  const payload = token.split(".")[1] ?? "";
  if (!payload) return {};
  const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  try {
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch (_error) {
    return {};
  }
}

async function authorizedAdmin(request: Request): Promise<boolean> {
  const authorization = request.headers.get("authorization")?.trim() ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim() ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")?.trim() ?? "";
  if (!authorization || !supabaseUrl || !anonKey) return false;

  const adminResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/is_admin`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      authorization,
      "content-type": "application/json",
    },
    body: "{}",
  }).catch(() => null);
  if (!adminResponse?.ok) return false;

  const isAdmin = await adminResponse.json().catch(() => false);
  if (isAdmin !== true) return false;

  const allowed = (Deno.env.get("FLYER_ADMIN_EMAILS") ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  if (allowed.length === 0) return true;

  const token = authorization.replace(/^Bearer\s+/i, "").trim();
  const payload = decodeJwtPayload(token);
  const email =
    typeof payload.email === "string"
      ? payload.email.trim().toLowerCase()
      : "";
  return Boolean(email && allowed.includes(email));
}

function normalizeRows(value: unknown): FlyerRow[] {
  if (!value || typeof value !== "object") return [];
  const rows = Array.isArray((value as { rows?: unknown }).rows)
    ? (value as { rows: unknown[] }).rows
    : [];
  return rows
    .map((row) => {
      const item = row && typeof row === "object" ? row as Record<string, unknown> : {};
      const text = (key: keyof FlyerRow) =>
        typeof item[key] === "string" ? (item[key] as string).trim() : "";
      const number = (key: string) => {
        const value = item[key];
        return typeof value === "number" && Number.isFinite(value) ? value : undefined;
      };
      return {
        pageIndex: number("pageIndex") ?? 0,
        sourceLabel: text("sourceLabel"),
        martName: text("martName"),
        regionBranch: text("regionBranch"),
        saleStartDate: text("saleStartDate"),
        saleEndDate: text("saleEndDate"),
        englishName: text("englishName"),
        koreanName: text("koreanName"),
        mainCategory: text("mainCategory"),
        subCategory: text("subCategory"),
        brand: text("brand"),
        price: text("price"),
        unit: text("unit"),
        memo: text("memo"),
      };
    })
    .filter((row) => row.englishName || row.koreanName || row.price || row.memo);
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

async function fileToPayload(file: File): Promise<{ base64: string; dataUrl: string }> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const base64 = bytesToBase64(bytes);
  return {
    base64,
    dataUrl: `data:${file.type || "application/octet-stream"};base64,${base64}`,
  };
}

function inferFlyerMainCategory(value: string): string {
  const text = value.toLowerCase();
  if (/apple|banana|orange|berry|grape|lettuce|tomato|onion|potato|fruit|vegetable|produce|사과|바나나|딸기|포도|상추|토마토|양파|감자|과일|채소/.test(text)) {
    return "Produce";
  }
  if (/beef|pork|chicken|sausage|meat|steak|bacon|소고기|돼지|닭|고기|삼겹살/.test(text)) {
    return "Meat";
  }
  if (/fish|salmon|shrimp|seafood|tuna|cod|생선|연어|새우|해산물|참치/.test(text)) {
    return "Seafood";
  }
  if (/milk|cheese|yogurt|butter|cream|우유|치즈|요거트|버터/.test(text)) {
    return "Dairy";
  }
  if (/rice|noodle|ramen|bread|cereal|flour|쌀|라면|국수|빵|시리얼|밀가루/.test(text)) {
    return "Grocery";
  }
  if (/drink|juice|water|coffee|tea|soda|음료|주스|물|커피|차/.test(text)) {
    return "Beverage";
  }
  return "";
}

function inferFlyerUnit(value: string): string {
  const match = value.match(/\b(each|ea|lb|lbs|kg|g|ml|l|oz|pack|pk|ct)\b/i);
  return match?.[1] ?? "";
}

function parseFlyerTextRows(text: string): FlyerRow[] {
  const pricePattern = /(?:[$￦₩]\s*)?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)\s*(?:달러|원)?/;
  const rows: FlyerRow[] = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/\s+/g, " ").trim();
    if (line.length < 3) continue;

    const priceMatch = line.match(pricePattern);
    if (!priceMatch || priceMatch.index === undefined) continue;

    const price = priceMatch[1].replace(/,/g, "");
    const beforePrice = line.slice(0, priceMatch.index).replace(/[$￦₩]/g, "").trim();
    const afterPrice = line.slice(priceMatch.index + priceMatch[0].length).trim();
    const name = beforePrice || afterPrice;

    if (!name || /^\d+$/.test(name)) continue;

    rows.push({
      martName: "",
      regionBranch: "",
      saleStartDate: "",
      saleEndDate: "",
      englishName: /[가-힣]/.test(name) ? "" : name,
      koreanName: /[가-힣]/.test(name) ? name : "",
      mainCategory: inferFlyerMainCategory(name),
      subCategory: "",
      brand: "",
      price,
      unit: inferFlyerUnit(line),
      memo: afterPrice,
    });
  }

  return rows.slice(0, 100);
}

async function readGoogleVisionJson<T>(
  endpoint: "images:annotate" | "files:annotate",
  apiKey: string,
  body: unknown,
): Promise<T> {
  const response = await fetch(
    `https://vision.googleapis.com/v1/${endpoint}?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  const payload = (await response.json().catch(() => ({}))) as T & {
    error?: { message?: string };
  };

  if (!response.ok || payload.error?.message) {
    throw new Error(payload.error?.message || `Google Vision failed with ${response.status}.`);
  }

  return payload;
}

function googlePageText(
  page: NonNullable<GoogleVisionAnnotateResponse["responses"]>[number] | undefined,
): string {
  if (!page) return "";
  if (page.error?.message) throw new Error(page.error.message);
  return page.fullTextAnnotation?.text ?? page.textAnnotations?.[0]?.description ?? "";
}

async function extractTextWithGoogleVision(
  base64: string,
  isPdf: boolean,
  apiKey: string,
): Promise<string> {
  if (isPdf) {
    const maxPages = Math.max(
      1,
      Math.min(Number(Deno.env.get("GOOGLE_VISION_PDF_PAGES")?.trim() || "5"), 10),
    );
    const payload = await readGoogleVisionJson<GoogleVisionFilesResponse>(
      "files:annotate",
      apiKey,
      {
        requests: [
          {
            inputConfig: {
              content: base64,
              mimeType: "application/pdf",
            },
            features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
            pages: Array.from({ length: maxPages }, (_value, index) => index + 1),
          },
        ],
      },
    );
    const fileResponse = payload.responses?.[0];
    if (fileResponse?.error?.message) throw new Error(fileResponse.error.message);
    return (fileResponse?.responses ?? []).map((page) => googlePageText(page)).join("\n").trim();
  }

  const payload = await readGoogleVisionJson<GoogleVisionAnnotateResponse>(
    "images:annotate",
    apiKey,
    {
      requests: [
        {
          image: { content: base64 },
          features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
          imageContext: {
            languageHints: ["ko", "en"],
          },
        },
      ],
    },
  );
  return googlePageText(payload.responses?.[0]).trim();
}

async function extractRowsWithOpenAi(
  openAiApiKey: string,
  content: Array<Record<string, unknown>>,
): Promise<FlyerRow[]> {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: Deno.env.get("FLYER_OPENAI_MODEL")?.trim() || "gpt-5-mini",
      input: [
        {
          role: "user",
          content,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "flyer_rows",
          schema,
          strict: true,
        },
      },
    }),
  });

  const payload = await response.json().catch(() => ({})) as OpenAiResponse;
  if (!response.ok) {
    throw new Error(payload.error?.message || `OpenAI request failed with ${response.status}.`);
  }

  const text = outputText(payload);
  if (!text) return [];

  const parsed = JSON.parse(stripMarkdownFence(text));
  return normalizeRows(parsed);
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }
  if (!(await authorizedAdmin(request))) {
    return jsonResponse({ error: "Not authorized to extract flyer data." }, 403);
  }

  const googleVisionApiKey = Deno.env.get("GOOGLE_VISION_API_KEY")?.trim();
  const openAiApiKey = Deno.env.get("OPENAI_API_KEY")?.trim();
  if (!googleVisionApiKey && !openAiApiKey) {
    return jsonResponse(
      { error: "GOOGLE_VISION_API_KEY or OPENAI_API_KEY must be configured." },
      500,
    );
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("multipart/form-data")) {
    return jsonResponse({ error: "Expected multipart/form-data." }, 400);
  }

  const formData = await request.formData();
  const file = (formData as unknown as { get(name: string): FormDataEntryValue | null }).get("file");
  if (!(file instanceof File)) {
    return jsonResponse({ error: "Missing file upload." }, 400);
  }

  const maxBytes = 12 * 1024 * 1024;
  if (file.size > maxBytes) {
    return jsonResponse({ error: "File must be 12MB or smaller." }, 413);
  }

  const { base64, dataUrl } = await fileToPayload(file);
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");



  try {
    const fileContent = isPdf
      ? { type: "input_file", filename: file.name || "flyer.pdf", file_data: dataUrl }
      : { type: "input_image", image_url: dataUrl };

    if (googleVisionApiKey) {
      let ocrText = "";
      let googleVisionError: Error | null = null;
      try {
        ocrText = await extractTextWithGoogleVision(base64, isPdf, googleVisionApiKey);
      } catch (error) {
        googleVisionError = error instanceof Error ? error : new Error("Google Vision OCR failed.");
      }

      if (openAiApiKey && !googleVisionError) {
        const rows = await extractRowsWithOpenAi(openAiApiKey, [
          { type: "input_text", text: `${prompt}\n\nSupplementary OCR text (may be incomplete or out of reading order):\n${ocrText}` },
          fileContent,
        ]);
        return jsonResponse({ rows });
      }

      if (openAiApiKey && googleVisionError) {
        const rows = await extractRowsWithOpenAi(openAiApiKey, [
          {
            type: "input_text",
            text: `${prompt}\n\nGoogle Vision OCR was unavailable, so extract directly from the uploaded file.`,
          },
          fileContent,
        ]);
        return jsonResponse({
          rows,
          warning: `Google Vision OCR failed; used OpenAI fallback. ${googleVisionError.message}`,
        });
      }

      if (googleVisionError) {
        throw new Error(
          `Google Vision OCR failed. Check that Cloud Vision API is enabled and the API key allows vision.googleapis.com. Original error: ${googleVisionError.message}`,
        );
      }

      return jsonResponse({
        rows: parseFlyerTextRows(ocrText),
        warning: "OCR-only extraction: names, sizes and prices require manual review. Configure OPENAI_API_KEY for Product template mapping.",
      });
    }

    if (!openAiApiKey) {
      return jsonResponse({ rows: [] });
    }

    const rows = await extractRowsWithOpenAi(openAiApiKey, [
      { type: "input_text", text: prompt },
      fileContent,
    ]);
    return jsonResponse({ rows });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Flyer extraction failed." },
      502,
    );
  }
});
