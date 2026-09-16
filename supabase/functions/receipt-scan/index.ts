import { receiptPrompt, receiptSchema } from "./schema.ts";
const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers });
export async function handleReceiptScan(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") return new Response(null, { headers });
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);
  const authorization = request.headers.get("authorization") ?? "";
  if (!/^Bearer \S+$/i.test(authorization)) return json({ error: "Please sign in first." }, 401);
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const key = Deno.env.get("OPENAI_API_KEY");
  if (!url || !anon || !key)
    return json(
      { error: "Receipt reading is not available yet. You can still enter details manually." },
      503,
    );
  try {
    const auth = await fetch(`${url}/auth/v1/user`, {
      headers: { authorization, apikey: anon },
      signal: AbortSignal.timeout(10000),
    });
    if (!auth.ok || !(await auth.json()).id) return json({ error: "Please sign in again." }, 401);
    // Bound the streamed body too: Content-Length is optional and not trusted.
    const reader = request.body?.getReader();
    if (!reader) return json({ error: "Missing receipt photo." }, 400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.length;
      if (size > 8_100_000) {
        await reader.cancel();
        return json({ error: "Photo is too large. Please retake it." }, 413);
      }
      chunks.push(chunk.value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    let body: { imageBase64?: unknown; mimeType?: unknown };
    try {
      body = JSON.parse(new TextDecoder().decode(bytes));
    } catch {
      return json({ error: "Invalid receipt request." }, 400);
    }
    const base64 = typeof body?.imageBase64 === "string" ? body.imageBase64 : "";
    if (
      !base64 ||
      base64.length > 8_000_000 ||
      base64.length % 4 !== 0 ||
      !/^[A-Za-z0-9+/]*={0,2}$/.test(base64) ||
      !["image/jpeg", "image/png"].includes(String(body?.mimeType))
    )
      return json({ error: "Invalid receipt photo." }, 400);
    const signature = atob(base64.slice(0, 16));
    if (
      body.mimeType === "image/jpeg"
        ? !signature.startsWith("\xff\xd8\xff")
        : !signature.startsWith("\x89PNG\r\n\x1a\n")
    )
      return json({ error: "Invalid image format." }, 400);
    const claim = await fetch(`${url}/rest/v1/rpc/claim_receipt_scan`, {
      method: "POST",
      headers: { authorization, apikey: anon, "Content-Type": "application/json" },
      body: "{}",
      signal: AbortSignal.timeout(10000),
    });
    if (!claim.ok)
      return json(
        { error: "Receipt reading is unavailable. You can enter details manually." },
        503,
      );
    if ((await claim.json()) !== true)
      return json(
        { error: "Daily receipt reading limit reached. You can still enter details manually." },
        429,
      );
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(55000),
      body: JSON.stringify({
        model: Deno.env.get("RECEIPT_SCAN_OPENAI_MODEL")?.trim() || "gpt-5-mini",
        store: false,
        instructions: receiptPrompt,
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_image",
                image_url: `data:${body.mimeType};base64,${base64}`,
                detail: "high",
              },
            ],
          },
        ],
        text: {
          format: { type: "json_schema", name: "receipt", schema: receiptSchema, strict: true },
        },
        max_output_tokens: 10000,
      }),
    });
    if (!response.ok)
      return json(
        { error: "Could not read the receipt. Try again or enter details manually." },
        502,
      );
    const result = (await response.json()) as {
      status?: string;
      output?: { content?: { type?: string; text?: string }[] }[];
    };
    const text = result.output
      ?.flatMap((o) => o.content ?? [])
      .filter((c) => c.type === "output_text")
      .map((c) => c.text ?? "")
      .join("");
    if (result.status !== "completed" || !text)
      return json(
        { error: "The receipt could not be fully read. Retake it or enter details manually." },
        422,
      );
    return json({ result: JSON.parse(text) });
  } catch {
    return json(
      {
        error:
          "Receipt reading timed out or failed. Your photo is still available for manual entry.",
      },
      502,
    );
  }
}
Deno.serve(handleReceiptScan);
