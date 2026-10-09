import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const batchVersion = "20261009040000";
export const projectId = "jmxbvqrvxshlybeomagw";
const baseUrl = `https://${projectId}.supabase.co`;
const bucket = "product-images";
const fields = ["english_name", "korean_name", "unit", "brand", "category"];
export const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function validateBundle(manifest, readAsset) {
  if (manifest.version !== batchVersion || manifest.projectId !== projectId || manifest.rows.length !== 193) {
    throw new Error("Unexpected reviewed image batch.");
  }
  const ids = new Set();
  const assets = [];
  for (const row of manifest.rows) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(row.id) || ids.has(row.id)) {
      throw new Error("Duplicate or invalid product ID.");
    }
    ids.add(row.id);
    const file = `${row.id}.webp`;
    const objectPath = `verified-sale/${batchVersion}/${file}`;
    const imageUrl = `${baseUrl}/storage/v1/object/public/${bucket}/${objectPath}`;
    if (row.file !== file || row.objectPath !== objectPath || row.imageUrl !== imageUrl ||
        !/^[a-f0-9]{64}$/.test(row.sha256) || !row.source.title || !row.source.url.startsWith("https://") ||
        !fields.every((field) => Object.hasOwn(row.expected, field))) {
      throw new Error("Invalid asset path, source, or expected metadata.");
    }
    const bytes = await readAsset(file);
    if (bytes.length < 100 || bytes.length > 1_000_000 || bytes.toString("ascii", 0, 4) !== "RIFF" ||
        bytes.toString("ascii", 8, 12) !== "WEBP" || sha256(bytes) !== row.sha256) {
      throw new Error(`Invalid or changed WebP asset: ${row.id}`);
    }
    assets.push({ row, bytes });
  }
  return assets;
}

export function validateProducts(rows, products, activeIds) {
  const byId = new Map(products.map((product) => [product.id, product]));
  for (const row of rows) {
    const product = byId.get(row.id);
    if (!product || !activeIds.has(row.id) || fields.some((field) => product[field] !== row.expected[field]) ||
        (String(product.thumbnail_url ?? "").trim() && product.thumbnail_url !== row.imageUrl)) {
      throw new Error(`Product changed, is inactive, or already has another image: ${row.id}`);
    }
  }
}

async function main() {
  const action = process.argv[2];
  if (!["validate", "upload"].includes(action) || process.argv.length !== 3) throw new Error("Use validate or upload.");
  const directory = path.join(root, "supabase/product-image-backfills", batchVersion);
  const manifest = JSON.parse(await readFile(path.join(directory, "manifest.json"), "utf8"));
  const assets = await validateBundle(manifest, (file) => readFile(path.join(directory, file)));
  console.log(`Validated ${assets.length} reviewed WebP photos (${batchVersion}).`);
  if (action === "validate") return;
  if (process.env.SUPABASE_PROJECT_ID !== projectId || !process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    throw new Error("Matching production project and storage credential required.");
  }
  const client = createClient(baseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY.trim(), { auth: { persistSession: false } });
  const products = [];
  const activeIds = new Set();
  const now = Date.now();
  // Validate every row before uploading anything. Database updates are handled by the guarded migration.
  for (let offset = 0; offset < manifest.rows.length; offset += 50) {
    const ids = manifest.rows.slice(offset, offset + 50).map((row) => row.id);
    const productResult = await client.from("products").select(`id,thumbnail_url,${fields.join(",")}`).in("id", ids);
    if (productResult.error) throw new Error("Could not validate current catalog rows.");
    products.push(...productResult.data);
    for (let from = 0; ; from += 1000) {
      const priceResult = await client.from("product_prices").select("product_id,valid_from,observed_at,valid_to")
        .in("product_id", ids).order("id").range(from, from + 999);
      if (priceResult.error) throw new Error("Could not validate current sale rows.");
      for (const price of priceResult.data) {
        if (Date.parse(price.valid_from ?? price.observed_at) <= now && (!price.valid_to || Date.parse(price.valid_to) >= now)) {
          activeIds.add(price.product_id);
        }
      }
      if (priceResult.data.length < 1000) break;
    }
  }
  validateProducts(manifest.rows, products, activeIds);
  let uploaded = 0;
  for (const { row, bytes } of assets) {
    const result = await client.storage.from(bucket).upload(row.objectPath, bytes, {
      contentType: "image/webp", cacheControl: "31536000", upsert: false,
    });
    // Retries may encounter an immutable object uploaded by a previous partial run.
    if (result.error && !["409", "400"].includes(String(result.error.statusCode))) {
      throw new Error(`Storage upload failed for product ${row.id}.`);
    }
    const response = await fetch(row.imageUrl);
    if (!response.ok || !response.headers.get("content-type")?.startsWith("image/webp") ||
        sha256(Buffer.from(await response.arrayBuffer())) !== row.sha256) {
      throw new Error(`Published image failed verification: ${row.id}`);
    }
    uploaded++;
    if (uploaded % 25 === 0 || uploaded === assets.length) console.log(`Verified published photos: ${uploaded}/${assets.length}`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
