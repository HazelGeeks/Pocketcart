import React, { useState, useEffect, useCallback } from "react";
import { ScrollView, StatusBar, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "framer-motion";
import { useFonts } from "@expo-google-fonts/nunito/useFonts";
import { Nunito_400Regular } from "@expo-google-fonts/nunito/400Regular";
import { Nunito_600SemiBold } from "@expo-google-fonts/nunito/600SemiBold";
import { Nunito_700Bold } from "@expo-google-fonts/nunito/700Bold";
import { Nunito_800ExtraBold } from "@expo-google-fonts/nunito/800ExtraBold";
import P, { type Route } from "./src/constants/palette";
import { isWeb } from "./src/constants/variants";
import { appPalette } from "./src/shared/design/palette";
import s from "./src/styles";
import useSEO, { BASE_URL, getSEOConfig } from "./src/hooks/useSEO";
import useAnalytics from "./src/hooks/useAnalytics";
import Navbar, { type SectionId } from "./src/components/Navbar";
import FooterSection from "./src/components/FooterSection";
import HeroSection from "./src/sections/HeroSection";
import FeaturesSection from "./src/sections/FeaturesSection";
import HowItWorksSection from "./src/sections/HowItWorksSection";
import FaqSection from "./src/sections/FaqSection";
import CtaSection from "./src/sections/CtaSection";
import PrivacyScreen from "./src/screens/PrivacyScreen";
import TermsScreen from "./src/screens/TermsScreen";
import BlogScreen from "./src/screens/BlogScreen";
import DeleteAccountScreen from "./src/screens/DeleteAccountScreen";
import SupportScreen from "./src/screens/SupportScreen";
import NativeAppScreen from "./src/screens/NativeAppScreen";
import AdminScreen from "./src/screens/AdminScreen";
import { getBlogPost } from "./src/data/blogPosts";
import { SiteI18nProvider, useSiteI18n } from "./src/i18n/siteI18n";
import { buildPath, locationToRoute, type RouteState } from "./src/routing/routeState";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppShell() {
  const { locale, copy } = useSiteI18n();
  const [pendingSection, setPendingSection] = useState<SectionId | null>(null);
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

  const safeAreaBackground =
    route === "delete-account" ? appPalette.bg : P.bg;

  let content: React.ReactNode = null;

  if (!isWeb) {
    content = <NativeAppScreen />;
  } else if (route === "blog") {
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
  } else if (route === "delete-account") {
    content = <DeleteAccountScreen onBack={goHome} />;
  } else if (route === "support") {
    content = <SupportScreen onBack={goHome} />;
  } else if (route === "privacy") {
    content = (
      <PrivacyScreen
        onBack={goHome}
        backLabel={copy.legal.backToHome}
        legalLabel="LEGAL"
        titleLabel={copy.legal.privacyTitle}
        lastUpdatedLabel={copy.legal.lastUpdated}
        englishOnlyNote={locale === "fr" ? copy.legal.englishOnly : undefined}
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
        englishOnlyNote={locale === "fr" ? copy.legal.englishOnly : undefined}
      />
    );
  } else if (route === "admin") {
    content = <AdminScreen onBack={goHome} />;
  } else {
    content = (
      <MotionConfig reducedMotion="user">
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
            />
            <HeroSection />
            <FeaturesSection />
            <HowItWorksSection />
            <FaqSection />
            <CtaSection />
            <FooterSection navigate={navigate} />
          </ScrollView>
        </View>
      </MotionConfig>
    );
  }

  return (
    <SafeAreaView
      style={[
        { flex: 1, backgroundColor: safeAreaBackground },
        isWeb && ({ paddingTop: "env(safe-area-inset-top)" } as any),
      ]}
      edges={["top"]}
    >
      {content}
    </SafeAreaView>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  if (!isWeb && !fontsLoaded && !fontError) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <SiteI18nProvider>
          <AppShell />
        </SiteI18nProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
