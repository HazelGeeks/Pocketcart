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
}: {
  children: React.ReactNode;
}) {
  const [locale, setLocale] = React.useState<Locale>(() => {
    if (Platform.OS !== "web") {
      return "en";
    }
    const saved = window.localStorage.getItem("pocketcart_locale");
    if (saved === "en" || saved === "fr") {
      return saved;
    }
    const browserLocale =
      window.navigator.language?.toLowerCase() ?? "en";
    return browserLocale.startsWith("fr") ? "fr" : "en";
  });

  React.useEffect(() => {
    if (Platform.OS !== "web") return;
    window.localStorage.setItem("pocketcart_locale", locale);
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
