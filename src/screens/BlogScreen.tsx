import { useEffect, useRef } from "react";
import { ScrollView, View } from "react-native";
import type { BlogPost } from "../data/blogPosts";
import BlogContent from "../components/blog/BlogContent";
import { useSiteI18n } from "../i18n/siteI18n";
import Navbar, { type SectionId } from "../components/Navbar";
import FooterSection from "../components/FooterSection";
import { groceries } from "../components/marketing/ProductPreview";
import type { Route } from "../constants/palette";
import "../components/marketing/marketing.css";
import "../components/marketing/blog.css";
import "../components/blog/blogArticleBody.css";

export default function BlogScreen({
  posts,
  loading,
  loadError,
  onRetry,
  currentSlug,
  onBackHome,
  onBackToBlog,
  onOpenPost,
  onNavigate,
  onNavigateSection,
}: {
  posts: BlogPost[];
  loading: boolean;
  loadError: string | null;
  onRetry: () => void;
  currentSlug: string | null;
  onBackHome: () => void;
  onBackToBlog: () => void;
  onOpenPost: (slug: string) => void;
  onNavigate: (route: Route) => void;
  onNavigateSection: (section: SectionId) => void;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const { locale } = useSiteI18n();
  const scrolledSlug = useRef<{ slug: typeof currentSlug } | null>(null);
  useEffect(() => {
    if (scrolledSlug.current?.slug === currentSlug) return;
    scrolledSlug.current = { slug: currentSlug };
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [currentSlug]);

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
        <BlogContent posts={posts} locale={locale} loading={loading} loadError={loadError}
          onRetry={onRetry} currentSlug={currentSlug} onBackHome={onBackHome}
          onBackToBlog={onBackToBlog} onOpenPost={onOpenPost} grocerySrc={groceries} />
        <FooterSection navigate={onNavigate} />
      </ScrollView>
    </View>
  );
}
