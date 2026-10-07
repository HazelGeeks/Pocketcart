import type { Route } from "../constants/palette";
import type { Locale } from "../i18n/types";
import type { BlogPost } from "../data/blogPosts";

export interface SEOConfig {
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
const ROUTE_PATHS: Record<Route, string> = {
  home: "/",
  blog: "/blog",
  privacy: "/privacy",
  terms: "/terms",
  support: "/support",
  "delete-account": "/delete-account",
  admin: "/admin",
};

/** Pre-defined SEO configs per route */
const SEO_CONFIGS: Record<Locale, Record<Route, SEOConfig>> = {
  en: {
    home: {
      title: "PocketCart - Smart Price Comparison & Savings App",
      description:
        "Compare listed grocery prices, follow sale periods, and plan " +
        "your next shopping trip with PocketCart.",
      canonical: `${BASE_URL}/`,
    },
    blog: {
      title: "Blog - PocketCart",
      description:
        "PocketCart blog with shopping tactics, saving playbooks, " + "and product updates.",
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
    support: {
      title: "Help & Support - Pocket Cart",
      description: "Find app help, privacy information, and account deletion guidance.",
      canonical: `${BASE_URL}/support`,
      noindex: false,
    },
    "delete-account": {
      title: "Delete Account - PocketCart",
      description:
        "Delete your PocketCart account and request data " + "removal from the web deletion page.",
      canonical: `${BASE_URL}/delete-account`,
      noindex: true,
    },
    admin: {
      title: "Admin - PocketCart",
      description: "PocketCart backoffice for catalog, store, and price data management.",
      canonical: `${BASE_URL}/admin`,
      noindex: true,
    },
  },
  fr: {
    home: {
      title: "PocketCart - Comparateur de prix et économies",
      description:
        "Comparez les prix affichés, suivez les périodes de promotion " +
        "et préparez vos prochaines courses avec PocketCart.",
      canonical: `${BASE_URL}/`,
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
    support: {
      title: "Assistance - PocketCart",
      description:
        "Ressources d assistance PocketCart pour le compte, la " +
        "confidentialite, les conditions et la suppression.",
      canonical: `${BASE_URL}/support`,
      noindex: false,
    },
    "delete-account": {
      title: "Suppression du compte - PocketCart",
      description:
        "Supprimez votre compte PocketCart et demandez la " +
        "suppression des donnees depuis cette page web.",
      canonical: `${BASE_URL}/delete-account`,
      noindex: true,
    },
    admin: {
      title: "Admin - PocketCart",
      description: "Backoffice PocketCart pour gerer le catalogue, les magasins et les prix.",
      canonical: `${BASE_URL}/admin`,
      noindex: true,
    },
  },
};

export function getSEOConfig(route: Route, locale: Locale): SEOConfig {
  const localized = SEO_CONFIGS[locale]?.[route];
  if (localized)
    return { ...localized, canonical: `${BASE_URL}${localizedPath(ROUTE_PATHS[route], locale)}` };
  return {
    ...SEO_CONFIGS.en.home,
    canonical: `${BASE_URL}${ROUTE_PATHS[route]}`,
  };
}

export function localizedPath(path: string, locale: Locale) {
  return `${path}${locale === "fr" ? "?lang=fr" : ""}`;
}

export function getBlogSEOConfig(post: BlogPost, locale: Locale): SEOConfig {
  const canonical = `${BASE_URL}${localizedPath(`/blog/${post.slug}`, locale)}`;
  return {
    title: `${post.title} | PocketCart`,
    description: post.description,
    canonical,
    ogTitle: post.title,
    ogDescription: post.description,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.description,
      inLanguage: locale,
      datePublished: post.publishAt ?? post.publishedAt,
      dateModified: post.updatedAt ?? post.publishedAt,
      mainEntityOfPage: canonical,
      author: { "@type": "Organization", name: post.authorName || "Pocketcart" },
      publisher: {
        "@type": "Organization",
        name: "PocketCart",
        logo: { "@type": "ImageObject", url: `${BASE_URL}/icon.png` },
      },
      image: `${BASE_URL}/og-image.png`,
    },
  };
}
