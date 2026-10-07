import type { Locale } from "../i18n/types";
import type { BlogPost } from "../data/blogPosts";
import { fromRow, type BlogRow } from "../utils/blogRows";
import { localizedBlogPosts } from "../utils/blogEditor";
import { blogDocument, blogImagePaths, BLOG_IMAGE_BUCKET, safeBlogUrl } from "../utils/blogContent";

export type PublicBackend = { url: string; key: string };
const META_SELECT =
  "id,slug,locale,status,title,description,excerpt,published_on,read_minutes,updated_at,category,author_name,cover_image_path,cover_image_alt,publish_at,is_pinned";

// Bound backend responses before parsing, including chunked responses without Content-Length.
async function readJson(response: Response, limit = 4 * 1024 * 1024): Promise<unknown> {
  if (!response.ok || !response.body) throw new Error("Public blog backend unavailable");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > limit) throw new Error("Public blog response too large");
      chunks.push(value);
    }
  } finally {
    await reader.cancel();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}

function isRow(value: unknown): value is BlogRow {
  if (!value || typeof value !== "object") return false;
  const r = value as Partial<BlogRow>;
  return (
    typeof r.id === "string" &&
    typeof r.slug === "string" &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(r.slug) &&
    (r.locale === "en" || r.locale === "fr") &&
    (r.status === "published" || r.status === "scheduled") &&
    typeof r.title === "string" &&
    typeof r.description === "string" &&
    typeof r.excerpt === "string" &&
    typeof r.published_on === "string" &&
    Number.isFinite(Date.parse(r.published_on)) &&
    typeof r.read_minutes === "number" &&
    typeof r.updated_at === "string"
  );
}

async function rows(
  config: PublicBackend,
  locale: Locale | null,
  slug?: string | null,
): Promise<BlogRow[]> {
  if (!config.url || !config.key) throw new Error("Public blog backend missing");
  const result: BlogRow[] = [];
  const signal = AbortSignal.timeout(8000);
  for (let page = 0; page < 40; page++) {
    const url = new URL("/rest/v1/published_blog_posts", config.url);
    url.searchParams.set("select", slug ? `${META_SELECT},content,sections` : META_SELECT);
    url.searchParams.set("order", "id.asc");
    if (locale) url.searchParams.set("locale", locale === "fr" ? "in.(en,fr)" : "eq.en");
    if (slug) url.searchParams.set("slug", `eq.${slug}`);
    const response = await fetch(url, {
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        Range: `${page * 250}-${page * 250 + 249}`,
      },
      signal,
    });
    const data = await readJson(response);
    if (!Array.isArray(data) || !data.every(isRow)) throw new Error("Invalid public blog response");
    result.push(...data);
    if (data.length < 250) return result;
  }
  throw new Error("Public blog pagination limit reached");
}

export async function publishedMetadata(config: PublicBackend): Promise<BlogRow[]> {
  return rows(config, null);
}

export async function publicBlogPage(config: PublicBackend, locale: Locale, slug: string | null) {
  const [metadata, article] = await Promise.all([
    rows(config, locale),
    slug ? rows(config, null, slug) : Promise.resolve([]),
  ]);
  // Only the published view is read. A request's cookies/authentication are never forwarded.
  const merged = metadata.map(
    (row) => article.find((p) => p.id === row.id) ?? { ...row, sections: [] },
  );
  const posts = localizedBlogPosts(merged.map(fromRow), locale);
  const available = slug ? article.map((r) => r.locale) : (["en", "fr"] as Locale[]);
  const selected = slug ? posts.find((p) => p.slug === slug) : posts[0];
  const displayed = slug
    ? [selected, ...posts.filter((p) => p.slug !== slug).slice(0, 3)].filter(
        (p): p is BlogPost => !!p,
      )
    : posts;
  await signImages(config, displayed);
  return {
    posts,
    alternates: [...new Set(available)],
    found: !slug || !!selected,
    fallbackToEnglish:
      !!slug && locale === "fr" && !available.includes("fr") && available.includes("en"),
  };
}

async function signImages(config: PublicBackend, posts: BlogPost[]) {
  const paths = [
    ...new Set(posts.flatMap((post) => blogImagePaths(blogDocument(post), post.coverImagePath))),
  ];
  if (!paths.length) return;
  // Public storage policies sign only assets referenced by currently public articles.
  const response = await fetch(
    new URL(`/storage/v1/object/sign/${BLOG_IMAGE_BUCKET}`, config.url),
    {
      method: "POST",
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paths, expiresIn: 3600 }),
      signal: AbortSignal.timeout(8000),
    },
  );
  const data = await readJson(response);
  if (!Array.isArray(data)) throw new Error("Invalid public image response");
  const imageUrls: Record<string, string> = {};
  for (const image of data) {
    if (!image || typeof image.path !== "string" || !paths.includes(image.path)) continue;
    const signed = image.signedURL ?? image.signedUrl;
    if (typeof signed !== "string") continue;
    const relative =
      signed.startsWith("/") && !signed.startsWith("/storage/v1/")
        ? `/storage/v1${signed}`
        : signed;
    const url = safeBlogUrl(new URL(relative, config.url).href, true);
    if (url) imageUrls[image.path] = url;
  }
  for (const post of posts) post.imageUrls = imageUrls;
}
