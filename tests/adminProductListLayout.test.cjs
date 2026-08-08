const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");

function readProjectFile(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

test("admin products render as a single product list", () => {
  const source = readProjectFile("src/components/admin/AdminProductList.tsx");
  const styles = readProjectFile("src/screens/adminStyles/productListStyles.ts");

  assert.match(source, /AdminProductRow/);
  assert.match(source, /productListTable/);
  assert.match(source, /Sale period · Current stores/);
  assert.doesNotMatch(source, /productGrid/);
  assert.doesNotMatch(styles, /gridTemplateColumns/);
});

test("product list keeps Details, Edit, and Delete actions in order", () => {
  const source = readProjectFile("src/components/admin/AdminProductRow.tsx");
  const detailsIndex = source.indexOf(">Details</Text>");
  const editIndex = source.indexOf(">Edit</Text>");
  const deleteIndex = source.indexOf('deleting ? "Deleting…" : "Delete"');

  assert.ok(detailsIndex >= 0);
  assert.ok(editIndex > detailsIndex);
  assert.ok(deleteIndex > editIndex);
});
