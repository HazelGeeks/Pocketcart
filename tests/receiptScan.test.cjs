const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const transpile = (file) =>
  ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
const schema = {};
new Function("exports", transpile("supabase/functions/receipt-scan/schema.ts"))(schema);
function harness({
  auth = true,
  quota = true,
  upstream = true,
  status = "completed",
  missingKey = false,
} = {}) {
  const calls = [];
  let handler;
  const fetch = async (url, options) => {
    calls.push({ url, body: options.body ? JSON.parse(options.body) : null });
    if (url.endsWith("/auth/v1/user"))
      return Response.json(auth ? { id: "10000000-0000-0000-0000-000000000001" } : {}, {
        status: auth ? 200 : 401,
      });
    if (url.endsWith("/claim_receipt_scan")) return Response.json(quota);
    return Response.json(
      {
        status,
        output: [
          {
            content: [
              { type: "output_text", text: JSON.stringify({ store_name: "Market", items: [] }) },
            ],
          },
        ],
      },
      { status: upstream ? 200 : 500 },
    );
  };
  new Function(
    "require",
    "exports",
    "Deno",
    "fetch",
    transpile("supabase/functions/receipt-scan/index.ts"),
  )(
    () => schema,
    {},
    {
      env: {
        get: (key) =>
          missingKey && key === "OPENAI_API_KEY"
            ? undefined
            : key === "SUPABASE_URL"
              ? "https://backend.test"
              : "configured",
      },
      serve: (fn) => {
        handler = fn;
      },
    },
    fetch,
  );
  const body = {
    imageBase64: Buffer.from([255, 216, 255, 224, 1, 2, 3, 4, 5, 6, 7, 8]).toString("base64"),
    mimeType: "image/jpeg",
  };
  return {
    calls,
    request: (patch = {}, authorization = "Bearer session") =>
      handler(
        new Request("https://backend.test/receipt-scan", {
          method: "POST",
          headers: { authorization },
          body: JSON.stringify({ ...body, ...patch }),
        }),
      ),
  };
}
test("receipt scan verifies authentication before reading images or charging API usage", async () => {
  const h = harness({ auth: false });
  assert.equal((await h.request()).status, 401);
  assert.equal(h.calls.length, 1);
  const noToken = harness();
  assert.equal((await noToken.request({}, "")).status, 401);
  assert.equal(noToken.calls.length, 0);
});
test("receipt scan rejects fake images before claiming quota", async () => {
  const h = harness();
  assert.equal(
    (await h.request({ imageBase64: Buffer.from("not an image").toString("base64") })).status,
    400,
  );
  assert.equal(h.calls.length, 1);
});
test("receipt scan refuses over-quota calls without contacting OpenAI", async () => {
  const h = harness({ quota: false });
  assert.equal((await h.request()).status, 429);
  assert.equal(h.calls.length, 2);
});
test("receipt scan sends a private structured image request without account tokens in the body", async () => {
  const h = harness();
  const response = await h.request();
  assert.equal(response.status, 200);
  const body = h.calls[2].body;
  assert.equal(body.store, false);
  assert.equal(body.text.format.strict, true);
  assert.equal(body.input[0].content[0].type, "input_image");
  assert.ok(body.instructions.includes("untrusted data"));
  assert.ok(!JSON.stringify(body).includes("session"));
  assert.ok(!JSON.stringify(body).includes("10000000-0000-0000-0000-000000000001"));
});
test("receipt scan missing config, incomplete responses and upstream failures preserve manual entry", async () => {
  for (const [config, status] of [
    [{ missingKey: true }, 503],
    [{ status: "incomplete" }, 422],
    [{ upstream: false }, 502],
  ]) {
    const h = harness(config);
    assert.equal((await h.request()).status, status);
  }
});
