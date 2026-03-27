import { useEffect } from "react";
import { Platform } from "react-native";
import type { Locale } from "../i18n/types";

const GA_MEASUREMENT_ID =
  process.env.EXPO_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? "";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    __pocketcartGaReady?: boolean;
  }
}

export default function useAnalytics(
  locale: Locale,
  pagePath: string,
) {
  useEffect(() => {
    if (Platform.OS !== "web" || !GA_MEASUREMENT_ID) return;

    if (!window.dataLayer) {
      window.dataLayer = [];
    }
    if (!window.gtag) {
      window.gtag = (...args: unknown[]) => {
        window.dataLayer?.push(args);
      };
    }

    if (!window.__pocketcartGaReady) {
      const existing = document.querySelector(
        `script[data-ga-id="${GA_MEASUREMENT_ID}"]`,
      );

      if (!existing) {
        const script = document.createElement("script");
        script.async = true;
        script.src =
          `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
        script.dataset.gaId = GA_MEASUREMENT_ID;
        document.head.appendChild(script);
      }

      window.gtag("js", new Date());
      window.gtag("config", GA_MEASUREMENT_ID, {
        send_page_view: false,
      });
      window.__pocketcartGaReady = true;
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web" || !GA_MEASUREMENT_ID || !window.gtag) return;

    const pageLocation = `${window.location.origin}${pagePath}`;

    window.gtag("event", "page_view", {
      page_title: document.title,
      page_location: pageLocation,
      page_path: pagePath,
      language: locale,
    });
  }, [locale, pagePath]);
}
