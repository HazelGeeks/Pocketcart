import type { MouseEvent } from "react";
import ProductPreview from "../components/marketing/ProductPreview";
import { marketingCopy } from "../components/marketing/marketingCopy";
import { useSiteI18n } from "../i18n/siteI18n";
import "../components/marketing/marketing.css";

export default function HeroSection() {
  const { locale } = useSiteI18n();
  const c = marketingCopy[locale];
  const scrollToSection = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const hash = event.currentTarget.hash;
    const section = document.getElementById(hash.slice(1));
    if (!section) return;
    event.preventDefault();
    if (window.location.hash !== hash) window.history.pushState(null, "", hash);
    section.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      block: "start",
    });
  };
  return (
    <section className="pc-marketing pc-hero">
      <div className="pc-container pc-hero-grid">
        <div className="pc-hero-copy">
          <p className="pc-eyebrow">
            <span className="pc-dot" />
            {c.eyebrow}
          </p>
          <h1>
            {c.title}
            <br />
            <span>{c.accent}</span>
          </h1>
          <p className="pc-lead">{c.intro}</p>
          <div className="pc-actions">
            {/* biome-ignore lint/a11y/useValidAnchor: this is section navigation; the handler enhances scrolling and preserves modified clicks. */}
            <a className="pc-button" href="/#features" onClick={scrollToSection}>
              {c.explore}
              <span aria-hidden="true">↗</span>
            </a>
            {/* biome-ignore lint/a11y/useValidAnchor: this is section navigation; the href remains a working fallback. */}
            <a className="pc-text-link" href="/#how-it-works" onClick={scrollToSection}>
              {c.how}
              <span aria-hidden="true">↓</span>
            </a>
          </div>
          <div className="pc-hero-footnote">
            <span>{c.platform}</span>
            <span>{c.note}</span>
          </div>
        </div>
        <ProductPreview />
      </div>
    </section>
  );
}
