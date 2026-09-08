const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

async function extract({ pdf = false, ocr = "Milk $3.99", visionFails = false, admin = true } = {}) {
  let handler;
  let aiRequest;
  const env = { SUPABASE_URL: "https://test.local", SUPABASE_ANON_KEY: "test", GOOGLE_VISION_API_KEY: "test", OPENAI_API_KEY: "test" };
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
      return Response.json({ output_text: JSON.stringify({ rows: [{ englishName: "Milk", koreanName: "우유", price: "3.99", unit: "1 L" }] }) });
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
    assert.equal(aiRequest.model, "gpt-5-mini");
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
