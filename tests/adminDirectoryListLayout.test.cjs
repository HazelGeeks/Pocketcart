const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");

function readProjectFile(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

test("admin users render as a responsive directory list", () => {
  const panel = readProjectFile("src/components/admin/AdminUsersPanel.tsx");
  const row = readProjectFile("src/components/admin/AdminUserDirectoryRow.tsx");
  const styles = readProjectFile("src/screens/adminStyles/userStyles.ts");

  assert.match(panel, /AdminUserDirectoryRow/);
  assert.match(panel, /userDirectoryList/);
  assert.match(panel, /Account dates/);
  assert.match(panel, /userDirectoryActionsColumn/);
  assert.match(row, /compact/);
  assert.match(row, /AdminTechnicalDetailsPanel/);
  assert.match(row, /detailsExpanded \? "Hide" : "Details"/);
  assert.doesNotMatch(row, /<AdminTechnicalDetails\s/);
  assert.doesNotMatch(panel, /AdminUserDirectoryCard/);
  assert.doesNotMatch(styles, /gridTemplateColumns/);
});

test("admin stores render as a responsive store list", () => {
  const source = readProjectFile("src/components/admin/AdminStoreList.tsx");
  const styles = readProjectFile("src/screens/adminStyles/storeListStyles.ts");

  assert.match(source, /storeListTable/);
  assert.match(source, /Latest · Created/);
  assert.match(source, /useLayout/);
  assert.doesNotMatch(source, /storeGrid/);
  assert.doesNotMatch(styles, /storeGridCard/);
});

test("store list keeps Map, Details, Edit, and Delete actions in order", () => {
  const source = readProjectFile("src/components/admin/AdminStoreList.tsx");
  const mapIndex = source.indexOf(">Map</Text>");
  const detailsIndex = source.indexOf('detailsExpanded ? "Hide" : "Details"');
  const editIndex = source.indexOf(">Edit</Text>");
  const deleteIndex = source.indexOf('deleting ? "Deleting…" : "Delete"');

  assert.ok(mapIndex >= 0);
  assert.ok(detailsIndex > mapIndex);
  assert.ok(editIndex > detailsIndex);
  assert.ok(deleteIndex > editIndex);
});
