import { createCanvas, loadImage } from "@napi-rs/canvas";
import { createClient } from "@supabase/supabase-js";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const valueArg = (name, fallback = "") => {
  const index = args.indexOf(name);
  return index === -1 ? fallback : String(args[index + 1] ?? fallback);
};
const flyerPath = valueArg("--flyer");
const matchesPath = valueArg("--matches");
const outputPath = valueArg("--output", "/tmp/pocketcart-hmart-image-matches.json");
const previewPath = valueArg("--preview", "/tmp/pocketcart-hmart-image-preview.jpg");
const minConfidence = Number(valueArg("--min-confidence", "0.92"));
const apply = args.includes("--apply");
const includeIds = new Set(
  valueArg("--include-ids")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
);

if (!flyerPath) throw new Error("--flyer is required.");
if (!Number.isFinite(minConfidence) || minConfidence < 0 || minConfidence > 1) {
  throw new Error("--min-confidence must be between 0 and 1.");
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const openAiKey = process.env.OPENAI_API_KEY?.trim();
const bucket = (process.env.EXPO_PUBLIC_SUPABASE_PRODUCT_IMAGE_BUCKET ?? "product-images").trim();
if (!supabaseUrl || !anonKey) throw new Error("Supabase public environment variables are required.");
if (!matchesPath && !openAiKey) throw new Error("OPENAI_API_KEY is required to detect flyer crops.");
if (apply && !serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required with --apply.");

const readClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
const writeClient = apply
  ? createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
  : null;

async function collectPaged(table, select) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await readClient.from(table).select(select).range(from, from + 999);
    if (error) throw error;
    rows.push(...data);
    if (data.length < 1000) return rows;
  }
}

async function listProducts() {
  try {
    return await collectPaged("products", "id,korean_name,english_name,unit,thumbnail_url");
  } catch (error) {
    if (!String(error?.message ?? error).toLowerCase().includes("korean_name")) throw error;
    return collectPaged("products", "id,name,english_name,unit,thumbnail_url");
  }
}

function isActive(price, now) {
  const start = price.valid_from ? Date.parse(price.valid_from) : Number.NEGATIVE_INFINITY;
  const end = price.valid_to ? Date.parse(price.valid_to) : Number.POSITIVE_INFINITY;
  return start <= now && end >= now;
}

const [products, stores, prices] = await Promise.all([
  listProducts(),
  collectPaged("stores", "id,brand,name"),
  collectPaged("product_prices", "product_id,store_id,price,valid_from,valid_to"),
]);
const storeIds = new Set(stores.filter((store) => store.brand === "H-Mart").map((store) => store.id));
const currentPrices = prices.filter((price) => storeIds.has(price.store_id) && isActive(price, Date.now()));
const priceByProduct = new Map(currentPrices.map((price) => [price.product_id, price.price]));
const activeProducts = products
  .filter((product) => priceByProduct.has(product.id) && !String(product.thumbnail_url ?? "").trim())
  .map((product) => ({
    id: product.id,
    englishName: product.english_name ?? "",
    koreanName: product.korean_name ?? product.name ?? "",
    unit: product.unit ?? "",
    price: priceByProduct.get(product.id),
  }));

function outputText(payload) {
  if (payload.output_text) return payload.output_text;
  for (const item of payload.output ?? []) {
    for (const content of item.content ?? []) {
      if (typeof content.text === "string") return content.text;
    }
  }
  return "";
}

async function detectMatches(imageBuffer, tileLabel) {
  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      rows: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            productId: { type: "string" },
            matchedText: { type: "string" },
            confidence: { type: "number" },
            x: { type: "number" },
            y: { type: "number" },
            width: { type: "number" },
            height: { type: "number" },
          },
          required: ["productId", "matchedText", "confidence", "x", "y", "width", "height"],
        },
      },
    },
    required: ["rows"],
  };
  const prompt = [
    `Match the supplied ${tileLabel} of an H-Mart flyer to the exact database products in the JSON list.`,
    "Return only products visibly present in the flyer. Require the product identity plus size/count or price to agree; do not match a different flavour, size grade, bundle, or variant.",
    "The x, y, width, and height coordinates must be normalized from 0 to 1 relative only to this supplied tile image, not the unseen full flyer.",
    "For each accepted product, return a tight crop around its product photo or package image. Exclude prices, captions, neighboring products, headers, and legal text when possible. Add small padding but keep the crop product-focused.",
    "Do not return a product that is cut off at a tile edge or whose complete photo/package cannot be identified.",
    "Use each productId at most once. Set confidence below 0.92 for any uncertain identity or crop. Do not invent a crop.",
    `Database products: ${JSON.stringify(activeProducts)}`,
  ].join("\n");
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${openAiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL?.trim() || "gpt-4.1-mini",
      input: [{ role: "user", content: [
        { type: "input_text", text: prompt },
        { type: "input_image", image_url: `data:image/jpeg;base64,${imageBuffer.toString("base64")}` },
      ] }],
      max_output_tokens: 24000,
      text: { format: { type: "json_schema", name: "hmart_flyer_matches", schema, strict: true } },
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error?.message || `OpenAI request failed with ${response.status}.`);
  const text = outputText(payload);
  if (!text) throw new Error("OpenAI returned no flyer matches.");
  return JSON.parse(text).rows;
}

function validBox(row) {
  return [row.x, row.y, row.width, row.height].every(Number.isFinite) &&
    row.x >= 0 && row.y >= 0 && row.width > 0 && row.height > 0 &&
    row.x + row.width <= 1.001 && row.y + row.height <= 1.001;
}

const imageBuffer = await readFile(flyerPath);
const source = await loadImage(imageBuffer);

async function detectTiledMatches() {
  const columns = 3;
  const rows = 2;
  const overlap = 0.025;
  const found = [];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const left = Math.max(0, column / columns - overlap);
      const top = Math.max(0, row / rows - overlap);
      const right = Math.min(1, (column + 1) / columns + overlap);
      const bottom = Math.min(1, (row + 1) / rows + overlap);
      const sourceX = Math.round(source.width * left);
      const sourceY = Math.round(source.height * top);
      const sourceWidth = Math.round(source.width * (right - left));
      const sourceHeight = Math.round(source.height * (bottom - top));
      const tile = createCanvas(sourceWidth, sourceHeight);
      tile.getContext("2d").drawImage(
        source,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        sourceWidth,
        sourceHeight,
      );
      const matches = await detectMatches(
        await tile.encode("jpeg", 88),
        `tile ${row + 1},${column + 1}`,
      );
      for (const match of matches) {
        found.push({
          ...match,
          x: left + match.x * (right - left),
          y: top + match.y * (bottom - top),
          width: match.width * (right - left),
          height: match.height * (bottom - top),
        });
      }
    }
  }
  const bestByProduct = new Map();
  for (const match of found) {
    const current = bestByProduct.get(match.productId);
    if (!current || match.confidence > current.confidence) bestByProduct.set(match.productId, match);
  }
  return [...bestByProduct.values()];
}

const rawMatches = matchesPath
  ? JSON.parse(await readFile(matchesPath, "utf8")).rows
  : await detectTiledMatches();
if (!matchesPath) await writeFile(outputPath, JSON.stringify({ rows: rawMatches }, null, 2));

const productById = new Map(activeProducts.map((product) => [product.id, product]));
const seen = new Set();
const accepted = rawMatches.filter((row) => {
  if (includeIds.size > 0 && !includeIds.has(row.productId)) return false;
  if (!productById.has(row.productId) || seen.has(row.productId)) return false;
  if (!validBox(row) || row.confidence < minConfidence) return false;
  seen.add(row.productId);
  return true;
});
function cropRect(row) {
  return {
    x: Math.max(0, Math.round(source.width * row.x)),
    y: Math.max(0, Math.round(source.height * row.y)),
    width: Math.max(1, Math.round(source.width * row.width)),
    height: Math.max(1, Math.round(source.height * row.height)),
  };
}

const columns = 5;
const tileWidth = 220;
const tileHeight = 190;
const preview = createCanvas(columns * tileWidth, Math.max(1, Math.ceil(accepted.length / columns)) * tileHeight);
const previewContext = preview.getContext("2d");
previewContext.fillStyle = "white";
previewContext.fillRect(0, 0, preview.width, preview.height);
previewContext.font = "13px sans-serif";
previewContext.fillStyle = "#17221a";
for (const [index, row] of accepted.entries()) {
  const crop = cropRect(row);
  const left = (index % columns) * tileWidth;
  const top = Math.floor(index / columns) * tileHeight;
  const scale = Math.min(200 / crop.width, 145 / crop.height);
  const width = crop.width * scale;
  const height = crop.height * scale;
  previewContext.drawImage(source, crop.x, crop.y, crop.width, crop.height, left + (tileWidth - width) / 2, top, width, height);
  const label = productById.get(row.productId)?.englishName || row.matchedText;
  previewContext.fillText(label.slice(0, 30), left + 8, top + 164, tileWidth - 16);
  previewContext.fillText(`${Math.round(row.confidence * 100)}%`, left + 8, top + 181);
}
await writeFile(previewPath, await preview.encode("jpeg", 85));

const applied = [];
if (writeClient) {
  for (const row of accepted) {
    const crop = cropRect(row);
    const canvas = createCanvas(512, 512);
    const context = canvas.getContext("2d");
    context.fillStyle = "white";
    context.fillRect(0, 0, 512, 512);
    const scale = Math.min(472 / crop.width, 472 / crop.height);
    const width = crop.width * scale;
    const height = crop.height * scale;
    context.drawImage(source, crop.x, crop.y, crop.width, crop.height, (512 - width) / 2, (512 - height) / 2, width, height);
    const objectPath = `hmart-flyer/${row.productId}.webp`;
    const bytes = await canvas.encode("webp", 86);
    const upload = await writeClient.storage.from(bucket).upload(objectPath, bytes, {
      contentType: "image/webp",
      upsert: true,
    });
    if (upload.error) throw upload.error;
    const publicUrl = writeClient.storage.from(bucket).getPublicUrl(objectPath).data.publicUrl;
    const update = await writeClient.from("products").update({ thumbnail_url: publicUrl })
      .eq("id", row.productId).is("thumbnail_url", null).select("id").maybeSingle();
    if (update.error) throw update.error;
    if (update.data) applied.push(row.productId);
  }
}

console.log(JSON.stringify({
  mode: apply ? "apply" : "dry-run",
  source: path.basename(flyerPath),
  activeMissingProducts: activeProducts.length,
  detectedMatches: rawMatches.length,
  acceptedMatches: accepted.length,
  applied: applied.length,
  matchesPath: matchesPath || outputPath,
  previewPath,
}, null, 2));
