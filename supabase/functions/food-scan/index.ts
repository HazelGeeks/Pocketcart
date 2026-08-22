type FoodScanMode = "fresh" | "label";

type FoodScanResult = {
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

type OpenAiResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
    }>;
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

const resultSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    productName: { type: "string" },
    category: { type: "string" },
    confidence: { type: "integer", minimum: 0, maximum: 100 },
    summary: { type: "string" },
    ripenessLevel: {
      type: "string",
      enum: ["unripe", "ready", "overripe", "unknown", "not_applicable"],
    },
    ripenessConfidence: { type: "integer", minimum: 0, maximum: 100 },
    evidence: { type: "array", items: { type: "string" }, maxItems: 8 },
    ingredients: { type: "array", items: { type: "string" }, maxItems: 30 },
    allergens: { type: "array", items: { type: "string" }, maxItems: 12 },
    nutritionHighlights: { type: "array", items: { type: "string" }, maxItems: 8 },
    nextSteps: { type: "array", items: { type: "string" }, maxItems: 8 },
    safetyNote: { type: "string" },
    requiresConfirmation: { type: "boolean" },
  },
  required: [
    "productName",
    "category",
    "confidence",
    "summary",
    "ripenessLevel",
    "ripenessConfidence",
    "evidence",
    "ingredients",
    "allergens",
    "nutritionHighlights",
    "nextSteps",
    "safetyNote",
    "requiresConfirmation",
  ],
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

function outputText(payload: OpenAiResponse): string {
  if (typeof payload.output_text === "string") return payload.output_text;
  for (const output of payload.output ?? []) {
    for (const content of output.content ?? []) {
      if (typeof content.text === "string") return content.text;
    }
  }
  return "";
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function confidence(value: unknown): number {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function normalizeResult(value: unknown): FoodScanResult {
  const item = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const text = (key: string, fallback: string) =>
    typeof item[key] === "string" && item[key].trim() ? item[key].trim() : fallback;
  const allowedRipeness = new Set<FoodScanResult["ripenessLevel"]>([
    "unripe",
    "ready",
    "overripe",
    "unknown",
    "not_applicable",
  ]);
  const ripenessCandidate = item.ripenessLevel as FoodScanResult["ripenessLevel"];

  return {
    productName: text("productName", "Unrecognized food"),
    category: text("category", "Unknown"),
    confidence: confidence(item.confidence),
    summary: text("summary", "The image did not contain enough visible detail."),
    ripenessLevel: allowedRipeness.has(ripenessCandidate) ? ripenessCandidate : "unknown",
    ripenessConfidence: confidence(item.ripenessConfidence),
    evidence: stringArray(item.evidence).slice(0, 8),
    ingredients: stringArray(item.ingredients).slice(0, 30),
    allergens: stringArray(item.allergens).slice(0, 12),
    nutritionHighlights: stringArray(item.nutritionHighlights).slice(0, 8),
    nextSteps: stringArray(item.nextSteps).slice(0, 8),
    safetyNote: text(
      "safetyNote",
      "Visual analysis cannot confirm food safety, internal spoilage, bacteria, or contamination.",
    ),
    requiresConfirmation: item.requiresConfirmation !== false,
  };
}

function promptFor(mode: FoodScanMode, barcode: string | null): string {
  const common = [
    "You are PocketCart Food Scan, a cautious grocery photo assistant.",
    "Return concise English text in the supplied JSON schema.",
    "Describe only what is supported by the image. Never invent hidden ingredients, exact nutrition quantities, expiry dates, or storage history.",
    "Never claim that meat, fish, dairy, cooked food, or any other item is safe to eat. A photo cannot detect bacteria, toxins, contamination, or internal spoilage.",
    "Set requiresConfirmation to true whenever the item confidence is below 80, the label is incomplete, or critical text is blurry or obscured.",
    "Evidence must describe visible details rather than restating conclusions.",
    "Keep safetyNote direct and specific to the limitations of this result.",
    barcode ? `A barcode scanner detected ${barcode}. Treat it only as a visible reference; do not identify a product from the number unless the package itself supports that identification.` : "No barcode was detected.",
  ];

  if (mode === "label") {
    return [
      ...common,
      "The user is scanning an ingredient label on packaged food.",
      "Transcribe ingredients only when they are visibly readable. Preserve meaningful ingredient names, but omit punctuation and section headers.",
      "List allergens only when explicitly declared or unambiguously present in readable ingredient text. Do not infer cross-contact warnings that are not visible.",
      "Use ripenessLevel not_applicable and ripenessConfidence 0.",
      "Nutrition highlights may summarize only clearly visible nutrition or ingredient information. If none is readable, return an empty array.",
      "If the photo shows the package front rather than a readable ingredient label, explain that the ingredient panel should be photographed and leave ingredients empty.",
    ].join("\n");
  }

  return [
    ...common,
    "The user is scanning one fresh food item, usually a fruit or vegetable.",
    "Identify the item and estimate visible ripeness only when external appearance is a meaningful indicator for that specific food.",
    "Use unripe, ready, overripe, or unknown. Use not_applicable for packaged or non-produce items.",
    "Base ripeness on visible color, texture, firmness cues, bruising, shriveling, or surface condition. State when lighting or angle limits confidence.",
    "Ingredients must be an empty array for whole fresh food.",
    "Nutrition highlights may contain broad, well-established qualities commonly associated with the identified food, without exact amounts or health-treatment claims.",
    "Next steps may suggest checking smell, firmness, packaging, or cutting the food open, but must not override normal food safety practices.",
  ].join("\n");
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  const apiKey = Deno.env.get("OPENAI_API_KEY")?.trim();
  if (!apiKey) {
    return jsonResponse({ error: "Food Scan is not configured on the server." }, 503);
  }

  const body = await request.json().catch(() => null) as {
    barcode?: unknown;
    imageBase64?: unknown;
    mimeType?: unknown;
    mode?: unknown;
  } | null;
  const imageBase64 = typeof body?.imageBase64 === "string" ? body.imageBase64.trim() : "";
  const mimeType = body?.mimeType === "image/png" ? "image/png" : "image/jpeg";
  const mode: FoodScanMode = body?.mode === "label" ? "label" : "fresh";
  const barcode = typeof body?.barcode === "string" && body.barcode.trim()
    ? body.barcode.trim().slice(0, 64)
    : null;

  if (!imageBase64) {
    return jsonResponse({ error: "Missing captured image." }, 400);
  }
  if (imageBase64.length > 9_000_000) {
    return jsonResponse({ error: "Captured image is too large. Please retake it." }, 413);
  }
  if (!/^[A-Za-z0-9+/=\r\n]+$/.test(imageBase64)) {
    return jsonResponse({ error: "Captured image encoding is invalid." }, 400);
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: Deno.env.get("FOOD_SCAN_OPENAI_MODEL")?.trim() || Deno.env.get("OPENAI_MODEL")?.trim() || "gpt-4.1-mini",
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: promptFor(mode, barcode) },
              {
                type: "input_image",
                image_url: `data:${mimeType};base64,${imageBase64}`,
                detail: "high",
              },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "food_scan_result",
            schema: resultSchema,
            strict: true,
          },
        },
      }),
    });

    const payload = await response.json().catch(() => ({})) as OpenAiResponse;
    if (!response.ok) {
      throw new Error(payload.error?.message || `Image analysis failed with ${response.status}.`);
    }
    const text = outputText(payload);
    if (!text) {
      throw new Error("Image analysis returned an empty result.");
    }

    return jsonResponse({ result: normalizeResult(JSON.parse(text)) });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Food analysis failed." },
      502,
    );
  }
});
