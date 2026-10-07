import { lazy, Suspense, useRef, useState } from "react";
import useAdminBlogEditor from "../../hooks/useAdminBlogEditor";
import {
  blogIsPublic,
  blogSlug,
  localPublishInput,
  parseLocalPublishInput,
  type ManagedBlogPost,
} from "../../utils/blogEditor";
import { blogDocument } from "../../utils/blogContent";
import BlogArticleBody from "../blog/BlogArticleBody";
import "./adminBlog.css";
const BlogRichTextEditor = lazy(() => import("./BlogRichTextEditor"));
const CATEGORIES = ["Shopping tips", "Savings", "Food & storage", "Product updates"];

export default function AdminBlogPanel({ active }: { active: boolean }) {
  const editor = useAdminBlogEditor(active);
  const { query, draft, existing, dirty, busy, notice, preview, edit, save } = editor;
  const [view, setView] = useState<"list" | "editor">("list");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [language, setLanguage] = useState("all");
  const [page, setPage] = useState(0);
  const [dateIssue, setDateIssue] = useState("");
  const coverInput = useRef<HTMLInputElement>(null);
  const locked = busy || editor.uploads > 0;
  const posts = (query.data ?? []).filter(
    (post) =>
      (status === "all" ||
        (status === "published"
          ? blogIsPublic(post)
          : status === "scheduled"
            ? post.status === "scheduled" && !blogIsPublic(post)
            : post.status === "draft")) &&
      (language === "all" || post.locale === language) &&
      `${post.title} ${post.slug}`.toLowerCase().includes(search.toLowerCase().trim()),
  );
  const safePage = Math.min(page, Math.max(0, Math.ceil(posts.length / 12) - 1));
  const coverUrl = draft.coverImagePath ? draft.imageUrls?.[draft.coverImagePath] : undefined;
  function open(post: ManagedBlogPost | null) {
    if (editor.open(post)) {
      setView("editor");
      setDateIssue("");
    }
  }
  async function cover(file: File | undefined) {
    if (!file || locked) return;
    const image = await editor.uploadImage(file);
    if (image) edit({ coverImagePath: image.path });
  }
  function changePublicationTime(value: string) {
    try {
      edit({ publishAt: parseLocalPublishInput(value) });
      setDateIssue("");
    } catch (error) {
      setDateIssue(error instanceof Error ? error.message : "Invalid publication time.");
    }
  }
  const saveDisabled = locked || query.isLoading || !!query.error || !!dateIssue;
  return (
    <div className="pc-admin-blog" hidden={!active}>
      {query.error ? (
        <div className="pc-admin-blog-message" role="alert">
          {query.error instanceof Error ? query.error.message : "Unable to load articles."}
          <button
            type="button"
            onClick={() => {
              void query.refetch();
            }}
          >
            Retry loading
          </button>
        </div>
      ) : null}
      {view === "list" ? (
        <section className="pc-blog-directory" aria-label="Blog articles">
          <div className="pc-admin-blog-toolbar">
            <div>
              <h2>
                Articles <span>{query.data?.length ?? 0}</span>
              </h2>
              <p className="pc-admin-blog-hint">
                Manage drafts, published articles, and scheduled posts.
              </p>
            </div>
            <div className="pc-admin-blog-actions">
              {dirty ? (
                <button type="button" onClick={() => setView("editor")}>
                  Resume editing
                </button>
              ) : null}
              <button
                type="button"
                className="pc-admin-blog-primary"
                disabled={locked}
                onClick={() => open(null)}
              >
                + New article
              </button>
            </div>
          </div>
          <div className="pc-blog-directory-filters">
            <label>
              Search articles
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
              />
            </label>
            <label>
              Status
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(0);
                }}
              >
                <option value="all">All statuses</option>
                <option value="draft">Drafts</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </label>
            <label>
              Language
              <select
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value);
                  setPage(0);
                }}
              >
                <option value="all">All languages</option>
                <option value="en">English</option>
                <option value="fr">French</option>
              </select>
            </label>
          </div>
          {query.isLoading ? <p role="status">Loading articles…</p> : null}
          {!query.isLoading && !query.error && !posts.length ? (
            <p>No matching articles. Create a draft to get started.</p>
          ) : null}
          <div className="pc-blog-directory-rows">
            {posts.slice(safePage * 12, safePage * 12 + 12).map((post) => (
              <button
                type="button"
                key={post.id}
                className="pc-admin-blog-row"
                disabled={locked}
                onClick={() => open(post)}
              >
                <span>
                  <strong>{post.title}</strong>
                  <small>
                    {post.category ?? "Shopping tips"} · {post.authorName ?? "Pocketcart"} · /blog/
                    {post.slug}
                  </small>
                </span>
                <span className="pc-blog-directory-meta">
                  <b
                    className={`pc-admin-blog-badge ${blogIsPublic(post) ? "published" : post.status}`}
                  >
                    {blogIsPublic(post) ? "published" : post.status}
                  </b>
                  <span>
                    {post.locale.toUpperCase()} · {post.publishedAt}
                    {post.isPinned ? " · Pinned" : ""}
                  </span>
                </span>
              </button>
            ))}
          </div>
          <div className="pc-admin-blog-toolbar">
            <button
              type="button"
              disabled={query.isFetching}
              onClick={() => {
                void query.refetch();
              }}
            >
              Refresh articles
            </button>
            {posts.length > 12 ? (
              <div className="pc-admin-blog-actions">
                <button
                  type="button"
                  disabled={safePage === 0}
                  onClick={() => setPage(safePage - 1)}
                >
                  Previous
                </button>
                <span>
                  {safePage + 1} / {Math.ceil(posts.length / 12)}
                </span>
                <button
                  type="button"
                  disabled={(safePage + 1) * 12 >= posts.length}
                  onClick={() => setPage(safePage + 1)}
                >
                  Next
                </button>
              </div>
            ) : null}
          </div>
        </section>
      ) : (
        <section className="pc-blog-compose" aria-label="Article editor">
          <div className="pc-admin-blog-toolbar pc-blog-compose-header">
            <button type="button" onClick={() => setView("list")}>
              ← Articles
            </button>
            <div className="pc-admin-blog-actions">
              {dirty ? <span className="pc-admin-blog-unsaved">Unsaved changes</span> : null}
              <button type="button" onClick={() => editor.setPreview(!preview)}>
                {preview ? "Edit article" : "Preview"}
              </button>
            </div>
          </div>
          {notice ? (
            <div role="status" className="pc-admin-blog-message">
              {notice}
            </div>
          ) : null}
          {preview ? (
            <article className="pc-admin-blog-preview" lang={draft.locale}>
              <p>
                {draft.category} · {draft.authorName} · {draft.publishedAt}
              </p>
              <h1>{draft.title || "Untitled article"}</h1>
              <p>{draft.description}</p>
              {coverUrl ? (
                <img className="pc-blog-cover" src={coverUrl} alt={draft.coverImageAlt ?? ""} />
              ) : null}
              <BlogArticleBody post={draft} />
            </article>
          ) : (
            <>
              <fieldset disabled={locked}>
                <div className="pc-blog-compose-grid">
                  <label>
                    Article title
                    <input
                      value={draft.title}
                      maxLength={200}
                      onChange={(e) => edit({ title: e.target.value })}
                    />
                  </label>
                  <label>
                    Category
                    <input
                      list="pc-blog-categories"
                      value={draft.category ?? ""}
                      maxLength={80}
                      onChange={(e) => edit({ category: e.target.value })}
                    />
                    <datalist id="pc-blog-categories">
                      {[
                        ...new Set([
                          ...CATEGORIES,
                          ...(query.data ?? [])
                            .map((post) => post.category)
                            .filter((value): value is string => !!value),
                        ]),
                      ].map((category) => (
                        <option key={category} value={category} />
                      ))}
                    </datalist>
                  </label>
                </div>
              </fieldset>
              <Suspense fallback={<div className="pc-rich-editor-loading">Loading editor…</div>}>
                <BlogRichTextEditor
                  key={editor.documentKey}
                  value={blogDocument(draft)}
                  imageUrls={draft.imageUrls ?? {}}
                  disabled={locked}
                  onChange={editor.changeContent}
                  onUpload={editor.uploadImage}
                />
              </Suspense>
              <fieldset disabled={locked}>
                <div className="pc-blog-compose-grid">
                  <div className="pc-blog-cover-field">
                    <span>Cover image</span>
                    <button
                      type="button"
                      className={`pc-blog-cover-upload${coverUrl ? " has-image" : ""}`}
                      onClick={() => coverInput.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        void cover(e.dataTransfer.files[0]);
                      }}
                    >
                      {coverUrl ? (
                        <img src={coverUrl} alt={draft.coverImageAlt || "Cover preview"} />
                      ) : (
                        <>
                          <span aria-hidden="true">▧</span>
                          <span>
                            JPG, PNG, WebP · up to 5 MB
                            <br />
                            <small>Click to upload or drop an image here</small>
                          </span>
                        </>
                      )}
                    </button>
                    <input
                      type="file"
                      ref={coverInput}
                      accept="image/jpeg,image/png,image/webp"
                      hidden
                      onChange={(e) => {
                        void cover(e.target.files?.[0]);
                        e.target.value = "";
                      }}
                    />
                    {draft.coverImagePath ? (
                      <button
                        type="button"
                        className="pc-blog-remove-cover"
                        onClick={() => edit({ coverImagePath: "", coverImageAlt: "" })}
                      >
                        Remove cover
                      </button>
                    ) : null}
                  </div>
                  <label>
                    Cover image alt text
                    <input
                      value={draft.coverImageAlt ?? ""}
                      maxLength={500}
                      onChange={(e) => edit({ coverImageAlt: e.target.value })}
                    />
                  </label>
                </div>
                <div className="pc-blog-compose-grid">
                  <label>
                    Author
                    <input
                      value={draft.authorName ?? ""}
                      maxLength={200}
                      onChange={(e) => edit({ authorName: e.target.value })}
                    />
                  </label>
                  <label>
                    Publication status
                    <select
                      value={editor.editorStatus}
                      onChange={(e) =>
                        editor.setEditorStatus(
                          e.target.value as "draft" | "published" | "scheduled",
                        )
                      }
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="scheduled">Scheduled</option>
                    </select>
                  </label>
                </div>
                <div className="pc-blog-compose-grid">
                  <label>
                    Publish at (local time)
                    <input
                      type="datetime-local"
                      value={localPublishInput(draft.publishAt)}
                      onInput={(e) => changePublicationTime(e.currentTarget.value)}
                      onChange={(e) => changePublicationTime(e.target.value)}
                    />
                    <small>
                      Leave empty to publish immediately. A future time schedules the article when
                      you save it as Published or Scheduled.
                    </small>
                  </label>
                  <label className="pc-blog-pin-control">
                    <input
                      type="checkbox"
                      checked={draft.isPinned ?? false}
                      onChange={(e) => edit({ isPinned: e.target.checked })}
                    />
                    <span>
                      Pin to top<small>Only public articles appear at the top of the blog.</small>
                    </span>
                  </label>
                </div>
                {dateIssue ? <p role="alert">{dateIssue}</p> : null}
                <details className="pc-blog-advanced">
                  <summary>URL, language & search description</summary>
                  <div className="pc-blog-compose-grid">
                    <label>
                      URL slug
                      <input
                        value={draft.slug}
                        placeholder={blogSlug(draft.title) || "your-article-title"}
                        readOnly={Boolean(existing)}
                        maxLength={120}
                        onChange={(e) => edit({ slug: e.target.value })}
                      />
                      <small>Generated from the title if empty. Saved URLs remain fixed.</small>
                    </label>
                    <label>
                      Language
                      <select
                        value={draft.locale}
                        disabled={!!existing || locked}
                        onChange={(e) => edit({ locale: e.target.value === "fr" ? "fr" : "en" })}
                      >
                        <option value="en">English</option>
                        <option value="fr">French</option>
                      </select>
                    </label>
                  </div>
                  <label>
                    Description
                    <textarea
                      rows={2}
                      value={draft.description}
                      maxLength={500}
                      onChange={(e) => edit({ description: e.target.value })}
                    />
                    <small>Generated from the article body if empty.</small>
                  </label>
                  <label>
                    Excerpt
                    <textarea
                      rows={2}
                      value={draft.excerpt}
                      maxLength={500}
                      onChange={(e) => edit({ excerpt: e.target.value })}
                    />
                  </label>
                  <label>
                    Reading time (minutes)
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={draft.readMinutes}
                      onChange={(e) => edit({ readMinutes: Number(e.target.value) })}
                    />
                  </label>
                </details>
              </fieldset>
            </>
          )}
          <div className="pc-blog-compose-footer">
            <div>
              {existing && blogIsPublic(existing) ? (
                <a href={`/blog/${existing.slug}`} target="_blank" rel="noopener noreferrer">
                  View public article ↗
                </a>
              ) : (
                <span className="pc-admin-blog-hint">
                  Drafts and future scheduled posts are private.
                </span>
              )}
            </div>
            <div className="pc-admin-blog-actions">
              <button
                type="button"
                disabled={locked}
                onClick={() => {
                  if (editor.open(existing)) {
                    setView("list");
                    setDateIssue("");
                  }
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="pc-admin-blog-primary"
                disabled={saveDisabled}
                onClick={() => {
                  void save(editor.editorStatus);
                }}
              >
                {busy ? "Saving…" : editor.uploads ? "Uploading…" : "Save article"}
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
