const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const directory = path.resolve(__dirname, "../supabase/product-image-backfills/20261009040000");
const lib = import("../scripts/upload-reviewed-product-images.mjs");
const readManifest = async () => JSON.parse(await fs.readFile(path.join(directory, "manifest.json"), "utf8"));
const readAsset = (file) => fs.readFile(path.join(directory, file));

test("reviewed batch contains 193 real, unchanged WebP assets with auditable sources", async () => {
  const { validateBundle } = await lib;
  const manifest = await readManifest();
  assert.equal((await validateBundle(manifest, readAsset)).length, 193);
  assert.equal(manifest.baselineActiveMissing - manifest.rows.length, manifest.expectedActiveMissing);
  assert.ok(manifest.rows.every((row) => row.source.url.startsWith("https://") && row.width > 0 && row.height > 0));
});

test("batch rejects altered bytes, duplicate IDs, foreign project and asset traversal before upload", async () => {
  const { validateBundle } = await lib;
  const manifest = await readManifest();
  const changedBytes = async (file) => { const bytes = await readAsset(file); bytes[20] ^= 1; return bytes; };
  await assert.rejects(validateBundle(manifest, changedBytes), /changed WebP/);
  for (const change of [
    (copy) => { copy.rows[1] = copy.rows[0]; },
    (copy) => { copy.projectId = "another-project"; },
    (copy) => { copy.rows[0].file = "../secret.webp"; },
    (copy) => { copy.rows[0].imageUrl = "https://example.com/image.webp"; },
  ]) {
    const copy = structuredClone(manifest);
    change(copy);
    await assert.rejects(validateBundle(copy, readAsset));
  }
});

test("catalog guards preserve concurrent images and changed or inactive products; identical retries are allowed", async () => {
  const { validateProducts } = await lib;
  const { rows } = await readManifest();
  const products = rows.map((row) => ({ id: row.id, ...row.expected, thumbnail_url: null }));
  const active = new Set(rows.map((row) => row.id));
  validateProducts(rows, products, active);
  products[0].thumbnail_url = rows[0].imageUrl;
  validateProducts(rows, products, active);
  products[0].thumbnail_url = "https://example.com/concurrent.webp";
  assert.throws(() => validateProducts(rows, products, active), /already has another image/);
  products[0].thumbnail_url = null;
  products[0].unit = "changed size";
  assert.throws(() => validateProducts(rows, products, active), /Product changed/);
  products[0].unit = rows[0].expected.unit;
  active.delete(rows[0].id);
  assert.throws(() => validateProducts(rows, products, active), /inactive/);
});
