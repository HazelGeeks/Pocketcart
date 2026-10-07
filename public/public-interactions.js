// Preserve old hash bookmarks while public pages now use ordinary document URLs.
const legacyRoute = window.location.hash.match(
  /^#\/(blog|privacy|terms|support|admin|delete-account)$/,
);
if (legacyRoute) window.location.replace(`/${legacyRoute[1]}${window.location.search}`);
try {
  window.localStorage.setItem("pocketcart_locale", document.documentElement.lang);
} catch {
  /* Language URLs work without storage. */
}

// A small enhancement for the illustrative watchlist; navigation and FAQ work without JS.
document.addEventListener("click", (event) => {
  const button = event.target instanceof Element ? event.target.closest(".pc-preview-add") : null;
  if (!button) return;
  const added = button.getAttribute("aria-pressed") !== "true";
  button.setAttribute("aria-pressed", String(added));
  button.setAttribute(
    "aria-label",
    button.getAttribute(added ? "data-remove-label" : "data-add-label"),
  );
  button.textContent = `${added ? "✓" : "+"} ${button.getAttribute(added ? "data-added-text" : "data-add-text")}`;
});
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  const menu = document.querySelector(".pc-public-menu[open]");
  if (!menu) return;
  menu.removeAttribute("open");
  menu.querySelector("summary")?.focus();
});

const analyticsId = document.querySelector("script[data-ga-id]")?.getAttribute("data-ga-id");
if (analyticsId && /^G-[A-Z0-9]+$/.test(analyticsId) && !/X{4,}/.test(analyticsId)) {
  window.dataLayer = window.dataLayer || [];
  window.gtag = (...args) => window.dataLayer.push(args);
  window.gtag("js", new Date());
  window.gtag("config", analyticsId, { send_page_view: false });
  window.gtag("event", "page_view", {
    page_title: document.title,
    page_location: window.location.href,
    page_path: window.location.pathname + window.location.search,
    language: document.documentElement.lang,
  });
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${analyticsId}`;
  document.head.appendChild(script);
}
