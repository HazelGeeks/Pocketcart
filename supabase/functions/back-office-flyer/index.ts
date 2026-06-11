type FlyerRow = {
  martName: string;
  regionBranch: string;
  saleStartDate: string;
  saleEndDate: string;
  name: string;
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
          name: { type: "string" },
          mainCategory: { type: "string" },
          subCategory: { type: "string" },
          brand: { type: "string" },
          price: { type: "string" },
          unit: { type: "string" },
          memo: { type: "string" },
        },
        required: [
          "martName",
          "regionBranch",
          "saleStartDate",
          "saleEndDate",
          "name",
          "mainCategory",
          "subCategory",
          "brand",
          "price",
          "unit",
          "memo",
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

function authorizedEmail(request: Request): boolean {
  const allowed = (Deno.env.get("FLYER_ADMIN_EMAILS") ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  if (allowed.length === 0) return true;

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ?? "";
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
      return {
        martName: text("martName"),
        regionBranch: text("regionBranch"),
        saleStartDate: text("saleStartDate"),
        saleEndDate: text("saleEndDate"),
        name: text("name"),
        mainCategory: text("mainCategory"),
        subCategory: text("subCategory"),
        brand: text("brand"),
        price: text("price"),
        unit: text("unit"),
        memo: text("memo"),
      };
    })
    .filter((row) => row.name || row.price || row.memo);
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
      name,
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
  file: File,
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
      model: Deno.env.get("OPENAI_MODEL")?.trim() || "gpt-4.1-mini",
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
  if (!authorizedEmail(request)) {
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

  const prompt = [
    "You are extracting grocery flyer data for a Korean back-office table.",
    "Create one row per actual sale product. Ignore logos, navigation, legal text, coupons without a concrete product, page numbers, decorative text, and unrelated OCR noise.",
    "The target table columns are exactly:",
    "1. 마트명 -> martName",
    "2. 지역/지점 -> regionBranch",
    "3. 세일 시작일 -> saleStartDate",
    "4. 세일 종료일 -> saleEndDate",
    "5. 이름 -> name",
    "6. 대분류 -> mainCategory",
    "7. 중분류 -> subCategory",
    "8. 브랜드 -> brand",
    "9. 가격 -> price",
    "10. 단위 -> unit",
    "11. 메모 -> memo",
    "Return JSON that matches the schema only. Use the camelCase field names, not the Korean labels.",
    "마트명, 지역/지점, 세일 시작일, 세일 종료일 are optional. Fill them only when they are clearly visible in the flyer. Otherwise return an empty string.",
    "Dates must be YYYY-MM-DD only when clearly visible. Do not guess missing sale dates. If date text is visible but incomplete, leave saleStartDate and saleEndDate empty and write the visible date text in memo.",
    "Price must be numeric text without currency symbols when possible. Keep sale conditions like 2/$5, member price, limit, or after coupon in memo if they do not fit a single numeric price.",
    "Unit examples: each, ea, lb, kg, g, ml, L, pack, ct. If the unit is attached to the product size, use that value when clear.",
    "Use Korean category text for Korean flyers. Example main categories: 신선식품, 정육, 수산, 유제품, 냉동식품, 가공식품, 음료, 생활용품. Use a more specific subCategory when visible or obvious.",
    "Brand should contain only the product brand, not the store name. If brand is not visible, leave it empty.",
    "Do not invent values. If a field is not visible or cannot be inferred confidently, return an empty string and put uncertainty or original OCR fragments in memo.",
  ].join("\n");

  try {
    if (googleVisionApiKey) {
      const ocrText = await extractTextWithGoogleVision(file, base64, isPdf, googleVisionApiKey);
      if (openAiApiKey && ocrText) {
        const rows = await extractRowsWithOpenAi(openAiApiKey, [
          { type: "input_text", text: `${prompt}\n\nOCR text:\n${ocrText}` },
        ]);
        return jsonResponse({ rows });
      }

      return jsonResponse({ rows: parseFlyerTextRows(ocrText) });
    }

    if (!openAiApiKey) {
      return jsonResponse({ rows: [] });
    }

    const fileContent = isPdf
      ? { type: "input_file", filename: file.name || "flyer.pdf", file_data: dataUrl }
      : { type: "input_image", image_url: dataUrl };
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
