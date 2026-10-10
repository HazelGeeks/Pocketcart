# Web rendering

This guide explains the public website build, routing, SEO and verification.
Code reviewed: 2026-10-09. Local verification does not establish production deployment,
search indexing, real-device performance or screen-reader certification.

## Current behavior

| Routes | Rendering | Browser code |
| --- | --- | --- |
| `/`, `/support`, `/privacy`, `/terms` | Localized HTML generated during the web build (SSG) | Small navigation/preview/analytics enhancement |
| `/blog`, `/blog/<slug>` | Cloudflare Worker reads the public Supabase view and renders HTML per request (SSR) | Same small enhancement; no Expo entry or editor bundle |
| `/admin`, `/delete-account` | Expo client application (CSR) | App entry; admin and rich editor loaded in separate chunks |
| `/sitemap.xml` | Current published article metadata, generated per request | None |
| Unknown page/article | HTTP 404 with noindex | None required |

The public blog uses the same [BlogContent](../src/components/blog/BlogContent.tsx) and
[BlogArticleBody](../src/components/blog/BlogArticleBody.tsx) as the client development
screen. SSG home sections reuse the marketing components. Legal and support text have
one source in `src/data/`; legal body content remains English and is marked `lang="en"`
when the surrounding French navigation is selected. The mobile navigation and FAQ use
native HTML disclosure controls; reading and navigation work without JavaScript.

English uses the canonical URL without a language query. French uses `?lang=fr`.
Canonical, hreflang, Open Graph and JSON-LD arrive in the first HTML response. The
sitemap contains only current public articles and excludes admin/account deletion.
If an article has no French version, its French link redirects temporarily to English.

`public/robots.txt` allows page and script/style crawling and points to the canonical
`https://pocketcart.app/sitemap.xml`. Admin/account deletion stay crawlable so Google
can read their HTTP noindex headers. There is no static sitemap copy: the Worker
always generates it from the current public view. Submit this URL in Google Search
Console and use its sitemap/URL inspection reports to check actual indexing; serving
valid files alone does not establish submission, crawling or search ranking.

## Build and deployment

`npm run build:web` exports the Expo client, fingerprints its final entry, then runs
[build-web-server.mjs](../scripts/build-web-server.mjs). The latter writes generated
static pages and fingerprinted CSS into `dist/`, and the Worker into `.web-server/`.
Both output directories are ignored by Git. Always run the build before Wrangler.

Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in the existing
Workers Builds environment. Only a Supabase anonymous JWT or publishable key is allowed;
the build rejects privileged JWT roles. These are already public client settings, not
service-role credentials. No new runtime secret or database migration is required.
Optional `EXPO_PUBLIC_GA_MEASUREMENT_ID` must be a real GA ID; placeholder IDs are ignored.
The existing AdSense script is retained. Third-party script loading is separate from
the site's own small enhancement script and can still affect measured performance.

The generated binding/runtime declarations live in
[worker-configuration.d.ts](../src/web/worker-configuration.d.ts). Regenerate them after
changing [wrangler.jsonc](../wrangler.jsonc). To avoid importing local private environment
names into declarations, pass Wrangler an empty environment file when generating types.

Workers must receive the configured public routes before asset handling. Internal
generated HTML is fetched through `env.ASSETS`; `html_handling: "none"` prevents automatic
extension redirects from creating a routing loop. Admin/account deletion receive the
client shell with an HTTP `X-Robots-Tag: noindex, nofollow` header. Other unknown paths
receive 404 rather than the home shell. Historical `#/blog` and other known hash bookmarks
are converted to ordinary page URLs by the small enhancement.

## Freshness and errors

The Worker only reads `published_blog_posts`, using the public anonymous key. It never
forwards request authentication or cookies to Supabase, and never falls back to bundled
articles during outages. Draft/future publication visibility is controlled by the existing
database view and RLS policies. Unpublishing therefore affects the next request without
redeployment. Blog HTML and sitemap use `no-store`. The server reuses metadata,
article bodies and signed image URLs for up to 30 seconds in a bounded cache.
Before every request it reads only public article IDs and revision timestamps from
the published view, without caching that check. A publication, edit, unpublish or
scheduled visibility change produces a different cache key immediately. If the
revision check fails, the response is 503; previously cached content is not served.
Concurrent reads share their pending request. This reduces full payload reads and
repeated image signing while retaining a small DB visibility check per request.
Static HTML uses revalidation, and fingerprinted script/CSS assets use immutable caching.

Backend requests have timeouts and bounded response parsing. Metadata uses pages of 250
rows with stable ID ordering and a ceiling of 10,000 rows; article bodies are fetched only
for the requested slug. Only images displayed on the page receive fresh signed URLs.
Images that cannot be individually signed keep the renderer's unavailable-image fallback.
A backend failure returns 503/noindex with Retry-After and a working retry link.

## Verification and limits

Run `npm run verify` and `npm run deploy:worker:dry-run`. Unit regressions in
[webRendering.test.cjs](../tests/webRendering.test.cjs) cover initial HTML and valid escaped
JSON-LD, translation alternates, public-only reads, 404/503 handling, sitemap, static route
selection and HEAD responses. GitHub release checks use compile-only public backend
fixtures; they do not deploy those artifacts or read production data.

Use `npm run dev:worker` to inspect the complete deployed routing locally. `npm run web`
starts Expo's client development application and cannot validate SSG/SSR or Worker headers.
Check English/French routes, 390px and narrower screens, photos, focus outlines, skip links,
Enter/Space disclosure controls, Escape menu closure, FAQ and download anchors. Confirm
that public HTML contains real body text and has no Expo AppEntry script. Separately check
admin login UI and deletion form validation without submitting a real deletion request.

Asset byte reductions and responsive/keyboard checks are useful evidence, but do not
establish Lighthouse scores or real-user LCP/INP/CLS. Measure those with configured DevTools,
PageSpeed Insights/Search Console and actual devices after deployment. Third-party ads,
custom rich-content image dimensions and authored text colors need separate attention.
