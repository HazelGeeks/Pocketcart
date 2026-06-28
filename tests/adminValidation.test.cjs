const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildStoreImportPreview,
  csvHeaderKey,
  dateOnlyToIso,
  parseCsvRows,
  validatePriceEntryInput,
  validateProductInput,
  validateStoreInput,
} = require("../.tmp-tests/utils/adminValidation.js");

test("parseCsvRows handles quoted commas and BOM headers", () => {
  const rows = parseCsvRows('\uFEFFname,category\n"Organic, Eggs",Dairy\n');

  assert.deepEqual(rows, [
    ["\uFEFFname", "category"],
    ["Organic, Eggs", "Dairy"],
  ]);
  assert.equal(csvHeaderKey(rows[0][0]), "name");
});

test("validateProductInput requires product name and category", () => {
  assert.equal(
    validateProductInput({ name: "", category: "Dairy" }),
    "Product name and category are required.",
  );
  assert.equal(validateProductInput({ name: "Milk", category: "Dairy" }), null);
});

test("validateStoreInput checks required fields, coordinates, and duplicates", () => {
  assert.equal(
    validateStoreInput({ name: "", latitude: "49", longitude: "-123" }),
    "Branch name, latitude, and longitude are required.",
  );
  assert.equal(
    validateStoreInput({ name: "Fresh Mart", latitude: "91", longitude: "-123" }),
    "Latitude must be between -90 and 90.",
  );
  assert.equal(
    validateStoreInput(
      { name: "Fresh Mart", latitude: "49.2", longitude: "-123.1" },
      [{ id: "store-1", brand: "", name: "Fresh Mart" }],
    ),
    "A store with the same brand and branch already exists.",
  );
  assert.equal(
    validateStoreInput(
      { name: "Fresh Mart", latitude: "49.2", longitude: "-123.1" },
      [{ id: "store-1", brand: "", name: "Fresh Mart" }],
      "store-1",
    ),
    null,
  );
});

test("validatePriceEntryInput checks relation, price, and dates", () => {
  assert.equal(
    validatePriceEntryInput({ productId: "p1", storeId: "", price: "2.99" }),
    "Product, store, and price are required.",
  );
  assert.equal(
    validatePriceEntryInput({ productId: "p1", storeId: "s1", price: "-1" }),
    "Price must be a valid non-negative number.",
  );
  assert.equal(
    validatePriceEntryInput({ productId: "p1", storeId: "s1", price: "2.99", validFrom: "2026-99-01" }),
    "Sale period start and end dates are required.",
  );
  assert.equal(
    validatePriceEntryInput({ productId: "p1", storeId: "s1", price: "2.99", validFrom: "2026-99-01", validTo: "2026-06-20" }),
    "Valid from must be a valid date.",
  );
  assert.equal(
    validatePriceEntryInput({ productId: "p1", storeId: "s1", price: "2.99", validFrom: "2026-06-18", validTo: "2026-06-20" }),
    null,
  );
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
