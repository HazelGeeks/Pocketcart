const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

async function extract({ pdf = false, ocr = "Milk $3.99", visionFails = false, admin = true,
  aiText, usage, openAi = true, vision = true, model = "gpt-6-luna" } = {}) {
  let handler;
  let aiRequest;
  const env = { SUPABASE_URL: "https://test.local", SUPABASE_ANON_KEY: "test", GOOGLE_VISION_API_KEY: "test", OPENAI_API_KEY: "test" };
  if (!openAi) delete env.OPENAI_API_KEY;
  if (!vision) delete env.GOOGLE_VISION_API_KEY;
  const globals = {
    Request, Response, File, FormData, Uint8Array, btoa, atob,
    Deno: { env: { get: (key) => env[key] }, serve: (fn) => { handler = fn; } },
    fetch: async (url, options) => {
      if (url.endsWith("/rpc/is_admin")) return Response.json(admin);
      if (url.includes("vision.googleapis.com")) {
        if (visionFails) return Response.json({ error: { message: "Unavailable" } }, { status: 503 });
        const page = { fullTextAnnotation: { text: ocr } };
        return Response.json({ responses: pdf ? [{ responses: [page] }] : [page] });
      }
      assert.equal(url, "https://api.openai.com/v1/responses");
      aiRequest = JSON.parse(options.body);
      return Response.json({ model, usage, output_text: aiText ?? JSON.stringify({ rows: [{ englishName: "Milk", koreanName: "우유", price: "3.99", unit: "1 L" }] }) });
    },
  };
  function load(file) {
    const exports = {};
    const code = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    vm.runInNewContext(code, { ...globals, exports, require: (relative) => load(path.resolve(path.dirname(file), relative)) });
    return exports;
  }
  load(path.resolve(__dirname, "../supabase/functions/back-office-flyer/index.ts"));
  const form = new FormData();
  form.append("file", new File(["fixture content"], pdf ? "flyer.pdf" : "flyer.png", { type: pdf ? "application/pdf" : "image/png" }));
  const response = await handler(new Request("https://test.local/extract", { method: "POST", headers: { authorization: "Bearer test" }, body: form }));
  return { response, aiRequest };
}

for (const pdf of [false, true]) {
  test(`successful OCR still sends the original ${pdf ? "PDF" : "image"} to AI`, async () => {
    const { response, aiRequest } = await extract({ pdf });
    assert.equal(response.status, 200);
    assert.equal(aiRequest.model, "gpt-6-luna");
    const properties = aiRequest.text.format.schema.properties.rows.items.properties;
    assert.equal(properties.imageBox, undefined);
    assert.ok(properties.mainCategory.enum.includes("Produce"));
    assert.equal(properties.mainCategory.enum.some((value) => /[가-힣]/.test(value)), false);
    const content = aiRequest.input[0].content;
    assert.match(content[0].text, /Milk \$3.99/);
    assert.equal(content[1].type, pdf ? "input_file" : "input_image");
    assert.match(content[1].file_data ?? content[1].image_url, /^data:/);
    assert.equal((await response.json()).rows[0].unit, "1 L");
  });
}

test("empty OCR still uses the uploaded source for extraction", async () => {
  const { response, aiRequest } = await extract({ ocr: "" });
  assert.equal(response.status, 200);
  assert.equal(aiRequest.input[0].content[1].type, "input_image");
});

test("failed OCR falls back to source extraction and reports the fallback", async () => {
  const { response, aiRequest } = await extract({ visionFails: true });
  assert.equal(aiRequest.input[0].content[1].type, "input_image");
  assert.match((await response.json()).warning, /fallback/);
});

test("unauthorized requests cannot reach an extraction provider", async () => {
  const { response, aiRequest } = await extract({ admin: false });
  assert.equal(response.status, 403);
  assert.equal(aiRequest, undefined);
});

const tokenUsage = { input_tokens: 1000, output_tokens: 200,
  input_tokens_details: { cached_tokens: 400, cache_write_tokens: 200 },
  output_tokens_details: { reasoning_tokens: 50 } };

for (const options of [{}, { visionFails: true }, { vision: false }]) {
  test(`AI usage is returned across extraction paths ${JSON.stringify(options)}`, async () => {
    const { response } = await extract({ ...options, usage: tokenUsage });
    const result = await response.json();
    assert.equal(result.usage.totalTokens, 1200);
    assert.equal(result.usage.reasoningTokens, 50);
    assert.ok(Math.abs(result.usage.estimatedCostUsd - 0.000169) < 1e-12);
  });
}

test("paid usage survives an empty result or malformed AI JSON", async () => {
  for (const aiText of [JSON.stringify({ rows: [] }), "invalid json"]) {
    const { response } = await extract({ aiText, usage: tokenUsage });
    assert.equal(response.status, aiText === "invalid json" ? 502 : 200);
    assert.equal((await response.json()).usage.totalTokens, 1200);
  }
});

test("OCR-only response explicitly reports no OpenAI usage", async () => {
  const { response, aiRequest } = await extract({ openAi: false });
  assert.equal(aiRequest, undefined);
  assert.equal((await response.json()).usage, null);
});

test("missing usage stays unavailable and unpriced models retain token counts", async () => {
  const { response } = await extract();
  assert.equal((await response.json()).usage, undefined);
  const other = await extract({ usage: tokenUsage, model: "custom-model" });
  const result = await other.response.json();
  assert.equal(result.usage.totalTokens, 1200);
  assert.equal(result.usage.estimatedCostUsd, null);
});
