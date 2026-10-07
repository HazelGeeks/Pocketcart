import { useEffect } from "react";
import { Platform } from "react-native";

import { BASE_URL, type SEOConfig } from "../web/seo";
export { BASE_URL, getSEOConfig, getBlogSEOConfig } from "../web/seo";
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.png`;

/**
 * Dynamically updates <head> meta tags per route for SEO.
 * Only runs on web — no-op on native.
 */
export default function useSEO(config: SEOConfig) {
  const { title, description, canonical, ogTitle, ogDescription, ogImage, noindex } = config;
  const structuredDataJson = JSON.stringify(config.structuredData ?? null);

  useEffect(() => {
    if (Platform.OS !== "web") return;

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
      .forEach((node) => {
        node.remove();
      });

    const structuredData: SEOConfig["structuredData"] = JSON.parse(structuredDataJson);
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
    title,
    description,
    canonical,
    ogTitle,
    ogDescription,
    ogImage,
    noindex,
    structuredDataJson,
  ]);
}
