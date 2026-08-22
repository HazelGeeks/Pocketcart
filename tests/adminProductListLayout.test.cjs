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
  assert.match(source, /Current sale/);
  assert.doesNotMatch(source, /Stores · Range/);
  assert.doesNotMatch(source, /productListRangeColumn/);
  assert.doesNotMatch(source, /productGrid/);
  assert.doesNotMatch(styles, /gridTemplateColumns/);
});

test("product filters use retailer language without a branch selector", () => {
  const source = readProjectFile("src/components/admin/AdminProductFilters.tsx");
  const state = readProjectFile("src/state/adminStore.ts");

  assert.match(source, /Retailer: All/);
  assert.doesNotMatch(source, /Store chain: All/);
  assert.doesNotMatch(source, /Store: All/);
  assert.doesNotMatch(state, /productStoreFilter/);
});

test("product rows prioritize the active retailer and sale period", () => {
  const source = readProjectFile("src/components/admin/AdminProductRow.tsx");

  assert.match(source, /currentSaleStoreBrands/);
  assert.match(source, /currentSaleValidFrom/);
  assert.match(source, /No active sale/);
  assert.doesNotMatch(source, /storeCount/);
  assert.doesNotMatch(source, /priceRangeLabel/);
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

test("product editor presents sale prices as spreadsheet rows and columns", () => {
  const editor = readProjectFile("src/components/admin/AdminProductPriceSetsEditor.tsx");
  const modal = readProjectFile("src/components/admin/AdminProductFormModal.tsx");
  const styles = readProjectFile("src/screens/adminStyles/modalStyles.ts");

  assert.match(editor, /storePriceTableHeaderRow/);
  assert.match(editor, /label="Retailer"/);
  assert.match(editor, /label="Branch"/);
  assert.match(editor, /label="Sale start"/);
  assert.match(editor, /label="Sale end"/);
  assert.match(editor, /label="Price"/);
  assert.match(editor, /label="Action"/);
  assert.match(styles, /storePriceTableRow:[\s\S]*flexDirection: "row"/);
  assert.match(styles, /storePriceTableCell:[\s\S]*borderRightWidth: 1/);
  assert.match(modal, /productEditorModalCard/);
  assert.match(styles, /productEditorModalCard:[\s\S]*maxWidth: 1160/);
  assert.doesNotMatch(editor, /storePriceCard|storePriceGrid|storePriceList/);
});
