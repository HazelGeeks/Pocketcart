import React, { useState, useEffect, useCallback } from "react";
import { ScrollView, StatusBar, View } from "react-native";
import P, { type Route } from "./src/constants/palette";
import { isWeb } from "./src/constants/variants";
import s from "./src/styles";
import useSEO, { BASE_URL, getSEOConfig } from "./src/hooks/useSEO";
import useAnalytics from "./src/hooks/useAnalytics";
import Navbar, { type SectionId } from "./src/components/Navbar";
import WaveDivider from "./src/components/WaveDivider";
import FooterSection from "./src/components/FooterSection";
import HeroSection from "./src/sections/HeroSection";
import FeaturesSection from "./src/sections/FeaturesSection";
import HowItWorksSection from "./src/sections/HowItWorksSection";
import FaqSection from "./src/sections/FaqSection";
import CtaSection from "./src/sections/CtaSection";
import PrivacyScreen from "./src/screens/PrivacyScreen";
import TermsScreen from "./src/screens/TermsScreen";
import BlogScreen from "./src/screens/BlogScreen";
import AppMvpScreen from "./src/screens/AppMvpScreen";
import DeleteAccountScreen from "./src/screens/DeleteAccountScreen";
import { getBlogPost } from "./src/data/blogPosts";
import {
  SiteI18nProvider,
  useSiteI18n,
} from "./src/i18n/siteI18n";

type RouteState = {
  route: Route;
  blogSlug: string | null;
};

function locationToRoute(pathname: string, hash: string): RouteState {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path.startsWith("/blog/")) {
    const blogSlug = path.slice("/blog/".length).replace(/\/+$/, "");
    if (blogSlug) {
      return { route: "blog", blogSlug: decodeURIComponent(blogSlug) };
    }
  }
  if (path === "/app" || hash === "#/app") return { route: "app", blogSlug: null };
  if (path === "/delete-account" || hash === "#/delete-account") {
    return { route: "delete-account", blogSlug: null };
  }
  if (path === "/blog" || hash === "#/blog") return { route: "blog", blogSlug: null };
  if (path === "/privacy" || hash === "#/privacy") return { route: "privacy", blogSlug: null };
  if (path === "/terms" || hash === "#/terms") return { route: "terms", blogSlug: null };
  return { route: "home", blogSlug: null };
}

function buildPath(route: Route, blogSlug?: string | null): string {
  if (route === "blog" && blogSlug) {
    return `/blog/${encodeURIComponent(blogSlug)}`;
  }
  return route === "home" ? "/" : `/${route}`;
}

function AppShell() {
  const { locale, copy } = useSiteI18n();
  const [pendingSection, setPendingSection] =
    useState<SectionId | null>(null);
  const [routeState, setRouteState] = useState<RouteState>(() =>
    isWeb
      ? locationToRoute(window.location.pathname, window.location.hash)
      : { route: "home", blogSlug: null },
  );
  const route = routeState.route;
  const blogSlug = routeState.blogSlug;
  const currentBlogPost =
    getBlogPost(locale, blogSlug) ?? getBlogPost("en", blogSlug);

  useEffect(() => {
    if (!isWeb) return;
    const syncRoute = () => {
      setRouteState(
        locationToRoute(window.location.pathname, window.location.hash),
      );
    };
    window.addEventListener("popstate", syncRoute);
    window.addEventListener("hashchange", syncRoute);
    return () => {
      window.removeEventListener("popstate", syncRoute);
      window.removeEventListener("hashchange", syncRoute);
    };
  }, []);

  const navigate = useCallback((r: Route, nextBlogSlug?: string | null) => {
    setRouteState({ route: r, blogSlug: nextBlogSlug ?? null });
    if (isWeb) {
      const path = buildPath(r, nextBlogSlug);
      if (window.location.pathname !== path) {
        window.history.pushState({}, "", path);
      }
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }
  }, []);

  const scrollToSection = useCallback((id: SectionId) => {
    if (!isWeb) return;
    const section = document.getElementById(id);
    if (!section) return;
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const navigateSection = useCallback(
    (id: SectionId) => {
      if (route === "home") {
        scrollToSection(id);
        return;
      }
      setPendingSection(id);
      navigate("home");
    },
    [route, navigate, scrollToSection],
  );

  useEffect(() => {
    if (!isWeb || route !== "home" || !pendingSection) return;
    const timer = window.setTimeout(() => {
      scrollToSection(pendingSection);
      setPendingSection(null);
    }, 90);
    return () => window.clearTimeout(timer);
  }, [route, pendingSection, scrollToSection]);

  const goHome = useCallback(() => navigate("home"), [navigate]);
  const goBlogIndex = useCallback(() => navigate("blog"), [navigate]);
  const openBlogPost = useCallback(
    (slug: string) => navigate("blog", slug),
    [navigate],
  );

  // Dynamic SEO meta tags per route
  useSEO(
    currentBlogPost
      ? {
          title: `${currentBlogPost.title} | PocketCart`,
          description: currentBlogPost.description,
          canonical: `${BASE_URL}/blog/${currentBlogPost.slug}`,
          ogTitle: currentBlogPost.title,
          ogDescription: currentBlogPost.description,
          structuredData: {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: currentBlogPost.title,
            description: currentBlogPost.description,
            datePublished: currentBlogPost.publishedAt,
            dateModified: currentBlogPost.publishedAt,
            mainEntityOfPage: `${BASE_URL}/blog/${currentBlogPost.slug}`,
            author: {
              "@type": "Organization",
              name: "PocketCart",
            },
            publisher: {
              "@type": "Organization",
              name: "PocketCart",
              logo: {
                "@type": "ImageObject",
                url: `${BASE_URL}/icon.png`,
              },
            },
            image: `${BASE_URL}/og-image.png`,
          },
        }
      : getSEOConfig(route, locale),
  );
  useAnalytics(locale, buildPath(route, blogSlug));

  let content: React.ReactNode = null;

  if (route === "blog") {
    content = (
      <BlogScreen
        currentSlug={blogSlug}
        onBackHome={goHome}
        onBackToBlog={goBlogIndex}
        onOpenPost={openBlogPost}
        onNavigate={navigate}
        onNavigateSection={navigateSection}
      />
    );
  } else if (route === "app") {
    content = <AppMvpScreen onBack={goHome} onNavigate={navigate} />;
  } else if (route === "delete-account") {
    content = <DeleteAccountScreen onBack={goHome} />;
  } else if (route === "privacy") {
    content = (
      <PrivacyScreen
        onBack={goHome}
        backLabel={copy.legal.backToHome}
        legalLabel="LEGAL"
        titleLabel={copy.legal.privacyTitle}
        lastUpdatedLabel={copy.legal.lastUpdated}
        englishOnlyNote={
          locale === "fr" ? copy.legal.englishOnly : undefined
        }
      />
    );
  } else if (route === "terms") {
    content = (
      <TermsScreen
        onBack={goHome}
        backLabel={copy.legal.backToHome}
        legalLabel="LEGAL"
        titleLabel={copy.legal.termsTitle}
        lastUpdatedLabel={copy.legal.lastUpdated}
        englishOnlyNote={
          locale === "fr" ? copy.legal.englishOnly : undefined
        }
      />
    );
  } else {
    content = (
      <View style={s.root}>
        <StatusBar barStyle="dark-content" />
        <ScrollView
          role="main"
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Navbar
            onNavigate={navigate}
            onNavigateSection={navigateSection}
            onOpenApp={() => navigate("app")}
          />
          <HeroSection />
          <WaveDivider color={P.white} flip />
          <FeaturesSection />
          <WaveDivider color={P.primaryGhost} flip />
          <HowItWorksSection />
          <WaveDivider color={P.white} flip />
          <FaqSection />
          <WaveDivider color={P.dark} flip />
          <CtaSection />
          <FooterSection navigate={navigate} />
        </ScrollView>
      </View>
    );
  }

  return <>{content}</>;
}

export default function App() {
  return (
    <SiteI18nProvider>
      <AppShell />
    </SiteI18nProvider>
  );
}
