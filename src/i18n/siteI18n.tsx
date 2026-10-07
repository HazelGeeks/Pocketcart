import React from "react";
import { Platform } from "react-native";
import type { Locale } from "./types";
import { SITE_COPY } from "./siteCopy";

type SiteI18nValue = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  copy: (typeof SITE_COPY)[Locale];
};

const SiteI18nContext = React.createContext<SiteI18nValue | null>(
  null,
);

export function SiteI18nProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocale] = React.useState<Locale>(() => {
    if (initialLocale) return initialLocale;
    if (Platform.OS !== "web" || typeof window === "undefined") {
      return "en";
    }
    const requested = new URLSearchParams(window.location.search).get("lang");
    if (requested === "en" || requested === "fr") return requested;
    let saved: string | null = null;
    try { saved = window.localStorage.getItem("pocketcart_locale"); } catch { /* Storage may be disabled. */ }
    if (saved === "en" || saved === "fr") {
      return saved;
    }
    const browserLocale =
      window.navigator.language?.toLowerCase() ?? "en";
    return browserLocale.startsWith("fr") ? "fr" : "en";
  });

  React.useEffect(() => {
    if (Platform.OS !== "web") return;
    try { window.localStorage.setItem("pocketcart_locale", locale); } catch { /* Keep language switching available without storage. */ }
    const url = new URL(window.location.href);
    if (locale === "fr") url.searchParams.set("lang", "fr");
    else url.searchParams.delete("lang");
    window.history.replaceState(window.history.state, "", url);
    document.documentElement.lang = locale;
  }, [locale]);

  const value = React.useMemo(
    () => ({
      locale,
      setLocale,
      copy: SITE_COPY[locale],
    }),
    [locale],
  );

  return (
    <SiteI18nContext.Provider value={value}>
      {children}
    </SiteI18nContext.Provider>
  );
}

export function useSiteI18n() {
  const context = React.useContext(SiteI18nContext);
  if (!context) {
    throw new Error("useSiteI18n must be used inside SiteI18nProvider");
  }
  return context;
}
