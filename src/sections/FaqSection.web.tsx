import { useSiteI18n } from "../i18n/siteI18n";
import "../components/marketing/faq.css";

export default function FaqSection() {
  const { copy } = useSiteI18n();
  return (
    <section id="faq" className="pc-marketing pc-faq" aria-labelledby="pc-faq-title">
      <div className="pc-container pc-faq-grid">
        <div>
          <p className="pc-eyebrow">{copy.faq.eyebrow}</p>
          <h2 id="pc-faq-title">{copy.faq.title}</h2>
        </div>
        <div>
          {copy.faq.items.map((faq, i) => (
            <details key={faq.q} open={i === 0}>
              <summary>
                <span aria-hidden="true">0{i + 1}</span>
                {faq.q}
              </summary>
              <p>{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
