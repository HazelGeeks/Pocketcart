import { useEffect, useMemo, useRef } from "react";
import { ScrollView, View } from "react-native";
import { getBlogPost, getBlogPosts, type BlogPost } from "../data/blogPosts";
import { useSiteI18n } from "../i18n/siteI18n";
import WebLink from "../components/WebLink";
import Navbar, { type SectionId } from "../components/Navbar";
import FooterSection from "../components/FooterSection";
import { GroceryPhoto } from "../components/marketing/ProductPreview";
import type { Route } from "../constants/palette";
import "../components/marketing/marketing.css";
import "../components/marketing/blog.css";

export default function BlogScreen({
  currentSlug,
  onBackHome,
  onBackToBlog,
  onOpenPost,
  onNavigate,
  onNavigateSection,
}: {
  currentSlug: string | null;
  onBackHome: () => void;
  onBackToBlog: () => void;
  onOpenPost: (slug: string) => void;
  onNavigate: (route: Route) => void;
  onNavigateSection: (section: SectionId) => void;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const { locale, copy } = useSiteI18n();
  const posts = getBlogPosts(locale);
  const selectedPost = getBlogPost(locale, currentSlug) ?? getBlogPost("en", currentSlug);
  const featurePost = posts[0] ?? getBlogPosts("en")[0];
  const relatedPosts = posts.filter((post) => post.slug !== selectedPost?.slug).slice(0, 3);
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "fr" ? "fr-CA" : "en-CA", {
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      }),
    [locale],
  );
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [currentSlug]);

  const metadata = (post: BlogPost) => (
    <div className="pc-blog-meta">
      <time dateTime={post.publishedAt}>{dateFormatter.format(new Date(post.publishedAt))}</time>
      <span aria-hidden="true">·</span>
      <span>
        {post.readMinutes} {copy.blog.minutesRead}
      </span>
    </div>
  );
  const postLink = (post: BlogPost) => (
    <WebLink
      href={`/blog/${post.slug}`}
      onPress={() => onOpenPost(post.slug)}
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
          {metadata(post)}
          <h3>
            <WebLink href={`/blog/${post.slug}`} onPress={() => onOpenPost(post.slug)}>
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
    <View style={{ flex: 1, backgroundColor: "#f5f6ef" }}>
      <Navbar onNavigate={onNavigate} onNavigateSection={onNavigateSection} />
      <ScrollView
        ref={scrollRef}
        role="main"
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <div className="pc-marketing pc-blog">
          <div className="pc-container pc-blog-breadcrumb">
            <WebLink
              href={selectedPost ? "/blog" : "/"}
              onPress={selectedPost ? onBackToBlog : onBackHome}
            >
              <span aria-hidden="true">←</span>
              <span>{selectedPost ? copy.blog.backToBlog : copy.blog.back}</span>
            </WebLink>
          </div>
          {selectedPost ? (
            <>
              <header className="pc-container pc-blog-article-header">
                <p className="pc-eyebrow">POCKETCART JOURNAL</p>
                {metadata(selectedPost)}
                <h1>{selectedPost.title}</h1>
                <p className="pc-blog-intro">{selectedPost.description}</p>
              </header>
              <div className="pc-blog-reading">
                <div className="pc-container pc-blog-reading-grid">
                  <aside className="pc-blog-sidebar">
                    <span className="pc-eyebrow">
                      {locale === "fr" ? "DANS CET ARTICLE" : "IN THIS ARTICLE"}
                    </span>
                    <nav aria-label={locale === "fr" ? "Sommaire" : "Table of contents"}>
                      {selectedPost.sections.map((section, i) => (
                        <a key={section.heading} href={`#article-section-${i}`}>
                          <span>0{i + 1}</span>
                          {section.heading}
                        </a>
                      ))}
                    </nav>
                  </aside>
                  <article className="pc-blog-prose">
                    {selectedPost.sections.map((section, i) => (
                      <section id={`article-section-${i}`} key={section.heading}>
                        <h2>{section.heading}</h2>
                        {section.paragraphs.map((paragraph) => (
                          <p key={paragraph}>{paragraph}</p>
                        ))}
                      </section>
                    ))}
                    <div className="pc-blog-article-end">
                      <span>PocketCart Journal</span>
                      <WebLink href="/blog" onPress={onBackToBlog}>
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
                    <span>
                      {locale === "fr" ? "De meilleures courses." : "Better grocery runs."}
                    </span>
                  </h1>
                </div>
                <p className="pc-blog-intro">
                  {locale === "fr"
                    ? "Des idées pratiques pour comparer les prix, préparer vos courses et acheter avec confiance."
                    : "Fresh perspectives on everyday shopping. Practical reads to help you compare, plan, and buy with confidence."}
                </p>
              </header>
              <section
                className="pc-container pc-blog-feature"
                aria-labelledby="pc-blog-feature-title"
              >
                <div className="pc-blog-feature-photo">
                  <GroceryPhoto />
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
                      href={`/blog/${featurePost.slug}`}
                      onPress={() => onOpenPost(featurePost.slug)}
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
        <FooterSection navigate={onNavigate} />
      </ScrollView>
    </View>
  );
}
