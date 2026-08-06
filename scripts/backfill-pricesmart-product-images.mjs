import { createClient } from "@supabase/supabase-js";
import {
  extractCatalogCandidates,
  extractOfficialTitle,
  packageMatches,
  preferredSearchName,
  titleScore,
} from "./product-image-backfill-utils.mjs";

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const includeInactive = args.includes("--include-inactive");

function numberArg(name, fallback) {
  const index = args.indexOf(name);
  if (index === -1) return fallback;
  const value = Number(args[index + 1]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

const searchLimit = numberArg("--limit", 80);
const maxUpdates = numberArg("--max-updates", 20);
const minScore = numberArg("--min-score", 0.92);
const offsetIndex = args.indexOf("--offset");
const requestedOffset = offsetIndex === -1 ? 0 : Number(args[offsetIndex + 1]);
const offset = Number.isInteger(requestedOffset) && requestedOffset >= 0 ? requestedOffset : 0;
const excludeIndex = args.indexOf("--exclude-ids");
const excludedIds = new Set(
  excludeIndex === -1
    ? []
    : String(args[excludeIndex + 1] ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
);
const storeBrand = "PriceSmart Foods";
const searchBaseUrl = "https://www.pricesmartfoods.com/results?q=";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!supabaseUrl || !anonKey) {
  throw new Error("EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are required.");
}

if (apply && !serviceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is required with --apply.");
}

const readClient = createClient(supabaseUrl, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const writeClient = apply
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

async function collectPaged(table, select, transform = (query) => query) {
  const rows = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const response = await transform(
      readClient.from(table).select(select).range(from, from + pageSize - 1),
    );
    if (response.error) throw response.error;
    rows.push(...(response.data ?? []));
    if ((response.data ?? []).length < pageSize) return rows;
  }
}

async function listProducts() {
  const modern = await collectPaged(
    "products",
    "id,korean_name,english_name,category,unit,thumbnail_url,created_at",
  ).catch((error) => ({ error }));

  if (!modern?.error) return modern;
  const message = String(modern.error?.message ?? modern.error).toLowerCase();
  if (!message.includes("korean_name")) throw modern.error;
  return collectPaged(
    "products",
    "id,name,english_name,category,unit,thumbnail_url,created_at",
  );
}

function isActive(price, now) {
  const startsAt = price.valid_from ? Date.parse(price.valid_from) : Number.NEGATIVE_INFINITY;
  const endsAt = price.valid_to ? Date.parse(price.valid_to) : Number.POSITIVE_INFINITY;
  return startsAt <= now && endsAt >= now;
}

async function imageExists(url) {
  const response = await fetch(url, { method: "HEAD", redirect: "follow" });
  return response.ok && (response.headers.get("content-type") ?? "").startsWith("image/");
}

async function findCandidate(product) {
  const searchName = preferredSearchName(product);
  if (!searchName) return { reason: "missing searchable English name" };

  const response = await fetch(`${searchBaseUrl}${encodeURIComponent(searchName)}`, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-CA,en;q=0.9",
      "User-Agent": "PocketCart product image maintenance",
    },
  });
  if (!response.ok) return { reason: `catalog search returned ${response.status}` };

  const catalogCandidates = extractCatalogCandidates(await response.text())
    .map((candidate) => ({
      ...candidate,
      score: titleScore(searchName, candidate.catalogName),
    }))
    .sort((a, b) => b.score - a.score);

  const best = catalogCandidates[0];
  const runnerUp = catalogCandidates[1];
  if (!best || best.score < minScore) {
    return { reason: "no high-confidence title match", searchName };
  }
  if (runnerUp && runnerUp.score >= best.score - 0.02) {
    return { reason: "ambiguous catalog variants", searchName };
  }
  const detailResponse = await fetch(best.sourceUrl, {
    headers: { "Accept-Language": "en-CA,en;q=0.9" },
  });
  const officialTitle = detailResponse.ok ? extractOfficialTitle(await detailResponse.text()) : "";
  if (!officialTitle || !packageMatches(product.unit, officialTitle)) {
    return { reason: "catalog package does not match", searchName };
  }
  if (!(await imageExists(best.imageUrl))) {
    return { reason: "matched catalog image is unavailable", searchName };
  }

  return {
    candidate: {
      id: product.id,
      category: product.category,
      currentName: searchName,
      unit: product.unit,
      catalogName: best.catalogName,
      officialTitle,
      score: Number(best.score.toFixed(3)),
      imageUrl: best.imageUrl,
      sourceUrl: best.sourceUrl,
    },
  };
}

async function mapWithConcurrency(values, concurrency, mapper) {
  const results = new Array(values.length);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < values.length) {
      const index = nextIndex++;
      results[index] = await mapper(values[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, worker));
  return results;
}

const stores = await collectPaged("stores", "id,brand,name");
const priceSmartStoreIds = stores
  .filter((store) => store.brand === storeBrand)
  .map((store) => store.id);
if (!priceSmartStoreIds.length) throw new Error(`${storeBrand} stores were not found.`);

const [products, prices] = await Promise.all([
  listProducts(),
  collectPaged(
    "product_prices",
    "product_id,store_id,valid_from,valid_to",
    (query) => query.in("store_id", priceSmartStoreIds),
  ),
]);

const now = Date.now();
const activeProductIds = new Set(
  prices.filter((price) => isActive(price, now)).map((price) => price.product_id),
);
const linkedProductIds = new Set(prices.map((price) => price.product_id));
const eligibleProductIds = includeInactive ? linkedProductIds : activeProductIds;
const targets = products
  .filter(
    (product) =>
      eligibleProductIds.has(product.id) &&
      !String(product.thumbnail_url ?? "").trim(),
  )
  .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
  .slice(offset, offset + searchLimit);

const matches = await mapWithConcurrency(targets, 4, (product) =>
  excludedIds.has(product.id) ? { reason: "explicitly excluded" } : findCandidate(product),
);
const candidates = matches
  .flatMap((result) => (result.candidate ? [result.candidate] : []))
  .slice(0, maxUpdates);

const applied = [];
if (writeClient) {
  for (const candidate of candidates) {
    const response = await writeClient
      .from("products")
      .update({ thumbnail_url: candidate.imageUrl })
      .eq("id", candidate.id)
      .is("thumbnail_url", null)
      .select("id,thumbnail_url")
      .maybeSingle();
    if (response.error) throw response.error;
    if (response.data) applied.push(candidate);
  }
}

const rejectionCounts = {};
for (const result of matches) {
  if (!result.reason) continue;
  rejectionCounts[result.reason] = (rejectionCounts[result.reason] ?? 0) + 1;
}

console.log(
  JSON.stringify(
    {
      mode: apply ? "apply" : "dry-run",
      source: storeBrand,
      scope: includeInactive ? "all linked products" : "active products",
      activeProducts: activeProductIds.size,
      eligibleProducts: eligibleProductIds.size,
      missingInScope: products.filter(
        (product) =>
          eligibleProductIds.has(product.id) &&
          !String(product.thumbnail_url ?? "").trim(),
      ).length,
      offset,
      searched: targets.length,
      highConfidenceCandidates: candidates.length,
      applied: applied.length,
      rejected: rejectionCounts,
      candidates,
    },
    null,
    2,
  ),
);
