import { AppIcon } from "../components/icons/AppIcon";
import { marketingCopy } from "../components/marketing/marketingCopy";
import { useSiteI18n } from "../i18n/siteI18n";

export default function FeaturesSection() {
  const { locale } = useSiteI18n();
  const c = marketingCopy[locale];
  return (
    <section id="features" className="pc-marketing pc-features" aria-labelledby="pc-features-title">
      <div className="pc-container">
        <div className="pc-section-heading">
          <div>
            <p className="pc-eyebrow">{c.featureEyebrow}</p>
            <h2 id="pc-features-title">{c.featureTitle}</h2>
          </div>
          <p>{c.featureIntro}</p>
        </div>
        <div className="pc-feature-grid">
          <article className="pc-compare-card">
            <span className="pc-feature-icon">
              <AppIcon name="map" size={23} color="#cdee93" />
            </span>
            <h3>{c.compare}</h3>
            <p>{c.compareBody}</p>
            <div className="pc-comparison">
              <div className="pc-comparison-heading">
                <span>{c.compareLabel}</span>
                <strong>
                  {c.product} · {c.unit}
                </strong>
              </div>
              {c.stores.map((store, i) => (
                <div className={`pc-store-row ${i === 0 ? "pc-store-best" : ""}`} key={store}>
                  <span className="pc-store-letter">{String.fromCharCode(65 + i)}</span>
                  <span>{store}</span>
                  {i === 0 && <small>{c.best}</small>}
                  <strong>
                    {locale === "fr"
                      ? ["1,99 $", "2,49 $", "2,79 $"][i]
                      : ["$1.99", "$2.49", "$2.79"][i]}
                  </strong>
                </div>
              ))}
            </div>
            <small className="pc-example-note">{c.example}</small>
          </article>
          <article className="pc-list-card">
            <span className="pc-feature-icon">
              <AppIcon name="list" size={23} color="#28533a" />
            </span>
            <h3>{c.listTitle}</h3>
            <p>{c.listBody}</p>
            <div className="pc-list-preview">
              <strong>{c.list}</strong>
              {c.listItems.map((item, i) => (
                <div key={item}>
                  <span className={i === 0 ? "pc-check pc-checked" : "pc-check"}>
                    {i === 0 ? "✓" : ""}
                  </span>
                  <span>{item}</span>
                  <small>× 1</small>
                </div>
              ))}
              <span className="pc-list-caption">{c.listHint}</span>
            </div>
          </article>
          <article className="pc-alert-card">
            <div>
              <span className="pc-eyebrow">{c.alert}</span>
              <h3>{c.alertTitle}</h3>
              <p>{c.alertDescription}</p>
            </div>
            <div className="pc-notification">
              <span className="pc-feature-icon">
                <AppIcon name="bell" size={22} color="#28533a" />
              </span>
              <div>
                <strong>PocketCart</strong>
                <span>{c.alertSample}</span>
              </div>
              <span aria-hidden="true">↗</span>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
