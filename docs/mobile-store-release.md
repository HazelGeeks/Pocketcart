# PocketCart Mobile Store Release Checklist

> Maintained guide · checked against repository code on 2026-10-03.
> External account settings and deployed service status require separate verification.

For the camera permission and external donation rejection, complete
[App Review readiness](app-review-readiness.md) with the revised native build and
deployed support website before resubmitting.

This document tracks the required steps for iOS App Store and Google Play
submission. Keep secrets in Apple, Google, Expo, Supabase, or CI settings. Do
not commit certificates, service account JSON files, keystores, or API keys.

## Current App IDs

- iOS bundle ID: `com.pocketcart.app`
- Android package: `com.pocketcart.app`
- App scheme: `pocketcart`
- EAS project: linked through `expo.extra.eas.projectId` in `app.json`
- EAS build runtime: Node.js `22.22.3` through the shared `base` profile
- Local and CI Node version: `.nvmrc`; match the EAS `base` profile when updating.
- EAS CLI: exact version in `eas.json`; `npm run eas -- <command>` and CI use it.
- Version/build sources: `app.json`, `ios/PocketCart/Info.plist`, and
  `android/app/build.gradle`. Read these before each release rather than copying
  a build number from documentation.
- EAS uses local version sources. `production` auto-increments build numbers;
  `production-local` preserves them for local retries.
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

The local gate checks source/configuration and builds the web bundle. It does
not prove the following external checks; verify them separately before release:

Release checklist:

- TypeScript compile succeeds.
- Test suite succeeds.
- Web export succeeds for hosted legal pages.
- `/privacy`, `/terms`, `/support`, and `/delete-account` are reachable in production.
- Supabase Auth redirect URLs include `pocketcart://auth/callback`.
- Native app handles `pocketcart://auth/callback` email verification links and
  stores the Supabase session.
- Supabase Edge Functions `delete-account`, `delete-account-request`,
  `back-office-flyer`, `food-scan`, `receipt-scan`, `billing-status`,
  `watchlist-access`, `admin-flyer-notification`, `send-sale-alert-push`, and
  `sync-sale-alerts` are deployed for the enabled features.
- `database/schema.sql` includes the required profile, watchlist, product price,
  sale alert, push token, storage, and account deletion request schema.
- Supabase automatically provides `SUPABASE_SERVICE_ROLE_KEY` to Edge Functions;
  do not add or duplicate it as a custom secret.
- Supabase secret `PUSH_FUNCTION_SECRET` is set for sale alert push functions.
- Supabase backend is live and reachable during review.

Run this after logging into Expo and Supabase and setting release secrets:

```bash
npm run release:native:setup-guide
npm run release:native:doctor
```

The doctor checks repository release settings plus external readiness:

- Expo authentication through `EXPO_TOKEN`, GitHub secret, or EAS CLI login
- Supabase authentication through `SUPABASE_ACCESS_TOKEN`, GitHub secret, or
  CLI login
- GitHub repository secrets are present, verified by `gh secret list`
- `SUPABASE_PROJECT_ID` for CI function deploys
- Android Google Maps API key in the EAS `production` environment
- `PUSH_FUNCTION_SECRET` for authenticated sale-alert sync calls
- Production EAS public client env:
  `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, and
  `EXPO_PUBLIC_AUTH_REDIRECT_URL`

## GitHub Actions Release Automation

The repository includes these release and verification workflows:

- `Mobile Release Check`: runs `npm run release:native:check` and
  `npm run audit:ci` on PRs and `main`. The policy in
  `scripts/check-npm-audit.mjs` rejects all high/critical findings, including
  development dependencies, without advisory exceptions. It also verifies the
  maintained security forks and Metro compatibility patch. Lower-severity
  findings should still be reviewed in the full audit output.
- `EAS Native Build`: manually starts iOS, Android, or all-platform EAS builds.
  It runs `npm run release:native:check` and `npm run audit:ci` first and waits for native artifact
  completion. Production builds fail before starting if required EAS production
  environment variables are missing. Android Maps and Firebase variables are
  checked only when the requested artifact includes Android, so they do not
  block an iOS-only build.
- `EAS Store Submit`: manually submits an explicitly reviewed EAS build UUID
  after store records and credentials are ready. It verifies the live legal,
  support, account deletion URLs, and shared EAS production environment before
  submission. It also runs the full release checks and audit. The Android Maps key
  is required only for Android submission. Supply the required `build_id` input.
- `Supabase Backend Release`: one manual path for read-only plans, explicitly selected
  SQL changes, reviewed existing-history registration, and all or selected functions.
  It runs local checks and dependency audit before deployment and supports optional
  disposable-account smoke tests. See [backend deployment](backend-deployment.md).
- `Sale Alert Sync`: runs every six hours and can also be started manually to
  create and send eligible watchlist price alerts.
- `Live User Flow E2E`: manually creates a disposable confirmed user and verifies
  authentication, profile, live catalog, watchlist, alerts and account deletion.

Required GitHub repository secrets:

- `EXPO_TOKEN`: Expo token used by the EAS build workflow.
- `SUPABASE_ACCESS_TOKEN`: Supabase access token used by function deployment.
- `SUPABASE_PROJECT_ID`: Supabase project reference.
- `SUPABASE_SERVICE_ROLE_KEY`: used only by the manual disposable-user E2E
  workflow; Supabase still injects its own copy into Edge Functions.
- `PUSH_FUNCTION_SECRET`: shared secret used to trigger sale alert push sync.

Set and verify them with:

```bash
gh secret set EXPO_TOKEN
gh secret set SUPABASE_ACCESS_TOKEN
gh secret set SUPABASE_PROJECT_ID
gh secret set SUPABASE_SERVICE_ROLE_KEY
gh secret set PUSH_FUNCTION_SECRET
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

`POCKETCART_GOOGLE_MAPS_ANDROID_API_KEY` and `GOOGLE_SERVICES_JSON` are
Android-only build requirements. The full `release:native:doctor` command still
checks both platforms, while the EAS build and submit workflows scope these
requirements to the selected platform.

Restrict the Android maps key to package `com.pocketcart.app` and the release
upload certificate SHA-1 before store submission.

The `preview` profile also uses these production client variables but produces
internally distributed test artifacts (iOS ad hoc build and Android APK):

```bash
npm run eas -- build --platform ios --profile preview
npm run eas -- build --platform android --profile preview
```

The iOS `preview` profile installs on registered physical devices and therefore
requires Apple Developer login plus an Ad Hoc provisioning profile. For the
currently booted iOS simulator, create a standalone internal test artifact
without Apple signing:

```bash
npm run eas -- build --platform ios --profile preview-simulator
```

## Local iOS build

The native app uses a single `UIWindowScene` through `SceneDelegate` in
`ios/PocketCart/AppDelegate.swift`. Xcode 27 builds require this lifecycle on
iOS 27. Keep the scene manifest in `app.json` and `Info.plist` synchronized.
On the current Expo SDK 55, the adapter forwards scene activity and warm links
to `ExpoAppDelegate` and supplies cold-start links to React Native's launch
options. When upgrading to Expo's built-in scene support, replace this adapter
as a unit rather than forwarding the same callbacks twice. Verify cold launch,
foreground return, cold/warm links and sign-in on a physical device after changes.

For a local build, use a Mac with Xcode, CocoaPods, Fastlane, and access to the
production signing credentials. This uses local compilation rather than the EAS
cloud build queue; it still requires Expo/Apple authentication and network access.

1. Run the release checks above.
2. For a new upload, increment `expo.ios.buildNumber` in `app.json` and
   `CFBundleVersion` in `ios/PocketCart/Info.plist` together. Keep the same number
   when retrying a failed local build that was not uploaded.
3. Supply the production environment locally, including any secret EAS values
   unavailable to local builds. Keep secret values and files out of Git.
4. Build and submit the exact artifact:

```bash
npm run build:ios:local -- --output /tmp/pocketcart.ipa
npm run submit:ios -- --path /tmp/pocketcart.ipa
```

`production-local` extends `production` with `autoIncrement: false`. The
`npm run submit:ios -- --id <REVIEWED_BUILD_UUID>` and the `EAS Store Submit`
workflow use an explicit cloud artifact. For a locally built IPA, use the `--path`
command above. Submission wrappers reject `--latest` and missing/ambiguous targets.

Verify upload, Apple processing, TestFlight group assignment, and tester notes
separately. Successful compilation or upload alone does not make a beta available.

### Connected physical-device QA

For a paired iPhone with Developer Mode enabled, Xcode can build and install a
development-signed Release app without an EAS internal-distribution profile.
Authenticate the existing Apple account in Xcode Settings > Accounts first.
Use the local environment intended for the test, run the release gate, and keep
the version sources synchronized. Replace `DEVICE_ID` with the connected device
identifier; never store a personal device identifier in this guide.

```bash
xcrun devicectl list devices
xcodebuild -workspace ios/PocketCart.xcworkspace -scheme PocketCart \
  -configuration Release -destination 'id=DEVICE_ID' \
  -derivedDataPath /tmp/pocketcart-physical-qa-build -jobs 4 \
  -allowProvisioningUpdates -allowProvisioningDeviceRegistration build
codesign --verify --deep --strict \
  /tmp/pocketcart-physical-qa-build/Build/Products/Release-iphoneos/PocketCart.app
xcrun devicectl device install app --device DEVICE_ID \
  /tmp/pocketcart-physical-qa-build/Build/Products/Release-iphoneos/PocketCart.app
xcrun devicectl device info apps --device DEVICE_ID
```

Install as an update to preserve existing app data; do not uninstall to reset
permissions. Unlock the phone for Device Hub screen sharing. Record the observed
device/OS, installed version, source and compiled-bundle hashes, tested flows and
untested cases in the [physical QA ledger](../store-assets/app-review/physical-device-qa.md).
Development signing and physical QA do not verify a store-signed artifact,
TestFlight processing, or the selected App Store submission.

Keep a small simulator set: a current Pro for development and Pro Max for large
screen layouts/screenshots. Add a previous supported OS only when verifying
compatibility. Use `xcrun simctl list devices` and `xcrun simctl runtime list`
before cleanup; delete explicitly selected, shut-down simulators rather than
`all`. Simulator deletion removes its installed apps/test data and affects every
project using that simulator. Unused runtime removal should follow a
`xcrun simctl runtime delete <RUNTIME_ID> --dry-run`; Xcode Components can
download a runtime again when needed. Physical devices are separate and are not
simulator cleanup targets. Use one active physical screen-control tool at a time.

## EAS cloud build

Initialize EAS once per Expo account/project if it has not been initialized:

```bash
npm run eas -- login
npm run eas -- init
```

`eas init` or project linking writes `expo.extra.eas.projectId` to `app.json`.
Keep that value committed so local CLI builds and GitHub Actions target the same
Expo project.

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
npm run eas -- env:set production --name EXPO_PUBLIC_SUPABASE_URL --visibility plaintext
npm run eas -- env:set production --name EXPO_PUBLIC_SUPABASE_ANON_KEY --visibility sensitive
npm run eas -- env:set production --name EXPO_PUBLIC_AUTH_REDIRECT_URL --visibility plaintext
npm run eas -- env:set production --name EXPO_PUBLIC_SUPABASE_PRODUCT_IMAGE_BUCKET --visibility plaintext
npm run eas -- env:set production --name POCKETCART_GOOGLE_MAPS_ANDROID_API_KEY --visibility sensitive
npm run eas -- env:set --name GOOGLE_SERVICES_JSON --value ./google-services.json --type file --visibility secret --environment development --environment preview --environment production --non-interactive
```

`google-services.json` and `android/app/google-services.json` stay out of Git and
the EAS upload archive. `app.config.js` uses the EAS `GOOGLE_SERVICES_JSON`
secret-file path during remote builds and falls back to the ignored root file
for local native builds. Because this repository commits its native `android/`
project, the `eas-build-post-install` hook copies the EAS file into
`android/app/google-services.json` after dependency installation and before
Gradle runs.

The setup guide prints the same commands for missing values:

```bash
npm run release:native:setup-guide
```

Submit after store records and credentials are ready:

```bash
npm run submit:ios -- --id <REVIEWED_IOS_BUILD_UUID>
npm run submit:android -- --id <REVIEWED_ANDROID_BUILD_UUID>
```

Or use GitHub Actions > `EAS Store Submit` after the corresponding EAS build
has completed and store credentials are configured.

Before the first store submission, configure EAS credentials interactively from
the account that owns the Expo project:

```bash
npm run eas -- credentials:configure-build --platform ios --profile production
npm run eas -- credentials:configure-build --platform android --profile production
npm run eas -- credentials --platform ios
npm run eas -- credentials --platform android
```

Use these menus to confirm:

- iOS distribution certificate and provisioning profile are available for
  `com.pocketcart.app`.
- iOS distribution certificate validation succeeds. If a non-interactive iOS
  build fails with
  `Distribution Certificate is not validated for non-interactive builds`, rerun
  the iOS `credentials:configure-build` command above and log in to the Apple
  account when prompted.
- App Store Connect access is available for the PocketCart app record.
- Android upload key is available through EAS credentials or the local
  `POCKETCART_UPLOAD_*` variables.
- The Firebase Android API key is restricted to `com.pocketcart.app` and the
  local debug plus EAS upload certificate SHA-1 fingerprints.
- After Google Play App Signing is enabled, add the Play Console app-signing
  certificate SHA-1 to the same Android API key before testing the Play-delivered
  build. Google Play re-signs the uploaded AAB, so the EAS upload fingerprint
  alone does not cover the installed store build.
- Google Play service account access is configured before using
  `eas submit --platform android`.

Keep App Store Connect API keys, Google service account JSON files, and
keystores out of git. Store them in Expo/EAS, Apple, Google, or CI secret
storage only.

## Required External Credentials

iOS:

- Active Apple Developer Program membership.
- App Store Connect app created for `com.pocketcart.app`.
- Distribution certificate and provisioning profile managed by EAS or Apple.
- App privacy questionnaire completed from the app's actual data practices.
- Review notes include a demo account or a fully usable demo path.
- Account deletion is available in the app from Account → Account actions → Delete Account.
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
available in Account. Account deletion is available in Account → Account actions → Delete Account and
at https://pocketcart.app/delete-account.
```

Required URLs:

- Support: `https://pocketcart.app/support`
- Marketing: `https://pocketcart.app`
- Privacy Policy: `https://pocketcart.app/privacy`
- Terms: `https://pocketcart.app/terms`
- Account deletion: `https://pocketcart.app/delete-account`

Canonical domains are configured in `wrangler.jsonc`. The older workers.dev
host remains a compatibility origin. Verify live HTTPS with the store-assets
live check; repository configuration alone does not prove DNS or deployment status.

## Supabase Functions

Review `database/schema.sql` and the applied migration history before deploying
functions. Do not replay the full schema against an existing production database:
select the required migrations and verify prerequisites and backups. The web
deletion request form writes to
`public.account_deletion_requests`.

For the account-deletion request migration included in this repository, run
GitHub Actions > `Supabase Backend Release` with the reviewed migration version
selected explicitly (see [backend deployment](backend-deployment.md)), then run `Live User Flow E2E` to
verify the live schema and both deletion endpoints.

Deploy account deletion functions before store review:

```bash
npm run backend:release -- deploy-functions --functions=delete-account,delete-account-request
```

Supabase injects its project URL, anon key, and service-role key into Edge
Functions automatically. The CLI rejects custom secret names that start with
`SUPABASE_`, so no separate service-role secret setup is required.

Provide `PUSH_FUNCTION_SECRET` through the environment or GitHub secrets, then
deploy sale alert push functions before relying on production notifications:

```bash
npm run backend:release -- deploy-functions --functions=send-sale-alert-push,sync-sale-alerts
```

The `Sale Alert Sync` GitHub Actions workflow calls the sync endpoint every six
hours. To run it immediately after a price import, start that workflow manually
or call the endpoint directly:

```bash
curl -X POST \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-sale-alerts \
  -H "x-push-secret: <long-random-secret>"
```

Use GitHub Actions > `Supabase Backend Release` with `deploy-functions` to deploy the functions after
setting the required repository secrets.

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
  preferences, personal/family Cart and Freezer inventory, and app preferences.
- Receipts: authenticated purchase records and private receipt photos, with
  optional photo extraction after confirmation. See `store-assets/app-privacy.md`
  and the [Receipts guide](receipts-implementation.md).
- Support/account deletion request data: account email, platform, request
  details, and technical request metadata submitted through `/support` or
  `/delete-account`.
- Location: optional, requested only when the user chooses location-based store
  discovery. Postal-code/manual discovery must remain available.
  iOS privacy manifest declares precise/coarse location for app functionality,
  not tracking.
- iOS required-reason APIs: privacy manifest declares file timestamp,
  UserDefaults, and system boot time access with approved reason codes.
- Product/search usage: used to provide product search and deal tracking.
- Data is encrypted in transit via HTTPS/TLS.
- Data is not sold.
- No third-party ad tracking is enabled in this release.

Store forms must match the production app exactly. If a new SDK, analytics
provider, push notification provider, or payment provider is added later,
revisit this section before shipping another build.

## Reviewer Pass Criteria

- App launches without a white screen on a clean install.
- Home, Cart, Freezer, and Account tabs are usable. Product detail,
  Notifications, and Account → Features → Receipts / Map / Scan also work.
- Sign up, sign in, and sign out work against production Supabase.
- Account deletion is visible under Account → Account actions → Delete Account.
- Signed-in account deletion removes the current Supabase Auth user.
- Web account deletion request form accepts an account email and creates an
  `account_deletion_requests` row.
- Location permission has a clear purpose string and can be skipped.
- In-app alert preferences are optional and the app remains usable if disabled.
- Android release artifact is not signed with the debug keystore.
- Store screenshots show real app screens, not web admin pages.
