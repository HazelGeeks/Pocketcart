# PocketCart

PocketCart is an Expo / React Native grocery app with a web landing site and
administration interface. It supports price comparison, Cart, Freezer, personal
Receipts, family inventory sharing, and product sale alerts.

The website supports English and French. Native shopping screens currently use
English copy; website locale support does not imply complete native localization.

See the [documentation index](docs/README.md) for maintained setup guides and
historical release records.
For feature entrypoints and directory responsibilities, use the
[code map](docs/code-map.md).
For Supabase deployment and existing migration history, use the
[backend deployment guide](docs/backend-deployment.md).

## Development

Use Node 22 (`.nvmrc`). Copy `.env.example` to `.env` and configure the required
public client values without committing credentials.

```bash
nvm use
npm install
npm run web
```

| Command | Purpose |
| --- | --- |
| `npm run web` | Start the Expo web development server |
| `npm run dev` / `npm run dev:ios` | Launch the booted iPhone simulator with the development client |
| `npm run ios` | Rebuild and install the current iOS simulator app |
| `npm run dev:client` | Start Metro for an installed development client |
| `npm start` | Start Expo |
| `npm run android` | Build and launch Android |
| `npm run dev:worker` | Export web and serve through the local Workers runtime |

The iOS launcher supports Simulator and Xcode 27 Device Hub. It rebuilds when the
client is missing or lacks embedded simulator Keychain entitlements. Native
rebuilds require the Xcode toolchain and installed iOS Pods.

## Current app structure

- `App.native.tsx` and `src/screens/NativeAppScreen.native.tsx`: native entrypoint
  and navigation. Bottom tabs are **Home · Cart · Freezer · Account**.
- `App.tsx`: web routing, landing sections, legal/support pages, and admin entry.
  `src/screens/NativeAppScreen.tsx` is the web variant of the app shell.
- `src/components/nativeApp/`: native UI. Map and Scan are under Account → Features;
  Notifications opens from the header. Account deletion is under Account →
  Account actions → Delete Account.
- `src/hooks/`: data loading, account-scoped state, synchronization, and UI flows.
- `src/services/`: Supabase, local persistence, permissions, notifications, billing.
- `src/services/marketData/`: products, stores, current prices, and price history.
- `src/shared/design/palette.ts`: shared color tokens.
- `src/i18n/`: English/French website copy and locale persistence.
- `supabase/functions/` and `supabase/migrations/`: backend endpoints and migrations.
- `database/schema.sql`: baseline schema; newer features also require migrations.
- `scripts/`, `tests/`, `.github/workflows/`: tooling, verification, and release jobs.

Home provides search suggestions/recent searches, category selection, and a filter
modal with a store checklist persisted separately for each account and guests.
The list progressively reveals loaded products on scroll; this is distinct from
server-side pagination. Product photos and placeholders retain a white image frame.

Cart preserves guest items locally and synchronizes authenticated personal or
family inventory. Freezer supports named storage and date reminders. Receipts are
personal authenticated records, including private photos and optional extraction;
they do not share the family inventory scope. Product alerts are free with no product-count limit. Cart permits adding up to ten different products (quantities up to
99 each); existing larger saved lists are retained. Freezer does not use the alert quota.
Receipts is available as a preview under Account → Features.

## Backend configuration

Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` for the target
backend. Public Expo values are compiled into the client; service-role keys and
provider secrets belong only in server/CI secret storage.

- [Social authentication](docs/social-auth-setup.md): email callbacks, Apple/Google,
  and account deletion.
- [Family sharing](docs/family-sharing.md): scoped inventory and migration order.
- [Billing](docs/billing-setup.md): Free product alerts and existing subscription management.
- [Receipts](docs/receipts-implementation.md): private records/photos and extraction.

Web admin is available at `/admin`. Database writes require membership in
`public.admin_users`; the optional public admin email list is only a UI guard.
Product imports use reviewed identity matching and route ambiguous matches for
review. Flyer extraction uses `back-office-flyer` and server-side authorization.

Admin → **Blog** provides a rich text editor with typography, links, lists, tables,
inline image upload/paste, cover images, categories, authors, previews, and pinned articles.
It manages English and French drafts, immediate publication, scheduled publication,
and unpublishing. Published articles load from Supabase without rebuilding the website;
drafts and writes are restricted to existing `admin_users` members. Article URLs and
languages stay fixed after the first save, and concurrent edits are checked before
overwriting a saved revision. The `20261007010000_blog_posts.sql` migration creates
the table and preserves the existing six articles in both languages;
`20261007020000_blog_rich_editor.sql` adds rich content, scheduling, and private image storage.
Review and apply both migrations in order through the backend release guide before
deploying the new web build. Images accept JPG, PNG, and WebP up to 5 MB. Draft and
future scheduled images require admin access; public reads use the database publication
time. Publication inputs use the browser's local time zone.
The deployed blog requires both migrations: backend outages or missing setup return
an explicit 503 response, and missing/unpublished article URLs return 404. Expo's
development-only client blog retains its legacy compatibility fallback. Contact support
at `hello@pocketcart.app`.

`Sale Alert Sync` runs every six hours and can be triggered manually after price
imports. Deployment and real-device push delivery need separate verification.
Do not replay `database/schema.sql` against production as a routine setup step;
review applied migrations and deploy only the intended changes.

## Quality checks

```bash
npm run verify
npm run release:native:config-check
npm run release:store-assets:check
npm run audit:ci
```

`verify` runs typecheck, Biome lint, the full automated test suite, and web export.
`release:native:check` combines `verify` with native configuration and store asset
checks. The audit policy checks development dependencies too and rejects every
high/critical finding without exemptions. Source-controlled build-tool forks also
undergo file integrity checks; see [dependency security](docs/dependency-security.md).
Simulator/device interaction, production schema,
and store readiness are separate checks.

## Web deployment

The canonical site is configured as `https://pocketcart.app`; `www.pocketcart.app`
and the legacy `pocketcart.hazelgeeks.workers.dev` host are also configured in
`wrangler.jsonc`. Live availability must be checked separately.

```bash
npm run deploy:worker:dry-run
npm run deploy:worker
```

Workers Builds variables named `EXPO_PUBLIC_*` are compiled into the exported
bundle, separately from Worker runtime secrets. Optional website analytics uses
`EXPO_PUBLIC_GA_MEASUREMENT_ID` (placeholder IDs are ignored). The build also creates
localized static HTML for home, support, privacy and terms, and a Worker that renders
published blog articles and the sitemap on each request. Admin and account deletion
retain the Expo client application. No additional database migration is needed for
this rendering change. See [web rendering](docs/web-rendering.md) for routing,
configuration, caching and verification. The navbar download action scrolls to the
website download section.

## Native release

Follow the [mobile release guide](docs/mobile-store-release.md) for preflight,
credentials, environment setup, and Apple/Google checks.

For a local iOS build, prepare Xcode, CocoaPods, Fastlane, signing credentials,
and production environment values. Increment the iOS build number in `app.json`
and `ios/PocketCart/Info.plist` together for each new upload.

```bash
npm run build:ios:local -- --output /tmp/pocketcart.ipa
npm run submit:ios -- --path /tmp/pocketcart.ipa
```

The `production-local` profile preserves the build number for retries. The cloud
commands `npm run build:ios` and `npm run build:android` use the production profile
with automatic incrementing. `npm run submit:ios` / `npm run submit:android` require
an explicit `--id <REVIEWED_BUILD_UUID>` or `--path <ARTIFACT>`; no latest artifact
is selected automatically. `npm run eas -- <command>` uses the CLI version in
`eas.json`. Development/preview profiles use this common EAS entrypoint.

Build success, upload completion, Apple processing, TestFlight group availability,
and public store release are distinct stages. Keep credentials out of Git.
