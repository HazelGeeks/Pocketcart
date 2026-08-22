const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");

function readProjectFile(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

test("admin bulk workflows suppress per-row list invalidation", () => {
  const workspaceQueries = readProjectFile("src/hooks/useAdminWorkspaceQueries.ts");

  assert.match(
    workspaceQueries,
    /useCreateAdminProductMutation\(\{ invalidateOnSuccess: false \}\)/,
  );
  assert.match(
    workspaceQueries,
    /useCreateAdminPriceEntryMutation\(\{ invalidateOnSuccess: false \}\)/,
  );
  assert.match(
    workspaceQueries,
    /useUpdateAdminPriceEntryMutation\(\{ invalidateOnSuccess: false \}\)/,
  );
  assert.match(
    workspaceQueries,
    /useDeleteAdminPriceEntryMutation\(\{ invalidateOnSuccess: false \}\)/,
  );
});

test("CSV import delegates its single final refresh to the batch executor", () => {
  const csvActions = readProjectFile("src/hooks/useAdminProductCsvActions.ts");

  assert.match(csvActions, /refreshData: \(\) => params\.loadAll\(true\)/);
  assert.equal(csvActions.match(/params\.loadAll\(true\)/g)?.length, 1);
});
