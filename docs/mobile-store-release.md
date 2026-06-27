# PocketCart Mobile Store Release Checklist

This document tracks the required steps for iOS App Store and Google Play
submission. Keep secrets in Apple, Google, Expo, Supabase, or CI settings. Do
not commit certificates, service account JSON files, keystores, or API keys.

## Current App IDs

- iOS bundle ID: `com.pocketcart.app`
- Android package: `com.pocketcart.app`
- App scheme: `pocketcart`
- Release version: `1.0.0`
- iOS build number: `1`
- Android versionCode: `1`
- Android target SDK baseline: React Native/Expo target `36`
- iOS device target: iPhone only for the first store release
- iOS export compliance: no non-exempt encryption declared in `Info.plist`

## Pre-Submission Gate

Run this before every store build:

```bash
npm run release:native:check
```

This project keeps `ios/` and `android/` in the repository, so native
store-facing settings are not automatically synced from `app.json` by prebuild.
The readiness check explicitly verifies the critical native files that reviewers
care about: iOS bundle ID, build number, privacy manifest, location purpose
string, Android package, versionCode, target SDK baseline, deep link, maps API
metadata, and release signing behavior.

Expected checks:

- TypeScript compile succeeds.
- Test suite succeeds.
- Web export succeeds for hosted legal pages.
- `/privacy`, `/terms`, `/support`, and `/delete-account` are reachable in production.
- Supabase Auth redirect URLs include `pocketcart://auth/callback`.
- Native app handles `pocketcart://auth/callback` email verification links and
  stores the Supabase session.
- Supabase Edge Functions `delete-account`, `delete-account-request`, and
  `back-office-flyer` are deployed.
- Supabase secret `SUPABASE_SERVICE_ROLE_KEY` is set for account functions.
- Supabase backend is live and reachable during review.

Run this after logging into Expo and Supabase and setting release secrets:

```bash
npm run release:native:doctor
```

The doctor checks repository release settings plus external readiness:

- Expo authentication through `EXPO_TOKEN`, GitHub secret, or EAS CLI login
- Supabase authentication through `SUPABASE_ACCESS_TOKEN`, GitHub secret, or
  CLI login
- GitHub repository secrets are present, verified by `gh secret list`
- `SUPABASE_PROJECT_ID` for CI function deploys
- Android Google Maps API key in the EAS `production` environment
- Supabase service role key for the account-deletion function
- Production EAS public client env:
  `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, and
  `EXPO_PUBLIC_AUTH_REDIRECT_URL`

## GitHub Actions Release Automation

The repository includes three release workflows:

- `Mobile Release Check`: runs `npm run release:native:check` and
  `npm audit --audit-level=high` on PRs and `main`.
- `EAS Native Build`: manually starts iOS, Android, or all-platform EAS builds.
  It runs `npm run release:native:check` first and waits for native artifact
  completion.
- `EAS Store Submit`: manually submits the latest iOS or Android EAS artifact
  after store records and credentials are ready. It verifies the live legal,
  support, and account deletion URLs before submission.
- `Supabase Functions Deploy`: manually deploys the account functions and sets
  their `SUPABASE_SERVICE_ROLE_KEY` secret.

Required GitHub repository secrets:

- `EXPO_TOKEN`: Expo token used by the EAS build workflow.
- `SUPABASE_ACCESS_TOKEN`: Supabase access token used by function deployment.
- `SUPABASE_PROJECT_ID`: Supabase project reference.
- `SUPABASE_SERVICE_ROLE_KEY`: service role key used only by Supabase Edge
  Functions.

Set and verify them with:

```bash
gh secret set EXPO_TOKEN
gh secret set SUPABASE_ACCESS_TOKEN
gh secret set SUPABASE_PROJECT_ID
gh secret set SUPABASE_SERVICE_ROLE_KEY
gh secret list
```

Required EAS `production` environment variables:

- `EXPO_PUBLIC_SUPABASE_URL`: production Supabase project URL.
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: production Supabase anon key. This is a
  public client key, but it must still point at the production project.
- `EXPO_PUBLIC_AUTH_REDIRECT_URL`: `pocketcart://auth/callback`.
- `EXPO_PUBLIC_SUPABASE_PRODUCT_IMAGE_BUCKET`: `product-images`.
- `EXPO_PUBLIC_FLYER_AI_ENDPOINT`: production `back-office-flyer` function URL
  if admin flyer extraction is needed in the release build.
- `POCKETCART_GOOGLE_MAPS_ANDROID_API_KEY`: Android Maps SDK key.

Restrict the Android maps key to package `com.pocketcart.app` and the release
upload certificate SHA-1 before store submission.

## EAS Build

Initialize EAS once per Expo account/project if it has not been initialized:

```bash
npm install --global eas-cli
eas login
eas init
```

Create production artifacts:

```bash
npm run build:ios
npm run build:android
```

Or use GitHub Actions > `EAS Native Build` after setting `EXPO_TOKEN` and EAS
production environment variables. The production build profile uses the EAS
`production` environment and the GitHub workflow waits for artifact completion.

Minimum EAS environment setup:

```bash
eas env:create --environment production --name EXPO_PUBLIC_SUPABASE_URL --value https://YOUR_PROJECT_REF.supabase.co --visibility plaintext
eas env:create --environment production --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value YOUR_SUPABASE_ANON_KEY --visibility sensitive
eas env:create --environment production --name EXPO_PUBLIC_AUTH_REDIRECT_URL --value pocketcart://auth/callback --visibility plaintext
eas env:create --environment production --name EXPO_PUBLIC_SUPABASE_PRODUCT_IMAGE_BUCKET --value product-images --visibility plaintext
eas env:create --environment production --name POCKETCART_GOOGLE_MAPS_ANDROID_API_KEY --value YOUR_ANDROID_MAPS_KEY --visibility sensitive
```

Submit after store records and credentials are ready:

```bash
npm run submit:ios
npm run submit:android
```

Or use GitHub Actions > `EAS Store Submit` after the corresponding EAS build
has completed and store credentials are configured.

## Required External Credentials

iOS:

- Active Apple Developer Program membership.
- App Store Connect app created for `com.pocketcart.app`.
- Distribution certificate and provisioning profile managed by EAS or Apple.
- App privacy questionnaire completed from the app's actual data practices.
- Review notes include a demo account or a fully usable demo path.
- Account deletion is available in the app from More > Account deletion.
- Export compliance answer matches `ITSAppUsesNonExemptEncryption=false` unless
  a future release adds custom or non-exempt encryption.

Android:

- Google Play Console app created for `com.pocketcart.app`.
- Play App Signing enabled.
- Upload key managed by EAS credentials or the `POCKETCART_UPLOAD_*` Gradle
  properties/environment variables.
- Google Play service account configured if using `eas submit`.
- Google Maps Android API key restricted to package `com.pocketcart.app` and
  the release upload certificate SHA-1.

## Android Local Release Signing

EAS managed credentials are preferred. If local signing is needed, provide:

```bash
POCKETCART_UPLOAD_STORE_FILE=/absolute/path/to/upload-keystore.jks
POCKETCART_UPLOAD_STORE_PASSWORD=...
POCKETCART_UPLOAD_KEY_ALIAS=...
POCKETCART_UPLOAD_KEY_PASSWORD=...
```

The Android release build no longer falls back to the debug keystore. If no
release signing credentials are provided locally, use EAS credentials or expect
an unsigned local release artifact.

## Google Maps

Android maps require:

```bash
POCKETCART_GOOGLE_MAPS_ANDROID_API_KEY=...
```

Restrict the key in Google Cloud:

- Android package: `com.pocketcart.app`
- SHA-1: release upload certificate fingerprint
- API: Maps SDK for Android

## Store Metadata

The source-controlled store listing draft lives in:

- `store-assets/metadata/en-US.json`
- `store-assets/google-play/feature-graphic.jpg`
- `store-assets/screenshots/README.md`

Validate it before submission:

```bash
npm run release:store-assets:check
npm run release:store-assets:live-check
```

Recommended category:

- iOS: Shopping
- Google Play: Shopping

Short description:

```text
Track grocery prices, compare stores, and watch for better deals.
```

Review notes:

```text
PocketCart helps users compare grocery prices, save products to a watchlist,
view nearby stores on a map, and review in-app price alerts. Account creation is
available in More. Account deletion is available in More > Account deletion and
at https://pocketcart.pages.dev/delete-account.
```

Required URLs:

- Support: `https://pocketcart.pages.dev/support`
- Marketing: `https://pocketcart.pages.dev`
- Privacy Policy: `https://pocketcart.pages.dev/privacy`
- Terms: `https://pocketcart.pages.dev/terms`
- Account deletion: `https://pocketcart.pages.dev/delete-account`

The custom `pocketcart.app` domain should not be used in store metadata until
DNS is live. If a branded support email is required later, configure DNS and MX
records first, then update the policies and listing metadata in the same PR.

## Supabase Functions

Apply the latest `database/schema.sql` before deploying account functions. The
web deletion request form writes to `public.account_deletion_requests`.

Deploy account deletion functions before store review:

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<supabase-service-role-key>
supabase functions deploy delete-account
supabase functions deploy delete-account-request
```

Or use GitHub Actions > `Supabase Functions Deploy` after setting the required
Supabase repository secrets.

The native app calls `https://YOUR_PROJECT_REF.supabase.co/functions/v1/delete-account`
with the current Supabase session token. Keep JWT verification enabled in
`supabase/config.toml`. The web deletion page calls
`https://YOUR_PROJECT_REF.supabase.co/functions/v1/delete-account-request`
without a user session so users can request deletion even if they cannot access
the app.

## Data Safety / App Privacy Baseline

Confirm this against the production build before submission:

- Account data: name and email, used for account management.
- Authentication data: managed by Supabase Auth.
- User content/preferences: watchlist items, target prices, in-app alert
  preferences, and app preferences.
- Support/account deletion request data: account email, platform, request
  details, and technical request metadata submitted through `/support` or
  `/delete-account`.
- Location: optional, requested only when the user chooses location-based store
  discovery. Postal-code/manual discovery must remain available.
  iOS privacy manifest declares precise/coarse location for app functionality,
  not tracking.
- Product/search usage: used to provide product search and deal tracking.
- Data is encrypted in transit via HTTPS/TLS.
- Data is not sold.
- No third-party ad tracking is enabled in this release.

Store forms must match the production app exactly. If a new SDK, analytics
provider, push notification provider, or payment provider is added later,
revisit this section before shipping another build.

## Reviewer Pass Criteria

- App launches without a white screen on a clean install.
- Home, Product Detail, Watchlist, Map, Alert, and More tabs are usable.
- Sign up, sign in, and sign out work against production Supabase.
- Account deletion path is visible from More.
- Signed-in account deletion removes the current Supabase Auth user.
- Web account deletion request form accepts an account email and creates an
  `account_deletion_requests` row.
- Location permission has a clear purpose string and can be skipped.
- In-app alert preferences are optional and the app remains usable if disabled.
- Android release artifact is not signed with the debug keystore.
- Store screenshots show real app screens, not web admin pages.
