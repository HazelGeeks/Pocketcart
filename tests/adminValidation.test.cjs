const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildStoreImportPreview,
  csvHeaderKey,
  dateOnlyToIso,
  parseCsvRows,
} = require("../.tmp-tests/utils/adminValidation.js");

test("parseCsvRows handles quoted commas and BOM headers", () => {
  const rows = parseCsvRows('\uFEFFname,category\n"Organic, Eggs",Dairy\n');

  assert.deepEqual(rows, [
    ["\uFEFFname", "category"],
    ["Organic, Eggs", "Dairy"],
  ]);
  assert.equal(csvHeaderKey(rows[0][0]), "name");
});

test("dateOnlyToIso preserves sale period dates in UTC", () => {
  assert.equal(dateOnlyToIso("2026-06-18", false), "2026-06-18T00:00:00.000Z");
  assert.equal(dateOnlyToIso("2026-06-18", true), "2026-06-18T23:59:59.999Z");
});

test("buildStoreImportPreview validates store CSV rows with brand and place_id", () => {
  const preview = buildStoreImportPreview(
    ["brand", "name", "area", "latitude", "longitude", "address", "place_id", "is_active"],
    [
      ["Safeway", "Robson", "Burnaby", "49.25", "-123.01", "123 Main St", "ChIJ123", "true"],
      ["Safeway", "Robson", "Burnaby", "49.25", "-123.01", "", "", "true"],
      ["Safeway", "No Coords", "Vancouver", "", "", "", "", "true"],
    ],
    [],
  );

  assert.equal(preview[0].status, "ready");
  assert.equal(preview[0].brand, "Safeway");
  assert.equal(preview[0].placeId, "ChIJ123");
  assert.equal(preview[1].status, "duplicate");
  assert.equal(preview[2].status, "invalid");
});
