const test = require("node:test");
const assert = require("node:assert/strict");
const React = require("react");
const { renderToReadableStream } = require("react-dom/server");
const { sourceModule } = require("./helpers/sourceModule.cjs");
const content = sourceModule("src/utils/blogContent.ts", {}, { URL });
const editor = sourceModule("src/utils/blogEditor.ts", {
  "./blogContent": content,
  "./businessDateTime": sourceModule("src/utils/businessDateTime.ts", {}),
});
const rows = sourceModule("src/utils/blogRows.ts", {});
const copy = {
  SITE_COPY: {
    en: sourceModule("src/i18n/siteCopy.en.ts", {}).enSiteCopy,
    fr: sourceModule("src/i18n/siteCopy.fr.ts", {}).frSiteCopy,
  },
};
const seo = sourceModule("src/web/seo.ts", {}, { URL });
const Body = sourceModule("src/components/blog/BlogArticleBody.tsx", {
  react: React,
  "../../utils/blogContent": content,
});
const BlogContent = sourceModule("src/components/blog/BlogContent.tsx", {
  react: React,
  "../../i18n/siteCopy": copy,
  "../../utils/blogContent": content,
  "./BlogArticleBody": Body,
});
const document = sourceModule(
  "src/web/BlogDocument.tsx",
  {
    react: React,
    "../components/blog/BlogContent": BlogContent,
    "../i18n/siteCopy": copy,
    "./seo": seo,
  },
  { URL, __PUBLIC_ANALYTICS_ID__: "" },
);
const sitemap = sourceModule("src/web/sitemap.ts", { "./seo": seo });
const row = (locale = "en", overrides = {}) => ({
  id: locale,
  slug: "shopping-plan",
  locale,
  status: "published",
  title: locale === "fr" ? "Plan de courses" : "Shopping plan",
  description: "Description </script><script>unsafe()</script>",
  excerpt: "Excerpt",
  published_on: "2026-10-07",
  read_minutes: 3,
  updated_at: "2026-10-07T12:00:00Z",
  author_name: "Pocketcart",
  sections: [],
  content: {
    type: "doc",
    content: [
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "A real heading" }] },
      { type: "paragraph", content: [{ type: "text", text: "Body available without JavaScript" }] },
    ],
  },
  ...overrides,
});

function setup(data, failure = false) {
  const calls = [];
  const backend = sourceModule(
    "src/web/publishedPosts.ts",
    {
      "../utils/blogRows": rows,
      "../utils/blogEditor": editor,
      "../utils/blogContent": content,
    },
    {
      URL,
      Response,
      AbortSignal,
      TextDecoder,
      fetch: async (url, options) => {
        calls.push({ url: String(url), options });
        if (failure) return new Response("unavailable", { status: 503 });
        let result = data;
        const parsed = new URL(url);
        if (parsed.searchParams.has("slug"))
          result = result.filter((r) => `eq.${r.slug}` === parsed.searchParams.get("slug"));
        if (parsed.searchParams.get("locale") === "eq.en")
          result = result.filter((r) => r.locale === "en");
        return Response.json(result);
      },
    },
  );
  const worker = sourceModule(
    "src/web/worker.tsx",
    {
      react: React,
      "react-dom/server.browser": { renderToReadableStream },
      "./BlogDocument": document,
      "./publishedPosts": backend,
      "./sitemap": sitemap,
    },
    {
      Request,
      Response,
      Headers,
      URL,
      __PUBLIC_BACKEND__: { url: "https://backend.example.invalid", key: "anonymous-only" },
      __PUBLIC_CSS_PATH__: "/public-blog-test.css",
      console: { error() {} },
    },
  ).default;
  const assets = [];
  const env = {
    ASSETS: {
      fetch: async (request) => {
        assets.push(new URL(request.url).pathname);
        return new URL(request.url).pathname.startsWith("/rendered/") ||
          request.url.endsWith("/index.html")
          ? new Response("Static page", { headers: { "Content-Type": "text/html" } })
          : new Response("Not found", { status: 404 });
      },
    },
  };
  const fetchPage = (url, options) =>
    worker.fetch(new Request(`https://pocketcart.app${url}`, options), env);
  return { calls, assets, fetchPage, backend };
}

test("server-rendered article contains body, localized SEO and escaped valid JSON-LD on the initial response", async () => {
  const { calls, fetchPage } = setup([row(), row("fr")]);
  const response = await fetchPage("/blog/shopping-plan?lang=fr", {
    headers: { Authorization: "Bearer administrator-token", Cookie: "private-session" },
  });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<html lang="fr"/);
  assert.match(html, /<h1>Plan de courses<\/h1>/);
  assert.match(html, /Body available without JavaScript/);
  assert.match(html, /href="https:\/\/pocketcart.app\/blog\/shopping-plan\?lang=fr"/);
  assert.match(html, /hrefLang="en"|hrefLang="en"|hreflang="en"/i);
  assert.match(html, /href="#main-content"/);
  assert.doesNotMatch(html, /AppEntry|Loading articles|<script>unsafe/);
  const json = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1];
  assert.equal(JSON.parse(json).author.name, "Pocketcart");
  assert.equal(JSON.parse(json).inLanguage, "fr");
  for (const call of calls) {
    assert.equal(new URL(call.url).pathname, "/rest/v1/published_blog_posts");
    assert.equal(call.options.headers.Authorization, "Bearer anonymous-only");
    assert.equal(call.options.headers.Cookie, undefined);
  }
});

test("unpublished/missing URLs are 404, backend outages are 503, and neither restores bundled posts", async () => {
  for (const [fixture, path, status] of [
    [setup([]), "/blog/missing", 404],
    [setup([], true), "/blog/shopping-plan", 503],
  ]) {
    const response = await fixture.fetchPage(path);
    assert.equal(response.status, status);
    assert.equal(response.headers.get("X-Robots-Tag"), "noindex");
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    assert.doesNotMatch(
      await response.text(),
      /Body available without JavaScript|smarter-grocery-watchlist/,
    );
  }
  const bad = await setup([]).fetchPage("/blog/%3Cscript%3E");
  assert.equal(bad.status, 404);
});

test("available translations have reciprocal alternates; absent French translates to an English redirect", async () => {
  const en = await setup([row(), row("fr")]).fetchPage("/blog/shopping-plan");
  assert.match(await en.text(), /hrefLang="fr"|hreflang="fr"/i);
  const fallback = await setup([row()]).fetchPage("/blog/shopping-plan?lang=fr");
  assert.equal(fallback.status, 302);
  assert.equal(
    fallback.headers.get("Location"),
    "https://pocketcart.app/blog/shopping-plan?lang=en",
  );
});

test("dynamic sitemap includes current localized public articles and excludes noindex pages", async () => {
  const response = await setup([row(), row("fr")]).fetchPage("/sitemap.xml");
  assert.equal(response.status, 200);
  const xml = await response.text();
  assert.match(xml, /shopping-plan\?lang=fr/);
  assert.match(xml, /<lastmod>2026-10-07T12:00:00.000Z<\/lastmod>/);
  assert.doesNotMatch(xml, /admin|delete-account|smarter-grocery-watchlist/);
});

test("static localized pages, private SPA routes, HEAD, missing assets and unknown routes have correct handling", async () => {
  const fixture = setup([]);
  assert.equal((await fixture.fetchPage("/support?lang=fr")).status, 200);
  assert.equal(fixture.assets[0], "/rendered/fr/support.html");
  const admin = await fixture.fetchPage("/admin");
  assert.equal(admin.headers.get("X-Robots-Tag"), "noindex, nofollow");
  assert.equal(fixture.assets[1], "/index.html");
  assert.equal((await fixture.fetchPage("/unrecognized-page")).status, 404);
  const asset = await fixture.fetchPage("/missing.js");
  assert.equal(await asset.text(), "Not found");
  const head = await fixture.fetchPage("/blog", { method: "HEAD" });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), "");
  assert.equal((await fixture.fetchPage("/blog", { method: "POST" })).status, 405);
  const redirected = await fixture.fetchPage("/rendered/fr/home.html");
  assert.equal(redirected.headers.get("Location"), "https://pocketcart.app/?lang=fr");
});
