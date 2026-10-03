const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

function load(file, globals) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, ...globals });
  return exports;
}

test("paused Food Scan server rejects requests before reading images or invoking providers", async () => {
  let handler;
  load("supabase/functions/food-scan/index.ts", {
    Response, Deno: { serve: (value) => { handler = value; } },
    fetch: () => { throw new Error("Provider must never be called"); },
  });
  for (const method of ["POST", "GET", "DELETE"]) {
    const response = handler({ method, json() { throw new Error("Image must not be read"); } });
    assert.equal(response.status, 503);
    assert.equal((await response.json()).code, "FEATURE_DISABLED");
    assert.equal(response.headers.get("Cache-Control"), "no-store");
  }
  assert.equal(handler({ method: "OPTIONS" }).status, 200);
});

test("paused client refuses analysis even with configured credentials and endpoint", async () => {
  const service = load("src/services/foodScan.ts", {
    process: { env: { EXPO_PUBLIC_FOOD_SCAN_ENDPOINT: "https://example.com" } },
    require(name) {
      if (name === "./supabaseClient") return { supabaseUrl: "https://example.com", supabaseAnonKey: "public-test-key" };
      if (name === "../shared/features") return { FOOD_SCAN_ENABLED: false };
      throw new Error(`Unexpected dependency ${name}`);
    },
    fetch: () => { throw new Error("Network must never be called"); },
  });
  assert.equal(service.hasFoodScanEndpoint, false);
  await assert.rejects(service.analyzeFoodPhoto({ base64: "test", mimeType: "image/jpeg", mode: "fresh" }), /temporarily unavailable/);
});
