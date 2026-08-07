const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");

function readProjectFile(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

test("runtime product queries use the current korean_name schema only", () => {
  const runtimeFiles = [
    "src/services/adminBackoffice/products.ts",
    "src/services/adminBackoffice/prices.ts",
    "src/services/marketData/products.ts",
    "supabase/functions/sync-sale-alerts/index.ts",
  ];

  for (const relativePath of runtimeFiles) {
    const source = readProjectFile(relativePath);
    assert.doesNotMatch(source, /products\([^)]*\bname\b/);
    assert.doesNotMatch(source, /select\("id, name, english_name"\)/);
    assert.doesNotMatch(source, /LEGACY_(?:PRODUCT|PRICE_WITH_PERIOD)_SELECT/);
  }
});

test("admin data queries wait for server-side admin access", () => {
  const authSource = readProjectFile("src/services/adminBackoffice/auth.ts");
  const workspaceSource = readProjectFile("src/hooks/useAdminWorkspaceQueries.ts");

  assert.match(authSource, /rpc\("is_admin"\)/);
  assert.match(workspaceSource, /const enabled = hasAdminAccess;/);
  assert.match(workspaceSource, /adminAccessQuery\.data === true/);
});
