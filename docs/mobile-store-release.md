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

## Pre-Submission Gate

Run this before every store build:

```bash
npm run release:native:check
```

Expected checks:

- TypeScript compile succeeds.
- Test suite succeeds.
- Web export succeeds for hosted legal pages.
- `/privacy`, `/terms`, and `/delete-account` are reachable in production.
- Supabase Auth redirect URLs include `pocketcart://auth/callback`.
- Supabase Edge Functions `delete-account` and `back-office-flyer` are deployed.
- Supabase secret `SUPABASE_SERVICE_ROLE_KEY` is set for `delete-account`.
- Supabase backend is live and reachable during review.

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

Submit after store records and credentials are ready:

```bash
npm run submit:ios
npm run submit:android
```

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
view nearby stores on a map, and request price alerts. Account creation is
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

The native app calls `https://YOUR_PROJECT_REF.supabase.co/functions/v1/delete-account`
with the current Supabase session token. Keep JWT verification enabled in
`supabase/config.toml`.

## Data Safety / App Privacy Baseline

Confirm this against the production build before submission:

- Account data: name and email, used for account management.
- Authentication data: managed by Supabase Auth.
- User content/preferences: watchlist items, target prices, and app
  preferences.
- Location: optional, requested only when the user chooses location-based store
  discovery. Postal-code/manual discovery must remain available.
- Product/search usage: used to provide product search and deal tracking.
- Data is encrypted in transit via HTTPS/TLS.
- Data is not sold.
- No third-party ad tracking is enabled in this release.

## Reviewer Pass Criteria

- App launches without a white screen on a clean install.
- Home, Product Detail, Watchlist, Map, Alert, and More tabs are usable.
- Sign up, sign in, and sign out work against production Supabase.
- Account deletion path is visible from More.
- Signed-in account deletion removes the current Supabase Auth user.
- Location permission has a clear purpose string and can be skipped.
- Push/alert permission is optional and the app remains usable if declined.
- Android release artifact is not signed with the debug keystore.
- Store screenshots show real app screens, not web admin pages.
