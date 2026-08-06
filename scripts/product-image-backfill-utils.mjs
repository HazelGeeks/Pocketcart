const productBaseUrl = "https://www.pricesmartfoods.com";
const imageBaseUrl = "https://images.cdn.saveonfoods.com/cell";

const STOP_WORDS = new Set([
  "and", "each", "of", "or", "pack", "package", "pop", "the", "with", "your",
]);
const UNIT_TOKEN = /^(?:g|kg|ml|l|lb|oz|pc|pcs|pk|ct|ea|x\d+)$/;

function htmlDecode(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&#39;", "'")
    .replaceAll("&quot;", '"');
}

function normalize(value) {
  return htmlDecode(String(value ?? ""))
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokens(value) {
  return normalize(value)
    .split(/\s+/)
    .filter((token) => token && !STOP_WORDS.has(token) && !UNIT_TOKEN.test(token))
    .map((token) => {
      if (token.length > 4 && token.endsWith("ies")) return `${token.slice(0, -3)}y`;
      if (
        token.length > 4 &&
        token.endsWith("s") &&
        !token.endsWith("ss") &&
        !token.endsWith("us") &&
        !token.endsWith("is")
      ) return token.slice(0, -1);
      return token;
    });
}

function latinWeight(value) {
  const text = String(value ?? "");
  return (text.match(/[A-Za-z]/g) ?? []).length - (text.match(/[\uac00-\ud7a3]/g) ?? []).length * 2;
}

export function preferredSearchName(product) {
  const candidates = [product.english_name, product.korean_name, product.name]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean)
    .sort((a, b) => latinWeight(b) - latinWeight(a));
  return candidates[0] ?? "";
}

export function titleScore(source, candidate) {
  const sourceTokens = [...new Set(tokens(source))];
  const candidateTokens = [...new Set(tokens(candidate))];
  if (!sourceTokens.length || !candidateTokens.length) return 0;

  const sourceText = sourceTokens.join(" ");
  const candidateText = candidateTokens.join(" ");
  if (sourceText === candidateText) return 1;
  const candidateSet = new Set(candidateTokens);
  const overlap = sourceTokens.filter((token) => candidateSet.has(token)).length;
  if (overlap < Math.min(2, sourceTokens.length)) return 0;
  const recall = overlap / sourceTokens.length;
  const precision = overlap / candidateTokens.length;
  if (recall === 1 && sourceTokens.length >= 2 && precision >= 0.5) return 0.96;
  return recall * 0.7 + precision * 0.3;
}

function packageFacts(value) {
  const text = normalize(value).replace(
    /(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*(kg|g|ml|l)\b/g,
    (_, count, size, unit) => `${count} count ${size} ${unit} ${Number(count) * Number(size)} ${unit}`,
  );
  const facts = [];
  const pattern = /(\d+(?:\.\d+)?)\s*(kilograms?|kg|grams?|g|millilit(?:er|re)s?|ml|lit(?:er|re)s?|l|pounds?|lbs?|ounces?|oz|pieces?|pcs?|pc|each|count)\b/g;
  for (const match of text.matchAll(pattern)) {
    let amount = Number(match[1]);
    const unit = match[2];
    let kind = "count";
    if (["kilogram", "kilograms", "kg"].includes(unit)) {
      kind = "mass";
      amount *= 1000;
    } else if (["gram", "grams", "g"].includes(unit)) {
      kind = "mass";
    } else if (["liter", "liters", "litre", "litres", "l"].includes(unit)) {
      kind = "volume";
      amount *= 1000;
    } else if (["milliliter", "milliliters", "millilitre", "millilitres", "ml"].includes(unit)) {
      kind = "volume";
    } else if (["pound", "pounds", "lb", "lbs"].includes(unit)) {
      kind = "mass";
      amount *= 453.592;
    } else if (["ounce", "ounces", "oz"].includes(unit)) {
      kind = "mass";
      amount *= 28.3495;
    }
    facts.push({ amount, kind });
  }
  if (/^(?:ea|each)$/.test(text)) facts.push({ amount: 1, kind: "count" });
  return facts;
}

export function packageMatches(unit, officialTitle) {
  const expected = packageFacts(unit);
  const actual = packageFacts(officialTitle);
  if (!expected.length) return false;

  const multiplier = normalize(unit).match(
    /(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*(kg|g|ml|l)\b/,
  );
  if (multiplier) {
    const count = Number(multiplier[1]);
    const totalFacts = packageFacts(
      `${count * Number(multiplier[2])} ${multiplier[3]}`,
    );
    const countMatches = actual.some(
      (fact) => fact.kind === "count" && Math.abs(fact.amount - count) <= 0.05,
    );
    const totalMatches = totalFacts.some((total) =>
      actual.some(
        (fact) =>
          fact.kind === total.kind &&
          Math.abs(fact.amount - total.amount) <= Math.max(0.05, total.amount * 0.02),
      ),
    );
    if (!countMatches && !totalMatches) return false;
  }

  const sharedKinds = new Set(expected.map((fact) => fact.kind).filter((kind) =>
    actual.some((fact) => fact.kind === kind),
  ));
  if (!sharedKinds.size) return false;
  return [...sharedKinds].every((kind) => expected.some((left) =>
    actual.some((right) =>
      right.kind === kind && Math.abs(left.amount - right.amount) <= Math.max(0.05, left.amount * 0.02),
    ),
  ));
}

export function extractOfficialTitle(html) {
  const match = html.match(/<h2[^>]*data-testid="pdpInfoTitle-h2-testId"[^>]*>([\s\S]*?)<\/h2>/i);
  return match ? htmlDecode(match[1].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim() : "";
}

export function extractCatalogCandidates(html) {
  const seen = new Set();
  const candidates = [];
  for (const match of html.matchAll(/\/product\/([^"'<>?\s]+?)-id-(\d{4,})/g)) {
    const productNumber = match[2];
    if (seen.has(productNumber)) continue;
    seen.add(productNumber);
    const slug = htmlDecode(match[1]);
    candidates.push({
      catalogName: slug.replace(/-/g, " "),
      imageUrl: `${imageBaseUrl}/${productNumber}.jpg`,
      productNumber,
      sourceUrl: `${productBaseUrl}/product/${slug}-id-${productNumber}`,
    });
  }
  return candidates;
}
