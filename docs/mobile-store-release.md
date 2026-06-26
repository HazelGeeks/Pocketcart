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
- iOS device target: iPhone only for the first store release

## Pre-Submission Gate

Run this before every store build:

```bash
npm run release:native:check
```

This project keeps `ios/` and `android/` in the repository, so native
store-facing settings are not automatically synced from `app.json` by prebuild.
The readiness check explicitly verifies the critical native files that reviewers
care about: iOS bundle ID, build number, privacy manifest, location purpose
string, Android package, versionCode, deep link, maps API metadata, and release
signing behavior.

Expected checks:

- TypeScript compile succeeds.
- Test suite succeeds.
- Web export succeeds for hosted legal pages.
- `/privacy`, `/terms`, and `/delete-account` are reachable in production.
- Supabase Auth redirect URLs include `pocketcart://auth/callback`.
- Supabase Edge Functions `delete-account` and `back-office-flyer` are deployed.
- Supabase secret `SUPABASE_SERVICE_ROLE_KEY` is set for `delete-account`.
- Supabase backend is live and reachable during review.

Run this after logging into Expo and Supabase and setting release secrets:

```bash
npm run release:native:doctor
```

The doctor checks repository release settings plus external readiness:

- Expo authentication through `EXPO_TOKEN` or EAS CLI login
- Supabase authentication through `SUPABASE_ACCESS_TOKEN` or CLI login
- `SUPABASE_PROJECT_ID` for CI function deploys
- Android Google Maps API key
- Supabase service role key for the account-deletion function

## GitHub Actions Release Automation

The repository includes three release workflows:

- `Mobile Release Check`: runs `npm run release:native:check` and
  `npm audit --audit-level=high` on PRs and `main`.
- `EAS Native Build`: manually starts iOS, Android, or all-platform EAS builds.
- `EAS Store Submit`: manually submits the latest iOS or Android EAS artifact
  after store records and credentials are ready.
- `Supabase Functions Deploy`: manually deploys the `delete-account` function
  and sets its `SUPABASE_SERVICE_ROLE_KEY` secret.

Required GitHub repository secrets:

- `EXPO_TOKEN`: Expo token used by the EAS build workflow.
- `SUPABASE_ACCESS_TOKEN`: Supabase access token used by function deployment.
- `SUPABASE_PROJECT_ID`: Supabase project reference.
- `SUPABASE_SERVICE_ROLE_KEY`: service role key used only by Supabase Edge
  Functions.

Also set `POCKETCART_GOOGLE_MAPS_ANDROID_API_KEY` as an EAS environment secret
for Android production builds. Restrict it to the Android package and release
upload certificate SHA-1 before store submission.

## EAS Build

Initialize EAS once per Expo account/project if it has not been initialized:

```bash
eas login
eas init
```

Create production artifacts:

```bash
npm run build:ios
npm run build:android
```

Or use GitHub Actions > `EAS Native Build` after setting `EXPO_TOKEN` and EAS
production environment secrets.

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
at https://pocketcart.app/delete-account.
```

Required URLs:

- Privacy Policy: `https://pocketcart.app/privacy`
- Terms: `https://pocketcart.app/terms`
- Account deletion: `https://pocketcart.app/delete-account`
- Support: `mailto:support@pocketcart.app`

## Supabase Functions

Deploy account deletion before store review:

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<supabase-service-role-key>
supabase functions deploy delete-account
```

Or use GitHub Actions > `Supabase Functions Deploy` after setting the required
Supabase repository secrets.

The native app calls `https://YOUR_PROJECT_REF.supabase.co/functions/v1/delete-account`
with the current Supabase session token. Keep JWT verification enabled in
`supabase/config.toml`.

## Data Safety / App Privacy Baseline

Confirm this against the production build before submission:

- Account data: name and email, used for account management.
- Authentication data: managed by Supabase Auth.
- User content/preferences: watchlist items, target prices, in-app alert
  preferences, and app preferences.
- Location: optional, requested only when the user chooses location-based store
  discovery. Postal-code/manual discovery must remain available.
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
- Location permission has a clear purpose string and can be skipped.
- In-app alert preferences are optional and the app remains usable if disabled.
- Android release artifact is not signed with the debug keystore.
- Store screenshots show real app screens, not web admin pages.
