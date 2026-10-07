import type { ReactNode } from "react";
import BlogContent from "../components/blog/BlogContent";
import type { BlogPost } from "../data/blogPosts";
import type { Locale } from "../i18n/types";
import { SITE_COPY } from "../i18n/siteCopy";
import { BASE_URL, getBlogSEOConfig, getSEOConfig, localizedPath, type SEOConfig } from "./seo";
declare const __PUBLIC_ANALYTICS_ID__: string;

export function jsonForHtml(value: unknown) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function DocumentHead({
  seo,
  locale,
  alternates = [],
  cssPath,
}: {
  seo: SEOConfig;
  locale: Locale;
  alternates?: Locale[];
  cssPath: string;
}) {
  const path = new URL(seo.canonical ?? BASE_URL).pathname;
  return (
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      <meta name="robots" content={seo.noindex ? "noindex, nofollow" : "index, follow"} />
      <link rel="canonical" href={seo.canonical} />
      {alternates.map((lang) => (
        <link
          key={lang}
          rel="alternate"
          hrefLang={lang}
          href={`${BASE_URL}${localizedPath(path, lang)}`}
        />
      ))}
      {alternates.includes("en") ? (
        <link rel="alternate" hrefLang="x-default" href={`${BASE_URL}${path}`} />
      ) : null}
      <meta
        property="og:type"
        content={
          seo.structuredData &&
          !Array.isArray(seo.structuredData) &&
          seo.structuredData["@type"] === "BlogPosting"
            ? "article"
            : "website"
        }
      />
      <meta property="og:locale" content={locale === "fr" ? "fr_CA" : "en_CA"} />
      <meta property="og:title" content={seo.ogTitle ?? seo.title} />
      <meta property="og:description" content={seo.ogDescription ?? seo.description} />
      <meta property="og:url" content={seo.canonical} />
      <meta property="og:image" content={seo.ogImage ?? `${BASE_URL}/og-image.png`} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seo.ogTitle ?? seo.title} />
      <meta name="twitter:description" content={seo.ogDescription ?? seo.description} />
      <meta name="twitter:image" content={seo.ogImage ?? `${BASE_URL}/og-image.png`} />
      <link rel="icon" href="/favicon.png" />
      <link rel="stylesheet" href={cssPath} />
      <script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8138616027618632"
        crossOrigin="anonymous"
      />
      <script
        src="/public-interactions.js"
        defer
        data-ga-id={__PUBLIC_ANALYTICS_ID__ || undefined}
      />
      {seo.structuredData ? (
        <script type="application/ld+json">{jsonForHtml(seo.structuredData)}</script>
      ) : null}
    </head>
  );
}

export function PublicHeader({ locale, path }: { locale: Locale; path: string }) {
  const c = SITE_COPY[locale];
  const sectionLinks = [
    { label: c.nav.features, hash: "features" },
    { label: c.nav.howItWorks, hash: "how-it-works" },
    { label: c.nav.faq, hash: "faq" },
  ];
  return (
    <header className="pc-public-header">
      <nav
        className="pc-public-nav"
        aria-label={locale === "fr" ? "Navigation principale" : "Main navigation"}
      >
        <a className="pc-public-brand" href={localizedPath("/", locale)} aria-label="PocketCart">
          <img src="/web-logo.png" width="36" height="36" alt="" />
          <span>PocketCart</span>
        </a>
        <div className="pc-public-links">
          {sectionLinks.map((link) => (
            <a key={link.hash} href={`${localizedPath("/", locale)}#${link.hash}`}>
              {link.label}
            </a>
          ))}
          <a href={localizedPath("/blog", locale)}>{c.nav.blog}</a>
        </div>
        <div className="pc-public-actions">
          <nav className="pc-public-language" aria-label={c.nav.language}>
            {(["en", "fr"] as const).map((lang) => (
              <a
                key={lang}
                href={`${path}?lang=${lang}`}
                hrefLang={lang}
                aria-label={lang === "en" ? c.nav.english : c.nav.french}
                aria-current={locale === lang ? "true" : undefined}
              >
                {lang.toUpperCase()}
              </a>
            ))}
          </nav>
          <a className="pc-public-cta" href={`${localizedPath("/", locale)}#download`}>
            {c.nav.getApp}
          </a>
          <details className="pc-public-menu">
            <summary aria-label={locale === "fr" ? "Menu de navigation" : "Navigation menu"}>
              <span aria-hidden="true">☰</span>
            </summary>
            <div>
              {sectionLinks.map((link) => (
                <a key={link.hash} href={`${localizedPath("/", locale)}#${link.hash}`}>
                  {link.label}
                </a>
              ))}
              <a href={localizedPath("/blog", locale)}>{c.nav.blog}</a>
            </div>
          </details>
        </div>
      </nav>
    </header>
  );
}

export function PublicFooter({ locale }: { locale: Locale }) {
  const c = SITE_COPY[locale].footer;
  const routes = new Set(["blog", "support", "privacy", "terms", "delete-account"]);
  return (
    <footer className="pc-public-footer">
      <div className="pc-container">
        <a className="pc-public-brand" href={localizedPath("/", locale)}>
          <img src="/web-logo.png" width="36" height="36" alt="" />
          PocketCart
        </a>
        <p>{c.tagline}</p>
        <nav aria-label={locale === "fr" ? "Liens utiles" : "Footer links"}>
          {c.groups
            .flatMap((g) => g.links)
            .filter((link) => routes.has(link.id))
            .map((link) => (
              <a key={link.id} href={localizedPath(`/${link.id}`, locale)}>
                {link.label}
              </a>
            ))}
        </nav>
        <small>{c.copyright}</small>
      </div>
    </footer>
  );
}

export default function BlogDocument({
  posts,
  locale,
  slug,
  cssPath,
  alternates,
  status = 200,
}: {
  posts: BlogPost[];
  locale: Locale;
  slug: string | null;
  cssPath: string;
  alternates: Locale[];
  status?: number;
}) {
  const post = posts.find((p) => p.slug === slug);
  const seo = post ? getBlogSEOConfig(post, locale) : getSEOConfig("blog", locale);
  if (status !== 200) {
    seo.noindex = true;
    seo.title = `${status === 404 ? "Article not found" : "Articles unavailable"} | PocketCart`;
    seo.canonical = `${BASE_URL}${localizedPath(slug ? `/blog/${slug}` : "/blog", locale)}`;
  }
  return (
    <html lang={locale}>
      <DocumentHead
        seo={seo}
        locale={locale}
        cssPath={cssPath}
        alternates={status === 200 ? alternates : []}
      />
      <body className="pc-public">
        <a href="#main-content" className="pc-skip-link">
          {locale === "fr" ? "Aller au contenu" : "Skip to content"}
        </a>
        <PublicHeader locale={locale} path={slug ? `/blog/${slug}` : "/blog"} />
        <main id="main-content" tabIndex={-1}>
          <BlogContent
            posts={posts}
            locale={locale}
            currentSlug={slug}
            loadError={status === 503 ? "Articles unavailable" : null}
          />
        </main>
        <PublicFooter locale={locale} />
      </body>
    </html>
  );
}

export function ErrorDocument({
  status,
  locale,
  cssPath,
}: {
  status: number;
  locale: Locale;
  cssPath: string;
}) {
  const title = locale === "fr" ? "Page introuvable" : "Page not found";
  return (
    <html lang={locale}>
      <DocumentHead
        seo={{ title: `${title} | PocketCart`, description: title, noindex: true }}
        locale={locale}
        cssPath={cssPath}
      />
      <body className="pc-public">
        <PublicHeader locale={locale} path="/" />
        <main id="main-content" className="pc-container pc-public-error">
          <h1>
            {status} — {title}
          </h1>
          <a href={localizedPath("/", locale)}>{SITE_COPY[locale].blog.back}</a>
        </main>
        <PublicFooter locale={locale} />
      </body>
    </html>
  );
}

export type PublicDocument = ReactNode;
