import { GroceryPhoto } from "../components/marketing/ProductPreview";
import { marketingCopy } from "../components/marketing/marketingCopy";
import { useSiteI18n } from "../i18n/siteI18n";

export default function CtaSection() {
  const { locale } = useSiteI18n();
  const c = marketingCopy[locale];
  return (
    <section id="download" className="pc-marketing pc-download" aria-labelledby="pc-download-title">
      <div className="pc-container pc-download-grid">
        <div>
          <p className="pc-eyebrow">{c.ctaEyebrow}</p>
          <h2 id="pc-download-title">{c.ctaTitle}</h2>
          <p className="pc-download-description">{c.ctaBody}</p>
          <div className="pc-platforms">
            <span>
              {c.ios}
              <small>{c.available}</small>
            </span>
            <span>
              {c.android}
              <small>{c.available}</small>
            </span>
          </div>
        </div>
        <div className="pc-download-photo">
          <GroceryPhoto />
          <span>
            PocketCart<span aria-hidden="true">↗</span>
          </span>
        </div>
      </div>
    </section>
  );
}
