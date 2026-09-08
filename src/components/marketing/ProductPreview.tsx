import { useState } from "react";
import { AppIcon } from "../icons/AppIcon";
import { useSiteI18n } from "../../i18n/siteI18n";
import { marketingCopy } from "./marketingCopy";

const groceryAsset = require("../../../assets/photos/fresh-grocery-basket.jpg");
const groceries = typeof groceryAsset === "string" ? groceryAsset : groceryAsset.uri;

export function GroceryPhoto({ className = "", alt = "" }: { className?: string; alt?: string }) {
  return <img className={className} src={groceries} alt={alt} width={1200} height={1800} />;
}

export default function ProductPreview() {
  const { locale } = useSiteI18n();
  const c = marketingCopy[locale];
  const [added, setAdded] = useState(false);
  return (
    <div className="pc-preview-scene">
      <p className="pc-preview-disclosure">{c.preview}</p>
      <div className="pc-photo-story">
        <GroceryPhoto />
        <span>{c.basket}</span>
      </div>
      <div className="pc-app-preview">
        <div className="pc-preview-brand">
          <span className="pc-brand-mark">p.</span>
          <strong>PocketCart</strong>
          <AppIcon name="bell" size={18} color="#174d37" />
        </div>
        <h3>{c.appTitle}</h3>
        <div className="pc-search-preview">
          <AppIcon name="search" size={15} color="#67776d" />
          <span>{c.search}</span>
        </div>
        <div className="pc-product-intro">
          <div className="pc-tomato-photo">
            <GroceryPhoto />
          </div>
          <div>
            <span className="pc-mini-label">{c.produce}</span>
            <h4>{c.product}</h4>
            <span className="pc-muted">{c.unit}</span>
          </div>
        </div>
        <div className="pc-price-block">
          <span>{c.current}</span>
          <div>
            <strong>{locale === "fr" ? "1,99 $" : "$1.99"}</strong>
            <span>
              {c.previous} <s>{locale === "fr" ? "2,49 $" : "$2.49"}</s>
            </span>
          </div>
        </div>
        <div className="pc-price-note">
          <span>↘</span> {c.sale}
        </div>
        <button
          className="pc-preview-add"
          type="button"
          aria-pressed={added}
          aria-label={added ? c.remove : c.add}
          onClick={() => setAdded(!added)}
        >
          <span aria-hidden="true">{added ? "✓" : "+"}</span>
          {added ? c.added : c.add}
        </button>
        <div className="pc-preview-bottom">
          <span>PocketCart</span>
        </div>
      </div>
      <div className="pc-floating-note">
        <span className="pc-note-icon">
          <AppIcon name="heart" size={21} color="#164b35" />
        </span>
        <div>
          <strong>{c.alert}</strong>
          <span>{c.alertBody}</span>
        </div>
      </div>
    </div>
  );
}
