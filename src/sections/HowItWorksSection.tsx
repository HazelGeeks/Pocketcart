import { AppIcon, type AppIconName } from "../components/icons/AppIcon";
import { marketingCopy } from "../components/marketing/marketingCopy";
import { useSiteI18n } from "../i18n/siteI18n";

const icons: AppIconName[] = ["search", "chart", "list"];
export default function HowItWorksSection() {
  const { locale } = useSiteI18n();
  const c = marketingCopy[locale];
  const examples = [c.searchExample, c.compareExample, c.listExample];
  return (
    <section id="how-it-works" className="pc-marketing pc-how" aria-labelledby="pc-how-title">
      <div className="pc-container">
        <p className="pc-eyebrow">{c.howEyebrow}</p>
        <h2 id="pc-how-title">{c.howTitle}</h2>
        <div className="pc-steps">
          {c.steps.map((step, i) => (
            <article key={step.title}>
              <div className="pc-step-number">
                <span>0{i + 1}</span>
                <span aria-hidden="true">{i < 2 ? "→" : "✓"}</span>
              </div>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
              <div className="pc-step-example">
                <AppIcon name={icons[i]} size={19} color="#28533a" />
                <span>{examples[i]}</span>
              </div>
            </article>
          ))}
        </div>
        <p className="pc-small-note">{c.example}</p>
      </div>
    </section>
  );
}
