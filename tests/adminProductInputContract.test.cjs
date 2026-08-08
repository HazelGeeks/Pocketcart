const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");

function readProjectFile(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

test("product import template omits GTIN and product brand columns", () => {
  const source = readProjectFile("src/utils/adminCsvFiles.ts");
  const templateSource = source.slice(
    source.indexOf("export function productImportTemplateCsv"),
    source.indexOf("export function productsToCsv"),
  );

  assert.doesNotMatch(templateSource, /"gtin"/);
  assert.doesNotMatch(templateSource, /"product_brand"/);
  assert.match(templateSource, /"english_name"/);
  assert.match(templateSource, /"korean_name"/);
});

test("product form modal does not render GTIN or product brand inputs", () => {
  const source = readProjectFile("src/components/admin/AdminProductFormModal.tsx");

  assert.doesNotMatch(source, /Product Brand/);
  assert.doesNotMatch(source, /GTIN \/ UPC \/ EAN/);
  assert.doesNotMatch(source, /productBrand/);
  assert.doesNotMatch(source, /productGtin/);
});

test("product import requires a preview before confirmed execution", () => {
  const source = readProjectFile("src/hooks/useAdminProductCsvActions.ts");
  const modal = readProjectFile("src/components/admin/AdminProductCsvImportModal.tsx");

  assert.match(source, /buildProductCsvImportPreview/);
  assert.match(source, /handleConfirmProductCsvImport/);
  assert.match(source, /executeProductCsvImport/);
  assert.match(modal, /no database changes have been made yet/);
  assert.match(modal, /Import Safe Rows/);
});

test("held CSV rows are assigned and replayed without merging candidate products", () => {
  const queue = readProjectFile("src/components/admin/AdminProductReviewQueue.tsx");
  const commands = readProjectFile("src/hooks/useAdminWorkspaceCommands.ts");

  assert.match(queue, /onAssignReview/);
  assert.match(queue, /without merging any products/);
  assert.doesNotMatch(queue, /onMergeReview/);
  assert.match(commands, /handleAssignIdentityReview/);
  assert.match(commands, /backend\.mutations\.createPrice\.mutateAsync/);
  assert.match(commands, /resolutionAction: "assigned_csv_row"/);
});

test("product and flyer exports omit legacy GTIN and product brand columns", () => {
  const helper = readProjectFile("src/utils/adminCsvFiles.ts");
  const productExport = helper.slice(
    helper.indexOf("export function productsToCsv"),
    helper.indexOf("export function storesToCsv"),
  );
  const flyer = readProjectFile("src/utils/flyerCsv.ts");

  assert.doesNotMatch(productExport, /"gtin"|"product_brand"/);
  assert.doesNotMatch(flyer, /product_brand/);
});
