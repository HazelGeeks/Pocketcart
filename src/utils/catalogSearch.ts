export const RECENT_SEARCH_LIMIT = 10;

export function cleanSearch(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, 80);
}

export function normalizeRecentSearches(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.filter((entry): entry is string => typeof entry === "string")
    .map(cleanSearch).filter((entry) => {
      const key = entry.toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, RECENT_SEARCH_LIMIT);
}

export function searchSuggestions(names: string[], query: string): string[] {
  const term = cleanSearch(query).toLowerCase();
  if (!term) return [];
  const phrases: string[] = [];
  const fullNames: string[] = [];
  for (const raw of names) {
    const name = cleanSearch(raw);
    if (!name.toLowerCase().includes(term)) continue;
    const words = name.split(" ");
    for (let i = 0; i < words.length; i++) {
      const phrase = words.slice(i, i + Math.max(2, term.split(" ").length)).join(" ");
      if (phrase.toLowerCase().startsWith(term)) {
        if (words[i].toLowerCase().startsWith(term)) phrases.push(words[i]);
        phrases.push(phrase);
      }
    }
    fullNames.push(name);
  }
  return normalizeRecentSearches([...phrases, ...fullNames]).slice(0, 8);
}
