# Operating cost controls and TestFlight build 25

Release observations on October 9, 2026, America/Vancouver. The owner authorized
committing, pushing and deploying the completed cost controls and blue price-drop
indicators. The separate investment planning document and its documentation-index
change were preserved outside this release.

## Source and validation

- Source commit: `511e0c5ec0f97569eaf178c7ac5f57757aa9c7cb` on `main`; remote SHA verified.
- Changes: bounded public-read caches, publication-aware blog/sitemap data reuse,
  Flyer extraction reservations/result reuse/daily request limits, and blue price
  decreases in the catalog, detail, history change and retailer comparison.
- Local native release checks passed: typecheck, lint, 529 tests, web export,
  native configuration and store assets. The screenshot capture warning remains;
  this release did not produce new physical-device screenshots.
- Isolated npm 10.9.8 `npm ci` verified the lockfile, two security patches and 181
  patched fork files. Raw audit: 12 moderate, zero high/critical; audit policy passed.
- Isolated PostgreSQL checks passed for Flyer role privileges, duplicate
  reservations, successful cache reuse, quota exhaustion, failed-attempt counting,
  expiry and exact-once migration replay. Existing blog publication/scheduling and
  backend-runner checks also passed.
- [Source Mobile Release Check](https://github.com/HazelGeeks/Pocketcart/actions/runs/38025959243): success.

## Production backend and web

- [Backend release](https://github.com/HazelGeeks/Pocketcart/actions/runs/38026033035): success.
  Only `20261010010000_flyer_extraction_cache.sql` and `back-office-flyer` were selected.
  The runner read back recorded migration history after commit and checked privileges.
- Migration SHA-256: `5796c47669d06854dcee605bdbc6710ca5609e5e5124997dbee1aae47b52d055`.
- Deployed Flyer function version: **23**, active, October 9 at 22:01 PDT.
  Public/invalid-token requests were denied with 403/401; anonymous HEAD reads of
  all three cache/quota tables and the reservation RPC were denied with 401.
  These checks did not invoke paid OCR/AI or verify an authenticated live extraction.
- Worker version: `1c82a901-ed09-4f8a-9c75-65d9d982c3ff`, 100% active traffic.
- Live JavaScript SHA-256 matched the local exported entry:
  `c52b27b772ce2764ec62adfc0f3a0363d4bd8cef93ecffb409f1beb74153ac25`.
- Home, English/French blog, sitemap, support, privacy, terms and account deletion
  returned 200; a missing blog article returned 404.
- Existing Supabase product-image GET responses already used one-year public
  caching. HEAD responses alone gave a misleading cache result; images were not changed.
- Request/output limits are not a fixed USD cap. Actual savings need operating
  usage and billing evidence after normal traffic and imports.

## Exact native release

- [iOS build workflow](https://github.com/HazelGeeks/Pocketcart/actions/runs/38026035674): success.
- Version: **1.0.0 (25)**, production profile, `STORE` distribution.
- EAS build ID: `a309cf05-5364-4934-b6be-42244a9bc3de`.
- Binary source commit: `511e0c5ec0f97569eaf178c7ac5f57757aa9c7cb`.
- Build completed October 9 at 22:09 PDT. The cloud production build incremented
  the number; `app.json` and `ios/PocketCart/Info.plist` are synchronized to 25 separately.
- [Exact-artifact submission workflow](https://github.com/HazelGeeks/Pocketcart/actions/runs/38026597209): success.
- EAS submission ID: `2f1b4d6b-9063-4ff6-8d17-cdbda8636649`.
- Apple build ID: `a81a2ea7-4c3c-458e-8b2d-aa12837ba323`.
- Apple processing: `VALID`; internal state: `IN_BETA_TESTING`;
  external state: `READY_FOR_BETA_SUBMISSION`.
- Internal `Group` ID: `b198790b-d0ba-4297-bf71-3bbf55d702fb`.
  `hasAccessToAllBuilds=true`; its build list included the exact Apple build.
  No redundant group assignment was made.
- The 736-character en-US tester instructions were saved and read back exactly.
  Internal TestFlight availability is verified; App Store approval, installation
  on the owner's phone and physical camera/push behavior are separate checks.
  The existing App Store review submission was not changed by this release.

## Saved tester instructions

```text
PocketCart 1.0.0 (25)

- Price drops are now blue in Home, product details, price history changes and retailer comparisons. Price increases remain red and unchanged prices are gray.
- Product details reuse recent price reads while refreshing at sale start and end boundaries.
- Web administration reuses saved Flyer extraction results and stops remaining batch requests when the daily analysis limit is reached.
- Public blog and sitemap reads reuse article data while checking current publication status on every request.

Please verify price-change colors, repeated product-detail navigation, store filtering, Cart and Freezer persistence, and manual receipts after updating. Camera and notification checks require a physical device.
```
