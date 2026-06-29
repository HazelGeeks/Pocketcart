import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { getBlogPost, getBlogPosts } from "../data/blogPosts";
import { useSiteI18n } from "../i18n/siteI18n";
import WebLink from "../components/WebLink";
import Navbar, { type SectionId } from "../components/Navbar";
import FooterSection from "../components/FooterSection";
import EmailSignupForm from "../components/EmailSignupForm";
import P from "../constants/palette";
import type { Route } from "../constants/palette";

function useLayout() {
  const { width: w } = useWindowDimensions();
  const isMd = w >= 768;
  const isLg = w >= 1024;
  return { isMd, isLg, pad: isLg ? 56 : isMd ? 36 : 20 };
}

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
  const { isMd, isLg, pad } = useLayout();
  const { locale, copy } = useSiteI18n();
  const posts = getBlogPosts(locale);
  const selectedPost =
    getBlogPost(locale, currentSlug) ?? getBlogPost("en", currentSlug);
  const featurePost = posts[0] ?? getBlogPosts("en")[0];
  const latestPosts = posts.slice(1);
  const relatedPosts = posts
    .filter((post) => post.slug !== selectedPost?.slug)
    .slice(0, 3);
  const dateFormatter = React.useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    [locale],
  );

  const formatMeta = React.useCallback(
    (publishedAt: string, readMinutes: number) =>
      `${dateFormatter.format(new Date(publishedAt))} · ${readMinutes} ${copy.blog.minutesRead}`,
    [copy.blog.minutesRead, dateFormatter],
  );

  return (
    <View style={st.root}>
      <Navbar
        onNavigate={onNavigate}
        onNavigateSection={onNavigateSection}
      />
      <ScrollView
        role="main"
        style={st.scroll}
        contentContainerStyle={st.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            st.topBar,
            { paddingHorizontal: pad },
            Platform.OS === "web" &&
              ({ position: "sticky", top: 0, zIndex: 50 } as any),
          ]}
        >
          <WebLink
            href={selectedPost ? "/blog" : "/"}
            onPress={selectedPost ? onBackToBlog : onBackHome}
          >
            <View style={st.backBtn}>
              <Text style={st.backArrow}>←</Text>
              <Text style={st.backText}>
                {selectedPost ? copy.blog.backToBlog : copy.blog.back}
              </Text>
            </View>
          </WebLink>
        </View>

        <View
          style={[
            st.container,
            { paddingHorizontal: pad, maxWidth: isLg ? 1040 : 760 },
          ]}
        >
          {selectedPost ? (
            <>
              <View style={st.articleHeader}>
                <Text style={st.eyebrow}>{copy.blog.eyebrow}</Text>
                <Text style={st.articleMeta}>
                  {formatMeta(
                    selectedPost.publishedAt,
                    selectedPost.readMinutes,
                  )}
                </Text>
                <Text
                  accessibilityRole="header"
                  aria-level={1}
                  style={[st.title, isLg && { fontSize: 50, lineHeight: 58 }]}
                >
                  {selectedPost.title}
                </Text>
                <Text style={[st.sub, { maxWidth: 720 }]}>
                  {selectedPost.description}
                </Text>
              </View>

              <View style={st.articleCard}>
                {selectedPost.sections.map((section) => (
                  <View key={section.heading} style={st.articleSection}>
                    <Text style={st.sectionTitle}>{section.heading}</Text>
                    {section.paragraphs.map((paragraph) => (
                      <Text key={paragraph} style={st.articleBody}>
                        {paragraph}
                      </Text>
                    ))}
                  </View>
                ))}
              </View>

              <View style={st.signupCard}>
                <EmailSignupForm
                  title={copy.footer.signupTitle}
                  subtitle={copy.footer.signupSub}
                  emailPlaceholder={copy.footer.emailPlaceholder}
                  submitLabel={copy.footer.notify}
                  successLabel={copy.footer.signupDone}
                  tone="light"
                  stackOnDesktop={!isMd}
                  containerStyle={st.signupCardInner}
                />
              </View>

              <View style={st.relatedWrap}>
                <Text style={st.relatedTitle}>{copy.blog.relatedPosts}</Text>
                <View style={[st.grid, isMd && st.gridDesktop]}>
                  {relatedPosts.map((post) => (
                    <View
                      key={post.slug}
                      style={[st.card, isMd && st.cardDesktop]}
                    >
                      <Text style={st.cardDate}>
                        {formatMeta(post.publishedAt, post.readMinutes)}
                      </Text>
                      <Text style={st.cardTitle}>{post.title}</Text>
                      <Text style={st.cardBody}>{post.excerpt}</Text>
                      <WebLink
                        href={`/blog/${post.slug}`}
                        onPress={() => onOpenPost(post.slug)}
                      >
                        <View style={st.readBtn}>
                          <Text style={st.readBtnText}>
                            {copy.blog.readArticle}
                          </Text>
                        </View>
                      </WebLink>
                    </View>
                  ))}
                </View>
              </View>
            </>
          ) : (
            <>
              <View style={st.headerBlock}>
                <Text style={st.eyebrow}>{copy.blog.eyebrow}</Text>
                <Text
                  accessibilityRole="header"
                  aria-level={1}
                  style={[st.title, isLg && { fontSize: 46, lineHeight: 54 }]}
                >
                  {copy.blog.title}
                </Text>
                <Text style={[st.sub, { maxWidth: 680 }]}>{copy.blog.sub}</Text>
              </View>

              <View style={st.featureCard}>
                <View style={st.featureCopy}>
                  <Text style={st.featureLabel}>{copy.blog.featuredLabel}</Text>
                  <Text style={st.featureTitle}>{featurePost.title}</Text>
                  <Text style={st.cardDate}>
                    {formatMeta(
                      featurePost.publishedAt,
                      featurePost.readMinutes,
                    )}
                  </Text>
                  <Text style={st.cardBody}>{featurePost.description}</Text>
                  <WebLink
                    href={`/blog/${featurePost.slug}`}
                    onPress={() => onOpenPost(featurePost.slug)}
                  >
                    <View style={st.readBtn}>
                      <Text style={st.readBtnText}>
                        {copy.blog.readArticle}
                      </Text>
                    </View>
                  </WebLink>
                </View>
              </View>

              <View style={st.latestWrap}>
                <Text style={st.relatedTitle}>{copy.blog.latestLabel}</Text>
                <View style={[st.grid, isMd && st.gridDesktop]}>
                  {latestPosts.map((post) => (
                    <View
                      key={post.slug}
                      style={[st.card, isMd && st.cardDesktop]}
                    >
                      <Text style={st.cardDate}>
                        {formatMeta(post.publishedAt, post.readMinutes)}
                      </Text>
                      <Text style={st.cardTitle}>{post.title}</Text>
                      <Text style={st.cardBody}>{post.excerpt}</Text>
                      <WebLink
                        href={`/blog/${post.slug}`}
                        onPress={() => onOpenPost(post.slug)}
                      >
                        <View style={st.readBtn}>
                          <Text style={st.readBtnText}>
                            {copy.blog.readArticle}
                          </Text>
                        </View>
                      </WebLink>
                    </View>
                  ))}
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>
      <FooterSection navigate={onNavigate} />
    </View>
  );
}

const st = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: P.bg,
    ...(Platform.OS === "web"
      ? ({ minHeight: "100vh", width: "100%" } as any)
      : {}),
  },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 56 },
  topBar: {
    backgroundColor: P.glass,
    borderBottomWidth: 1,
    borderBottomColor: P.line,
    paddingVertical: 12,
    ...(Platform.OS === "web" ? ({ backdropFilter: "blur(16px)" } as any) : {}),
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    maxWidth: 1200,
    width: "100%",
  },
  backArrow: {
    fontSize: 18,
    color: P.primaryDeep,
    fontWeight: "700",
  },
  backText: {
    fontSize: 15,
    fontWeight: "600",
    color: P.primaryDeep,
  },
  container: {
    alignSelf: "center",
    width: "100%",
    paddingTop: 52,
    gap: 28,
  },
  headerBlock: {
    gap: 10,
  },
  articleHeader: {
    gap: 12,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: "800",
    color: P.primary,
    letterSpacing: 2,
  },
  articleMeta: {
    fontSize: 13,
    color: P.textMuted,
    fontWeight: "700",
  },
  title: {
    fontSize: 38,
    lineHeight: 46,
    fontWeight: "800",
    color: P.text,
  },
  sub: {
    fontSize: 17,
    lineHeight: 27,
    color: P.textSoft,
    marginTop: 4,
  },
  featureCard: {
    borderRadius: 28,
    padding: 28,
    borderWidth: 1,
    borderColor: P.line,
    backgroundColor: "rgba(255,255,255,0.84)",
    ...(Platform.OS === "web"
      ? ({ boxShadow: "0 18px 44px rgba(30,46,12,0.08)" } as any)
      : {}),
  },
  featureCopy: {
    gap: 10,
    maxWidth: 720,
  },
  featureLabel: {
    alignSelf: "flex-start",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: P.primaryDeep,
    backgroundColor: "rgba(97,227,146,0.14)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  featureTitle: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "800",
    color: P.text,
  },
  latestWrap: {
    gap: 18,
  },
  relatedWrap: {
    gap: 18,
    paddingTop: 4,
  },
  relatedTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
    color: P.text,
  },
  grid: {
    gap: 18,
  },
  gridDesktop: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  card: {
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.line,
    borderRadius: 20,
    padding: 24,
    gap: 10,
  },
  cardDesktop: {
    flexBasis: 0,
    flexGrow: 1,
    minWidth: 280,
  },
  cardDate: {
    fontSize: 13,
    color: P.textMuted,
    fontWeight: "600",
  },
  cardTitle: {
    fontSize: 21,
    lineHeight: 28,
    color: P.text,
    fontWeight: "800",
  },
  cardBody: {
    fontSize: 15,
    lineHeight: 24,
    color: P.textSoft,
  },
  readBtn: {
    marginTop: 6,
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(97,227,146,0.35)",
    backgroundColor: "rgba(97,227,146,0.12)",
  },
  readBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: P.primaryDeep,
  },
  articleCard: {
    gap: 24,
    borderRadius: 28,
    padding: 28,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.line,
  },
  signupCard: {
    borderRadius: 28,
    padding: 28,
    backgroundColor: "rgba(255,255,255,0.76)",
    borderWidth: 1,
    borderColor: P.line,
  },
  signupCardInner: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 640,
    paddingVertical: 2,
  },
  articleSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
    color: P.text,
  },
  articleBody: {
    fontSize: 16,
    lineHeight: 28,
    color: P.textSoft,
  },
});
