const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { sourceModule } = require("./helpers/sourceModule.cjs");
const content = sourceModule("src/utils/blogContent.ts", {}, { URL });
const dates = sourceModule("src/utils/businessDateTime.ts", {});
const utils = sourceModule("src/utils/blogEditor.ts", {
  "./blogContent": content,
  "./businessDateTime": dates,
});
const paged = sourceModule("src/utils/paginatedQuery.ts", {});
const legacy = sourceModule("src/data/blogPosts.ts", {});
const draft = () => ({
  slug: "new-article",
  locale: "en",
  title: "New article",
  description: "Description",
  excerpt: "Excerpt",
  publishedAt: "2026-10-07",
  readMinutes: 3,
  sections: [{ heading: "First section", paragraphs: ["Hello <script>alert(1)</script>"] }],
});
const row = (overrides = {}) => ({
  id: "post-id",
  slug: "new-article",
  locale: "en",
  status: "published",
  title: "New article",
  description: "Description",
  excerpt: "Excerpt",
  published_on: "2026-10-07",
  read_minutes: 3,
  sections: [{ heading: "First section", paragraphs: ["Body"] }],
  updated_at: "2026-10-07T15:00:00.000Z",
  ...overrides,
});
function service(response, calls = []) {
  const builder = new Proxy(
    {},
    {
      get: (_, key) => {
        if (key === "then") return (resolve) => resolve(response);
        return (...args) => {
          calls.push([key, ...args]);
          return builder;
        };
      },
    },
  );
  return sourceModule("src/services/blog.ts", {
    "../data/blogPosts": legacy,
    "../utils/paginatedQuery": paged,
    "../utils/blogEditor": utils,
    "./blogImages": { signBlogImages: async (posts) => posts },
    "./supabaseClient": {
      hasSupabaseEnv: true,
      supabase: {
        from: (name) => {
          calls.push(["from", name]);
          return builder;
        },
      },
    },
  });
}

test("incomplete drafts can be saved but cannot be published; invalid dates and URL slugs are rejected", () => {
  const incomplete = { ...draft(), description: "", excerpt: "", sections: [] };
  assert.equal(utils.validateBlogDraft(incomplete, "draft"), null);
  assert.match(utils.validateBlogDraft(incomplete, "published"), /before publishing/);
  assert.match(
    utils.validateBlogDraft({ ...draft(), publishedAt: "2026-02-30" }, "published"),
    /valid article date/,
  );
  assert.match(utils.validateBlogDraft({ ...draft(), slug: "../admin" }, "published"), /URL slug/);
  assert.equal(utils.blogSlug("Économies & Grocery tips"), "economies-grocery-tips");
});

test("French uses a published translation before English fallback, with stable newest-first ordering", () => {
  const posts = [
    { ...draft(), title: "English" },
    { ...draft(), locale: "fr", title: "Français" },
    { ...draft(), slug: "older", publishedAt: "2026-01-01" },
  ];
  const french = utils.localizedBlogPosts(posts, "fr");
  assert.equal(french.length, 2);
  assert.equal(french[0].title, "Français");
  assert.equal(utils.localizedBlogPosts(posts, "en")[0].title, "English");
});

test("public blog reads filter published status even for an authenticated administrator", async () => {
  const calls = [];
  const posts = await service({ data: [row()], error: null }, calls).listPublishedBlogPosts("en");
  assert.equal(posts.length, 1);
  assert.ok(calls.some((c) => c[0] === "from" && c[1] === "published_blog_posts"));
});

test("unpublished articles are never resurrected by an empty result or a network outage", async () => {
  assert.equal((await service({ data: [], error: null }).listPublishedBlogPosts("en")).length, 0);
  await assert.rejects(
    service({
      data: null,
      error: { code: "42501", message: "Permission denied" },
    }).listPublishedBlogPosts("en"),
    /permission/,
  );
  assert.equal(
    (
      await service({
        data: null,
        error: { code: "PGRST205", message: "Missing table" },
      }).listPublishedBlogPosts("en")
    ).length,
    6,
  );
});

test("editing requires the loaded revision; conflicts preserve the editor instead of overwriting another author", async () => {
  const calls = [];
  const existing = { ...draft(), id: "post-id", status: "draft", updatedAt: "previous-revision" };
  await assert.rejects(
    service({ data: null, error: null }, calls).saveBlogPost(draft(), "published", existing),
    /another session/,
  );
  assert.ok(
    calls.some((c) => c[0] === "eq" && c[1] === "updated_at" && c[2] === "previous-revision"),
  );
  await assert.rejects(
    service({ data: null, error: { code: "23505", message: "duplicate" } }).saveBlogPost(
      draft(),
      "draft",
      null,
    ),
    /already exists/,
  );
});

test("blog migration preserves all 12 existing English/French articles without overriding later edits", () => {
  const sql = fs.readFileSync("supabase/migrations/20261007010000_blog_posts.sql", "utf8");
  const seed = JSON.parse(sql.split("$blog_seed$")[1]);
  assert.equal(seed.length, 12);
  for (const locale of ["en", "fr"])
    for (const article of legacy.getBlogPosts(locale)) {
      const migrated = seed.find((p) => p.slug === article.slug && p.locale === locale);
      assert.equal(migrated.title, article.title);
      assert.deepEqual(migrated.sections, JSON.parse(JSON.stringify(article.sections)));
    }
  assert.match(sql, /on conflict \(slug,locale\) do nothing/);
});

test("publishing tolerates trailing blank paragraphs and auto-generated slugs stay valid at the length limit", () => {
  const input = draft();
  input.sections[0].paragraphs.push("", "  ");
  const payload = utils.blogPayload(input, "published");
  assert.equal(payload.sections[0].paragraphs.length, 1);
  assert.match(utils.blogSlug("a".repeat(119) + " b"), /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.equal(utils.blogSlug("a".repeat(119) + " b").length, 119);
});

test("rich content saves formatting and media references without persisting expiring signed URLs", () => {
  const path = "00000000-0000-0000-0000-000000000001/00000000-0000-0000-0000-000000000003.png";
  const input = {
    ...draft(),
    content: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Rich paragraph", marks: [{ type: "bold" }] }],
        },
        {
          type: "image",
          attrs: {
            assetPath: path,
            src: "https://example.com/temporary?token=private",
            alt: "Example",
          },
        },
      ],
    },
    category: "Savings",
    authorName: "Editor",
    isPinned: true,
    description: "",
    excerpt: "",
  };
  const payload = utils.blogPayload(input, "published");
  assert.equal(payload.content.content[0].content[0].marks[0].type, "bold");
  assert.equal(payload.content.content[1].attrs.src, "");
  assert.equal(payload.content.content[1].attrs.assetPath, path);
  assert.equal(payload.description, "Rich paragraph");
  assert.equal(payload.author_name, "Editor");
  assert.equal(payload.is_pinned, true);
});

test("unsafe URLs and invalid rich documents cannot be saved", () => {
  for (const url of [
    "javascript:alert(1)",
    "data:text/html,test",
    "java\nscript:alert(1)",
    "//example.com",
    "https://example.com\\path",
  ])
    assert.equal(content.safeBlogUrl(url), null);
  assert.equal(content.safeBlogUrl("https://example.com/article"), "https://example.com/article");
  assert.match(
    content.validateBlogDocument({ type: "doc", content: [{ type: "script", text: "alert(1)" }] }),
    /unsupported/,
  );
  assert.throws(
    () =>
      utils.blogPayload(
        {
          ...draft(),
          content: {
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "Click",
                    marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
                  },
                ],
              },
            ],
          },
        },
        "published",
      ),
    /unsafe/,
  );
});

test("future publication remains private until the scheduled time, and pinned articles sort first", () => {
  const input = {
    ...draft(),
    content: content.sectionsToDocument(draft().sections),
    publishAt: "2099-01-01T00:00:00Z",
  };
  const payload = utils.blogPayload(input, "published");
  assert.equal(payload.status, "scheduled");
  assert.equal(
    utils.blogIsPublic(
      { status: "scheduled", publishAt: payload.publish_at },
      new Date("2098-01-01").getTime(),
    ),
    false,
  );
  assert.equal(
    utils.blogIsPublic(
      { status: "scheduled", publishAt: payload.publish_at },
      new Date("2100-01-01").getTime(),
    ),
    true,
  );
  const posts = utils.localizedBlogPosts(
    [
      { ...draft(), slug: "newer", publishedAt: "2026-10-07" },
      { ...draft(), slug: "pinned", publishedAt: "2026-01-01", isPinned: true },
    ],
    "en",
  );
  assert.equal(posts[0].slug, "pinned");
});
