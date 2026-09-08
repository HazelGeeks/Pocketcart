import { useEffect, useId, useRef, useState } from "react";
import { AppIcon } from "./icons/AppIcon";
import "./mobileNavigation.css";

type MobileNavLink = { label: string; href: string; onSelect: () => void };

export default function MobileNavigation({
  links,
  locale,
}: {
  links: MobileNavLink[];
  locale: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: Event) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("focusin", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("focusin", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="pc-mobile-navigation">
      <button
        ref={buttonRef}
        className="pc-mobile-menu-toggle"
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={
          locale === "fr"
            ? open
              ? "Fermer le menu"
              : "Ouvrir le menu"
            : open
              ? "Close menu"
              : "Open menu"
        }
        onClick={() => setOpen(!open)}
      >
        <AppIcon name={open ? "close" : "menu"} size={21} color="#214d35" />
      </button>
      <div id={panelId} className="pc-mobile-menu-panel" hidden={!open}>
        <span className="pc-mobile-menu-label">
          {locale === "fr" ? "EXPLORER POCKETCART" : "EXPLORE POCKETCART"}
        </span>
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            onClick={(event) => {
              if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
              event.preventDefault();
              setOpen(false);
              link.onSelect();
            }}
          >
            <span>{link.label}</span>
            <span aria-hidden="true">↗</span>
          </a>
        ))}
      </div>
    </div>
  );
}
