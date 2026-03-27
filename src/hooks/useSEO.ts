import { useEffect } from "react";
import { Platform } from "react-native";
import type { Route } from "../constants/palette";
import type { Locale } from "../i18n/types";

interface SEOConfig {
  title: string;
  description: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  noindex?: boolean;
  structuredData?: Record<string, unknown> | Array<Record<string, unknown>>;
}

export const BASE_URL = "https://pocketcart.app";
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.png`;
export const ROUTE_PATHS: Record<Route, string> = {
  home: "/",
  app: "/app",
  blog: "/blog",
  privacy: "/privacy",
  terms: "/terms",
  "delete-account": "/delete-account",
};

/**
 * Dynamically updates <head> meta tags per route for SEO.
 * Only runs on web — no-op on native.
 */
export default function useSEO(config: SEOConfig) {
  useEffect(() => {
    if (Platform.OS !== "web") return;

    const {
      title,
      description,
      canonical,
      ogTitle,
      ogDescription,
      ogImage,
      noindex,
      structuredData,
    } = config;

    // Title
    document.title = title;

    // Helper: set or create a <meta> tag
    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(
        `meta[${attr}="${key}"]`,
      ) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    // Helper: set or create a <link> tag
    const setLink = (rel: string, href: string) => {
      let el = document.querySelector(
        `link[rel="${rel}"]`,
      ) as HTMLLinkElement | null;
      if (!el) {
        el = document.createElement("link");
        el.setAttribute("rel", rel);
        document.head.appendChild(el);
      }
      el.setAttribute("href", href);
    };

    // Description
    setMeta("name", "description", description);

    // Robots
    setMeta(
      "name",
      "robots",
      noindex ? "noindex, nofollow" : "index, follow",
    );

    // Canonical
    if (canonical) {
      setLink("canonical", canonical);
    }

    // Open Graph
    setMeta("property", "og:title", ogTitle ?? title);
    setMeta("property", "og:description", ogDescription ?? description);
    setMeta("property", "og:url", canonical ?? BASE_URL);
    setMeta("property", "og:image", ogImage ?? DEFAULT_OG_IMAGE);

    // Twitter
    setMeta("name", "twitter:title", ogTitle ?? title);
    setMeta("name", "twitter:description", ogDescription ?? description);
    setMeta("name", "twitter:image", ogImage ?? DEFAULT_OG_IMAGE);

    document
      .querySelectorAll('script[data-seo-structured="true"]')
      .forEach((node) => node.remove());

    const entries = Array.isArray(structuredData)
      ? structuredData
      : structuredData
        ? [structuredData]
        : [];

    entries.forEach((entry) => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.dataset.seoStructured = "true";
      script.text = JSON.stringify(entry);
      document.head.appendChild(script);
    });
  }, [
    config.title,
    config.description,
    config.canonical,
    config.ogTitle,
    config.ogDescription,
    config.ogImage,
    config.noindex,
    JSON.stringify(config.structuredData ?? null),
  ]);
}

/** Pre-defined SEO configs per route */
export const SEO_CONFIGS: Record<Locale, Record<Route, SEOConfig>> = {
  en: {
    home: {
      title: "PocketCart - Smart Price Comparison & Savings App",
      description:
        "PocketCart compares prices across stores in real time, " +
        "sends price-drop alerts, and helps you manage your budget.",
      canonical: `${BASE_URL}/`,
    },
    app: {
      title: "PocketCart MVP App - Login, Tracking, History",
      description:
        "Use the PocketCart MVP app to sign in, manage tracking " +
        "items, monitor price history, and receive alerts.",
      canonical: `${BASE_URL}/app`,
      noindex: true,
    },
    blog: {
      title: "Blog - PocketCart",
      description:
        "PocketCart blog with shopping tactics, saving playbooks, " +
        "and product updates.",
      canonical: `${BASE_URL}/blog`,
    },
    privacy: {
      title: "Privacy Policy - PocketCart",
      description:
        "PocketCart Privacy Policy. Learn what data we collect " +
        "and how we protect your information.",
      canonical: `${BASE_URL}/privacy`,
      noindex: false,
    },
    terms: {
      title: "Terms of Service - PocketCart",
      description:
        "PocketCart Terms of Service. Review usage conditions, " +
        "disclaimers, and account policies.",
      canonical: `${BASE_URL}/terms`,
      noindex: false,
    },
    "delete-account": {
      title: "Delete Account - PocketCart",
      description:
        "Delete your PocketCart account and request data " +
        "removal using in-app controls or the web deletion page.",
      canonical: `${BASE_URL}/delete-account`,
      noindex: true,
    },
  },
  fr: {
    home: {
      title: "PocketCart - Comparateur de prix et economies",
      description:
        "PocketCart compare les prix en temps reel, envoie des " +
        "alertes de baisse et vous aide a gerer votre budget.",
      canonical: `${BASE_URL}/`,
    },
    app: {
      title: "App MVP PocketCart - suivi, historique, alertes",
      description:
        "Utilisez l app MVP PocketCart pour vous connecter, " +
        "gerer vos articles suivis, voir l historique des prix " +
        "et recevoir des alertes.",
      canonical: `${BASE_URL}/app`,
      noindex: true,
    },
    blog: {
      title: "Blog - PocketCart",
      description:
        "Blog PocketCart avec conseils d achat, strategies " +
        "d economies et mises a jour produit.",
      canonical: `${BASE_URL}/blog`,
    },
    privacy: {
      title: "Confidentialite - PocketCart",
      description:
        "Politique de confidentialite PocketCart. Consultez " +
        "la collecte et la protection des donnees.",
      canonical: `${BASE_URL}/privacy`,
      noindex: false,
    },
    terms: {
      title: "Conditions - PocketCart",
      description:
        "Conditions d utilisation PocketCart. Consultez " +
        "les regles d usage et clauses importantes.",
      canonical: `${BASE_URL}/terms`,
      noindex: false,
    },
    "delete-account": {
      title: "Suppression du compte - PocketCart",
      description:
        "Supprimez votre compte PocketCart et demandez la " +
        "suppression des donnees depuis l application ou le web.",
      canonical: `${BASE_URL}/delete-account`,
      noindex: true,
    },
  },
};

export function getSEOConfig(
  route: Route,
  locale: Locale,
): SEOConfig {
  const localized = SEO_CONFIGS[locale]?.[route];
  if (localized) return localized;
  return {
    ...SEO_CONFIGS.en.home,
    canonical: `${BASE_URL}${ROUTE_PATHS[route]}`,
  };
}
