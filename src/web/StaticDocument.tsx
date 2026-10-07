import type { Locale } from "../i18n/types";
import { SiteI18nProvider } from "../i18n/siteI18n";
import { SITE_COPY } from "../i18n/siteCopy";
import HeroSection from "../sections/HeroSection";
import FeaturesSection from "../sections/FeaturesSection";
import HowItWorksSection from "../sections/HowItWorksSection";
import CtaSection from "../sections/CtaSection";
import FaqSection from "../sections/FaqSection.web";
import {
  PRIVACY_SECTIONS,
  PRIVACY_UPDATED,
  TERMS_SECTIONS,
  TERMS_UPDATED,
} from "../data/legalContent";
import { SUPPORT_EMAIL, SUPPORT_CONTACT, supportSections } from "../data/supportContent";
import { BASE_URL, getSEOConfig, localizedPath } from "./seo";
import { DocumentHead, PublicHeader, PublicFooter } from "./BlogDocument";

export type StaticRoute = "home" | "support" | "privacy" | "terms";
export default function StaticDocument({
  route,
  locale,
  cssPath,
}: {
  route: StaticRoute;
  locale: Locale;
  cssPath: string;
}) {
  const c = SITE_COPY[locale];
  const path = route === "home" ? "/" : `/${route}`;
  const seo = getSEOConfig(route, locale);
  if (route === "home")
    seo.structuredData = [
      { "@context": "https://schema.org", "@type": "WebSite", name: "PocketCart", url: BASE_URL },
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "PocketCart",
        operatingSystem: "iOS, Android",
        applicationCategory: "ShoppingApplication",
        offers: { "@type": "Offer", price: "0", priceCurrency: "CAD" },
        url: BASE_URL,
      },
    ];
  const legal = route === "privacy" ? PRIVACY_SECTIONS : TERMS_SECTIONS;
  const title = route === "privacy" ? c.legal.privacyTitle : c.legal.termsTitle;
  return (
    <html lang={locale}>
      <DocumentHead seo={seo} locale={locale} cssPath={cssPath} alternates={["en", "fr"]} />
      <body className="pc-public">
        <a href="#main-content" className="pc-skip-link">
          {locale === "fr" ? "Aller au contenu" : "Skip to content"}
        </a>
        <PublicHeader locale={locale} path={path} />
        <main id="main-content" tabIndex={-1}>
          {route === "home" ? (
            <SiteI18nProvider initialLocale={locale}>
              <HeroSection />
              <FeaturesSection />
              <HowItWorksSection />
              <FaqSection />
              <CtaSection />
            </SiteI18nProvider>
          ) : route === "support" ? (
            <div className="pc-public-support pc-public-text">
              <h1>{locale === "fr" ? "Assistance PocketCart" : "PocketCart Help & Support"}</h1>
              <section>
                <h2>{locale === "fr" ? "Contactez-nous" : "Contact us"}</h2>
                <p>{SUPPORT_CONTACT[locale]}</p>
                <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
              </section>
              {supportSections(locale).map((section) => (
                <section key={section.title}>
                  <h2>{section.title}</h2>
                  <p>{section.body}</p>
                  {section.url ? (
                    <a href={localizedPath(new URL(section.url).pathname, locale)}>
                      {section.title} →
                    </a>
                  ) : null}
                  {section.secondaryUrl ? (
                    <a href={localizedPath("/terms", locale)}>{c.legal.termsTitle} →</a>
                  ) : null}
                </section>
              ))}
            </div>
          ) : (
            <div className="pc-public-text">
              <p className="pc-eyebrow">LEGAL</p>
              <h1>{title}</h1>
              <p>
                {c.legal.lastUpdated}: {route === "privacy" ? PRIVACY_UPDATED : TERMS_UPDATED}
              </p>
              {locale === "fr" ? <p>{c.legal.englishOnly}</p> : null}
              <div lang="en">
                {legal.map((section) => (
                  <section key={section.title}>
                    <h2>{section.title}</h2>
                    <p>{section.body}</p>
                  </section>
                ))}
              </div>
              <a href={localizedPath("/", locale)}>{c.legal.backToHome}</a>
            </div>
          )}
        </main>
        <PublicFooter locale={locale} />
      </body>
    </html>
  );
}
