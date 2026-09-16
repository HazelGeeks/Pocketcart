# PocketCart production domain — September 16, 2026 (UTC)

Canonical website: `https://pocketcart.app`.

## Hosting

- Both `pocketcart.app` and `www.pocketcart.app` were already active Cloudflare
  Custom Domains on the existing `pocketcart` production Worker when checked.
  HTTPS returned the PocketCart website on both hosts.
- The active zone is in the same Hazel Co. account as the Worker. Its authoritative
  name servers are `melina.ns.cloudflare.com` and `trace.ns.cloudflare.com`.
- `wrangler.jsonc` now records the account and both Custom Domains so future
  deployments preserve the connection. The existing workers.dev host remains enabled.
- SEO canonical, Open Graph, sitemap, public support/legal links and store metadata
  use `pocketcart.app`. No registrar or mail-record changes are needed.

## Authentication and compatibility

- Supabase Site URL changed from `http://localhost:8081` to `https://pocketcart.app`.
- Exact root redirect URLs for the apex domain, www host, and legacy workers.dev
  host are allowed. Existing native callback and development URLs are preserved.
- Web email confirmation and password-reset requests return to the browser's
  origin even if the shared build environment contains the native callback URI.
- The updated family-invite parser accepts both new hosts and the old host while
  rejecting lookalike domains and insecure HTTP links. Generated invites retain
  the old host for compatibility with installed build 10 and older clients.
- Existing TestFlight build 10 still contains its original website links. Those
  destinations remain live; updated native link constants will ship with the next
  native build. This web-domain change does not require replacing the installed app.

## Validation

- Release check: type checking, lint, 389 tests, web export and native/store checks.
- Audit policy passes with the existing five allowed transitive build-tool findings.
- App Store support, marketing, privacy and privacy-choice URLs are updated through
  App Store Connect as part of this migration; privacy collection answers are unchanged.
