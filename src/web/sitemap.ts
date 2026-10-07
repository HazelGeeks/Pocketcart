import { BASE_URL, localizedPath } from "./seo";
import type { BlogRow } from "../utils/blogRows";

function xml(value: string) {
  return value.replace(
    /[<>&"']/g,
    (char) =>
      ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[char] ?? char,
  );
}

export function sitemap(rows: BlogRow[]) {
  const pages = ["/", "/blog", "/privacy", "/terms", "/support"];
  const entries = pages.flatMap((path) =>
    (["en", "fr"] as const).map((locale) => ({
      url: `${BASE_URL}${localizedPath(path, locale)}`,
      modified: null as string | null,
    })),
  );
  for (const row of rows)
    entries.push({
      url: `${BASE_URL}${localizedPath(`/blog/${row.slug}`, row.locale)}`,
      modified: Number.isFinite(Date.parse(row.updated_at))
        ? new Date(row.updated_at).toISOString()
        : null,
    });
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries
    .map(
      (entry) =>
        `<url><loc>${xml(entry.url)}</loc>${entry.modified ? `<lastmod>${entry.modified}</lastmod>` : ""}</url>`,
    )
    .join("")}</urlset>`;
}
