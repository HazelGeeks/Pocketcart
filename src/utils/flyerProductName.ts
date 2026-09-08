const SIZE = /(?:\d+(?:\.\d+)?\s*[x×]\s*)?\d+(?:\.\d+)?\s*(?:kg|mg|g|ml|l|oz|lbs?|ct)\b/i;

export function flyerProductName(value: string, unit = ""): string {
  const name = value.trim();
  if (!name) return "";
  const suffix = name.match(new RegExp(`\\s*\\(?(${SIZE.source})\\)?\\s*$`, "i"));
  const unitSize = unit.trim().match(new RegExp(`^${SIZE.source}$`, "i"));
  const size = suffix?.[1] ?? unitSize?.[0];
  if (!size) return name;
  const base = suffix ? name.slice(0, suffix.index).trim() : name;
  if (!base) return name;
  const formatted = size.toLowerCase().replace(/\s*[x×]\s*/g, " x ").replace(/(\d)\s*([a-z])/g, "$1 $2");
  return `${base} (${formatted})`;
}
