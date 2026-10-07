import type { ReactNode, MouseEvent } from "react";
import type { BlogPost } from "../../data/blogPosts";
import type { Locale } from "../../i18n/types";
import { SITE_COPY } from "../../i18n/siteCopy";
import { blogDocument, blogHeadings } from "../../utils/blogContent";
import BlogArticleBody from "./BlogArticleBody";

function WebLink({
  href,
  onPress,
  children,
  accessibilityLabel,
}: {
  href: string;
  onPress?: () => void;
  children: ReactNode;
  accessibilityLabel?: string;
}) {
  const click = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      !onPress ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    onPress();
  };
  return (
    <a
      href={href}
      onClick={click}
      aria-label={accessibilityLabel}
      style={{ display: "inline-flex" }}
    >
      {children}
    </a>
  );
}

export default function BlogContent({
  posts,
  locale,
  loading = false,
  loadError = null,
  onRetry,
  currentSlug,
  onBackHome,
  onBackToBlog,
  onOpenPost,
  grocerySrc = "/grocery-basket.jpg",
}: {
  posts: BlogPost[];
  locale: Locale;
  loading?: boolean;
  loadError?: string | null;
  onRetry?: () => void;
  currentSlug: string | null;
  onBackHome?: () => void;
  onBackToBlog?: () => void;
  onOpenPost?: (slug: string) => void;
  grocerySrc?: string;
}) {
  const copy = SITE_COPY[locale];
  const selectedPost = posts.find((post) => post.slug === currentSlug);
  const featurePost = posts[0];
  const headings = selectedPost ? blogHeadings(blogDocument(selectedPost)) : [];
  const relatedPosts = posts.filter((post) => post.slug !== selectedPost?.slug).slice(0, 3);
  const dateFormatter = new Intl.DateTimeFormat(locale === "fr" ? "fr-CA" : "en-CA", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  const postHref = (slug: string) => `/blog/${slug}${locale === "fr" ? "?lang=fr" : ""}`;
  const blogHref = locale === "fr" ? "/blog?lang=fr" : "/blog";
  const homeHref = locale === "fr" ? "/?lang=fr" : "/";
  const metadata = (post: BlogPost) => (
    <div className="pc-blog-meta">
      <time dateTime={post.publishedAt}>{dateFormatter.format(new Date(post.publishedAt))}</time>
      <span aria-hidden="true">·</span>
      <span>
        {post.readMinutes} {copy.blog.minutesRead}
      </span>
      {post.authorName ? (
        <>
          <span aria-hidden="true">·</span>
          <span>{post.authorName}</span>
        </>
      ) : null}
      {post.category ? (
        <>
          <span aria-hidden="true">·</span>
          <span>{post.category}</span>
        </>
      ) : null}
    </div>
  );
  const postLink = (post: BlogPost) => (
    <WebLink
      href={postHref(post.slug)}
      onPress={onOpenPost ? () => onOpenPost(post.slug) : undefined}
      accessibilityLabel={`${copy.blog.readArticle}: ${post.title}`}
    >
      <span className="pc-blog-read">
        {copy.blog.readArticle}
        <span aria-hidden="true">↗</span>
      </span>
    </WebLink>
  );
  const cards = (items: BlogPost[]) => (
    <div className="pc-blog-grid">
      {items.map((post, i) => (
        <article key={post.slug} className="pc-blog-card">
          <div className="pc-blog-card-top">
            <span className="pc-eyebrow">POCKETCART JOURNAL</span>
            <span className="pc-blog-index" aria-hidden="true">
              0{i + 1}
            </span>
          </div>
          {post.coverImagePath && post.imageUrls?.[post.coverImagePath] ? (
            <img
              className="pc-blog-card-cover"
              src={post.imageUrls[post.coverImagePath]}
              alt={post.coverImageAlt ?? ""}
              loading="lazy"
            />
          ) : null}
          {metadata(post)}
          <h3>
            <WebLink
              href={postHref(post.slug)}
              onPress={onOpenPost ? () => onOpenPost(post.slug) : undefined}
            >
              {post.title}
            </WebLink>
          </h3>
          <p>{post.excerpt}</p>
          {postLink(post)}
        </article>
      ))}
    </div>
  );

  return (
    <div className="pc-marketing pc-blog">
      <div className="pc-container pc-blog-breadcrumb">
        <WebLink
          href={selectedPost ? blogHref : homeHref}
          onPress={selectedPost ? onBackToBlog : onBackHome}
        >
          <span aria-hidden="true">←</span>
          <span>{selectedPost ? copy.blog.backToBlog : copy.blog.back}</span>
        </WebLink>
      </div>
      {loading || loadError || (currentSlug && !selectedPost) || !featurePost ? (
        <div className="pc-container pc-blog-header" role={loadError ? "alert" : "status"}>
          <div>
            <h1>
              {loading
                ? locale === "fr"
                  ? "Chargement des articles…"
                  : "Loading articles…"
                : loadError
                  ? locale === "fr"
                    ? "Articles indisponibles"
                    : "Articles unavailable"
                  : currentSlug
                    ? locale === "fr"
                      ? "Article introuvable"
                      : "Article not found"
                    : locale === "fr"
                      ? "Les articles arrivent bientôt"
                      : "Articles coming soon"}
            </h1>
            {loadError ? (
              onRetry ? (
                <button type="button" onClick={onRetry}>
                  {locale === "fr" ? "Réessayer" : "Try again"}
                </button>
              ) : (
                <a href={currentSlug ? postHref(currentSlug) : blogHref}>
                  {locale === "fr" ? "Réessayer" : "Try again"}
                </a>
              )
            ) : null}
            {currentSlug && !loading && !loadError ? (
              <WebLink href={blogHref} onPress={onBackToBlog}>
                {copy.blog.backToBlog}
              </WebLink>
            ) : null}
          </div>
        </div>
      ) : selectedPost ? (
        <>
          <header className="pc-container pc-blog-article-header">
            <p className="pc-eyebrow">POCKETCART JOURNAL</p>
            {metadata(selectedPost)}
            <h1>{selectedPost.title}</h1>
            <p className="pc-blog-intro">{selectedPost.description}</p>
            {selectedPost.coverImagePath &&
            selectedPost.imageUrls?.[selectedPost.coverImagePath] ? (
              <img
                className="pc-blog-cover"
                src={selectedPost.imageUrls[selectedPost.coverImagePath]}
                alt={selectedPost.coverImageAlt ?? ""}
              />
            ) : null}
          </header>
          <div className="pc-blog-reading">
            <div
              className={`pc-container pc-blog-reading-grid${headings.length ? "" : " pc-blog-no-toc"}`}
            >
              {headings.length ? (
                <aside className="pc-blog-sidebar">
                  <span className="pc-eyebrow">
                    {locale === "fr" ? "DANS CET ARTICLE" : "IN THIS ARTICLE"}
                  </span>
                  <nav aria-label={locale === "fr" ? "Sommaire" : "Table of contents"}>
                    {headings.map((heading, i) => (
                      <a key={heading.id} href={`#${heading.id}`}>
                        <span>0{i + 1}</span>
                        {heading.text}
                      </a>
                    ))}
                  </nav>
                </aside>
              ) : null}
              <article className="pc-blog-prose">
                <BlogArticleBody post={selectedPost} />
                <div className="pc-blog-article-end">
                  <span>PocketCart Journal</span>
                  <WebLink href={blogHref} onPress={onBackToBlog}>
                    {copy.blog.backToBlog} <span aria-hidden="true">↗</span>
                  </WebLink>
                </div>
              </article>
            </div>
          </div>
          <section className="pc-container pc-blog-latest" aria-labelledby="pc-blog-related">
            <div className="pc-blog-section-heading">
              <h2 id="pc-blog-related">{copy.blog.relatedPosts}</h2>
            </div>
            {cards(relatedPosts)}
          </section>
        </>
      ) : (
        <>
          <header className="pc-container pc-blog-header">
            <div>
              <p className="pc-eyebrow">POCKETCART JOURNAL</p>
              <h1>
                {locale === "fr" ? "De bonnes habitudes." : "Small habits."}
                <br />
                <span>{locale === "fr" ? "De meilleures courses." : "Better grocery runs."}</span>
              </h1>
            </div>
            <p className="pc-blog-intro">
              {locale === "fr"
                ? "Des idées pratiques pour comparer les prix, préparer vos courses et acheter avec confiance."
                : "Fresh perspectives on everyday shopping. Practical reads to help you compare, plan, and buy with confidence."}
            </p>
          </header>
          <section className="pc-container pc-blog-feature" aria-labelledby="pc-blog-feature-title">
            <div className="pc-blog-feature-photo">
              {featurePost.coverImagePath && featurePost.imageUrls?.[featurePost.coverImagePath] ? (
                <img
                  src={featurePost.imageUrls[featurePost.coverImagePath]}
                  alt={featurePost.coverImageAlt ?? ""}
                />
              ) : (
                <img src={grocerySrc} alt="" width={1200} height={1800} fetchPriority="high" />
              )}
              <span>
                {locale === "fr"
                  ? "UN PEU DE PRÉPARATION CHANGE TOUT."
                  : "A LITTLE PLANNING GOES A LONG WAY."}
              </span>
            </div>
            <div className="pc-blog-feature-copy">
              <span className="pc-eyebrow">{copy.blog.featuredLabel}</span>
              {metadata(featurePost)}
              <h2 id="pc-blog-feature-title">
                <WebLink
                  href={postHref(featurePost.slug)}
                  onPress={onOpenPost ? () => onOpenPost(featurePost.slug) : undefined}
                >
                  {featurePost.title}
                </WebLink>
              </h2>
              <p>{featurePost.description}</p>
              {postLink(featurePost)}
            </div>
          </section>
          <section className="pc-container pc-blog-latest" aria-labelledby="pc-blog-latest">
            <div className="pc-blog-section-heading">
              <h2 id="pc-blog-latest">{copy.blog.latestLabel}</h2>
              <span className="pc-eyebrow">
                {locale === "fr"
                  ? "À LIRE AVANT VOS PROCHAINES COURSES"
                  : "FOR YOUR NEXT GROCERY RUN"}
              </span>
            </div>
            {cards(posts.slice(1))}
          </section>
        </>
      )}
    </div>
  );
}
