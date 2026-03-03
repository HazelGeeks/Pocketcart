import React, { useState, useEffect, useCallback } from "react";
import { ScrollView, StatusBar, View } from "react-native";
import P, { type Route } from "./src/constants/palette";
import { isWeb } from "./src/constants/variants";
import s from "./src/styles";
import useSEO, { getSEOConfig } from "./src/hooks/useSEO";
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
import {
  SiteI18nProvider,
  useSiteI18n,
} from "./src/i18n/siteI18n";

function locationToRoute(pathname: string, hash: string): Route {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/app" || hash === "#/app") return "app";
  if (path === "/delete-account" || hash === "#/delete-account") {
    return "delete-account";
  }
  if (path === "/blog" || hash === "#/blog") return "blog";
  if (path === "/privacy" || hash === "#/privacy") return "privacy";
  if (path === "/terms" || hash === "#/terms") return "terms";
  return "home";
}

function AppShell() {
  const { locale, copy } = useSiteI18n();
  const [pendingSection, setPendingSection] =
    useState<SectionId | null>(null);
  const [route, setRoute] = useState<Route>(() =>
    isWeb
      ? locationToRoute(window.location.pathname, window.location.hash)
      : "home",
  );

  useEffect(() => {
    if (!isWeb) return;
    const syncRoute = () =>
      setRoute(
        locationToRoute(window.location.pathname, window.location.hash),
      );
    window.addEventListener("popstate", syncRoute);
    window.addEventListener("hashchange", syncRoute);
    return () => {
      window.removeEventListener("popstate", syncRoute);
      window.removeEventListener("hashchange", syncRoute);
    };
  }, []);

  const navigate = useCallback((r: Route) => {
    setRoute(r);
    if (isWeb) {
      const path = r === "home" ? "/" : `/${r}`;
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

  // Dynamic SEO meta tags per route
  useSEO(getSEOConfig(route, locale));
  useAnalytics(route, locale);

  let content: React.ReactNode = null;

  if (route === "blog") {
    content = <BlogScreen onBack={goHome} />;
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
