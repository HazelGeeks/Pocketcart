# PocketCart (React Native Scaffold)

TypeScript-first scaffold for a shopping helper app where users can
compare prices, track products, and estimate savings.

Current language support:

- English (`en`)
- French (`fr`)

## Run

```bash
nvm use
npm install
npm run dev
npm run verify
```

Web-first development:

- `npm run dev` or `npm run dev:web`: start web app on `http://localhost:8081`

Native development:

- `npm run dev:native`: start Expo for native targets
- `npm run dev:ios`: use the currently booted iPhone simulator; install the
  PocketCart development build automatically when it is missing
- `npm run ios`: rebuild and install PocketCart on the currently booted iPhone
  simulator
- `npm run android`

Recommended Node runtime:

- Node 22 LTS (`.nvmrc` included)

## Quality Gates

- `npm run typecheck`: TypeScript compile checks
- `npm run lint`: strict no-emit TypeScript check (temporary lint gate)
- `npm run test`: route smoke tests
- `npm run build:web`: Expo static web export
- `npm run verify`: full pre-release gate (`typecheck + lint + test + build:web`)
- `npm run release:native:check`: pre-store gate for iOS/Android release work
- `npm run release:native:doctor`: external EAS/Supabase/key readiness check
- `npm run build:ios` / `npm run build:android`: EAS production builds
- `npm run submit:ios` / `npm run submit:android`: EAS store submissions

## Mobile Release / Deployment

Detailed release notes live in `docs/mobile-store-release.md`. Use this README
section as the quick command path for store deployment.

Preflight before every mobile release:

```bash
npm run release:native:check
npm run release:store-assets:live-check
npm audit --audit-level=high
```

Print missing GitHub/EAS/Supabase setup values without exposing secrets:

```bash
npm run release:native:setup-guide
npm run release:native:doctor
```

Android production build:

```bash
npx eas-cli build --platform android --profile production --non-interactive --no-wait
npx eas-cli build:list --platform android --limit 3
```

Android submission options:

- Manual first release path: download the latest `.aab` from EAS and upload it
  to Google Play Console > Internal testing. This does not require a Google
  Play service account.
- Automated path: create/configure a Google Play service account, connect it in
  EAS credentials, then submit with:

```bash
npx eas-cli credentials --platform android
npx eas-cli submit --platform android --profile production --latest
```

When `npx eas-cli credentials --platform android` asks which build profile to
configure, select `production` for store release work.

iOS release requirements:

- An active paid Apple Developer Program membership is required.
- App Store Connect must have an app record for bundle ID `com.pocketcart.app`.
- The first iOS credential setup must be interactive because Apple login/2FA
  and distribution certificate validation cannot be completed by CI alone.

```bash
npx eas-cli credentials:configure-build --platform ios --profile production
npx eas-cli build --platform ios --profile production --non-interactive --no-wait
npx eas-cli submit --platform ios --profile production --latest
```

Store submission still requires real screenshots captured from a release,
TestFlight, or Google Play internal testing build. Keep Apple credentials,
Google service account JSON files, Android keystores, and API keys out of git.

## Structure

- `App.tsx`: route shell + section composition
- `src/screens/NativeAppScreen.tsx`: native app shell
  (Home / Watchlist / Map / Alert / More)
- `src/services/supabaseClient.ts`: Supabase client bootstrap
- `src/services/userProfile.ts`: sign-up and profile read/write helpers
- `src/screens/DeleteAccountScreen.tsx`: external account deletion page
  (`/delete-account`)
- `src/sections/*`: landing page sections
- `src/components/*`: shared UI blocks
- `src/i18n/siteI18n.tsx`: locale provider + persistence
- `src/i18n/siteCopy.ts`: EN/FR copy dictionary for the SPA
- `src/screens/BlogScreen.tsx`: blog route
- `src/screens/PrivacyScreen.tsx`: privacy route
- `src/screens/TermsScreen.tsx`: terms route

## Notes

- Google Analytics 4:
  - Create a web data stream in GA4 and set
    `EXPO_PUBLIC_GA_MEASUREMENT_ID` in your local env and deployment env.
  - Example: copy `.env.example` to `.env` and replace the placeholder value.
- Supabase (for native `More` / `Watchlist` / `Home` / `Map` data):
  - Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env`
  - Optional admin UI guard: `EXPO_PUBLIC_ADMIN_EMAILS=email1@example.com,email2@example.com`
  - Schema source: `database/schema.sql`
  - Required tables and RLS policies:
    - `profiles`
    - `watchlist_items`
    - `products`
    - `stores`
    - `product_prices`
    - `sale_alerts`
    - `user_push_tokens`
  - Keep schema/policy SQL out of README and manage it in Supabase Dashboard or migration files.
  - Push sale alerts:
    - Native builds use Expo Push Notifications through `expo-notifications`.
    - Deploy `send-sale-alert-push` and `sync-sale-alerts` Supabase Edge Functions.
    - Set `PUSH_FUNCTION_SECRET` as a Supabase function secret.
    - `.github/workflows/sale-alert-sync.yml` calls `sync-sale-alerts` every six
      hours. It can also be run manually after a price import so watched products
      create and send push alerts while the app is closed.
- Web deploy:
  - Export a production build with `npm run build:web`
  - Upload the generated `dist/` directory to your hosting provider
- Mobile store release:
  - Follow `docs/mobile-store-release.md`
  - Build profiles are configured in `eas.json`
  - Keep Apple/Google credentials, Android keystores, service account JSON, and API keys out of git
- Get the App navigation:
  - Hover `Get the App` in the top navbar (web) to open direct iOS/Android download links.
  - Tap `Get the App` on native/mobile to toggle the same two links.
- Native app shell:
  - iOS/Android renders a dedicated native app scaffold, separate from the web landing screen.
  - `Home` tab supports product search, detail page transition, `Add to Watchlist`, and 7-day price trend with previous-price list.
  - `Map` tab is wired to in-app map + store search and pulls from Supabase `stores` (fallback sample data if env is missing).
  - `More` tab is wired to Supabase sign-up/profile and includes manual admin data entry for products/stores/prices.
  - `Watchlist` tab shows only user-added items from Supabase and supports remove.
- Backoffice:
  - Web admin page is available at `/admin`.
  - Sign in with Supabase auth, then manage `products`, `stores`, and `product_prices`.
  - Backoffice writes require the signed-in user UUID in `public.admin_users`.
    Bootstrap the first admin using the schema source or a tracked migration, not README SQL snippets.
  - Flyer AI extraction uses the `back-office-flyer` Supabase Edge Function with JWT
    verification enabled. Set `FLYER_ADMIN_EMAILS` as a function secret to restrict
    extraction to specific signed-in admin emails.
- Deletion route:
  - Web: `http://localhost:8081/delete-account`
  - Use this URL for Google Play "account deletion URL" field
- Android review hardening:
  - Blocked `SYSTEM_ALERT_WINDOW`
  - Blocked `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE`
- Added release hardening:
  - Route parser smoke tests for `/`, `/blog`, `/privacy`, `/terms`, `/delete-account`
  - Scripted release gate via `npm run verify`
- Web release checklist:
  - Set `EXPO_PUBLIC_GA_MEASUREMENT_ID`
  - Run `npm run verify`
  - Inspect generated `dist/` and deploy
- Breakpoints requested:
  - `xs: 480`
  - `sm: 640`
  - `md: 768`
  - `lg: 1024`
  - `xl: 1280`
  - `2xl: 1536`
- Readable line length target is kept across key source files.
