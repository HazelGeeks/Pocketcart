# Receipts implementation and release

The native bottom bar is Home · Cart · Freezer · Receipts · Account. Food Scan is
available in Account → Features alongside Map and returns to Account on Back.

## Behavior

- Personal, authenticated receipts, synchronized when opening the screen, returning
  to the app, or refreshing. No family sharing or offline save is implied.
- Camera photo (existing expo-camera module), optional OpenAI extraction with an
  explicit confirmation, and manual entry. Review is required before saving.
- Store, purchase date, currency, item name/size, fractional quantity or weight,
  optional unit price, line total, tax, extra discount, and final amount paid.
- Daily/monthly calendar periods; weeks run Monday–Sunday. Purchase date uses a
  date-only value and the device's local calendar, unaffected by UTC/DST shifts.
- Totals use final amount paid. CAD/USD/EUR/GBP/AUD stay separate; no conversion.
  Refunds/negative totals are not supported in this first version.
- Detail/edit/delete, period navigation, store/item search, possible duplicate
  warning, and optimistic concurrency checks on edits/deletion.
- An ID is allocated per draft; a dropped save response can be retried without a
  second purchase. Uploaded photos are immutable and private, with short-lived
  view URLs. Failed draft uploads can remain private until account deletion.
- Deletion first records a tombstone; storage cleanup is retried on subsequent
  receipt loads. Account deletion removes all receipt objects, including abandoned
  uploads, through the Storage API before deleting the auth user.
- Server-authenticated photo extraction with an atomic 30-attempt/day/account
  quota (UTC database date). Missing values remain blank; the user confirms them.
  `OPENAI_API_KEY` stays in Edge Function secrets. No receipt content is logged.

## Server release (applied September 16, 2026 UTC)

After explicit user approval, applied only
`supabase/migrations/20260916010000_receipts.sql` to Pocketcart project
`jmxbvqrvxshlybeomagw`. Migration `20260916010000` was recorded in
`supabase_migrations.schema_migrations` in the same transaction. It created
`receipts`, `receipt_scan_usage`, owner RLS, the atomic scan quota RPC and the
private `receipts` bucket (JPEG/PNG, 6 MB max). Other pending migrations were not
applied. The file is transaction-wrapped and tested for reapplication.

Verified live: RLS enabled on both tables, no anonymous receipt read or scan RPC,
no direct authenticated usage-table access, four receipt policies, three photo
policies, private bucket and 6 MB limit. Before application, the receipt tables and
bucket did not exist; existing product-image policies were limited to that bucket.

Deployed `receipt-scan` **v1 ACTIVE** and `delete-account` **v7 ACTIVE**. The former
verifies the caller through Auth (gateway `verify_jwt=false`); account deletion
retains gateway JWT verification plus its existing Auth check. Existing production
`OPENAI_API_KEY` was reused without changing secrets. Optional
`RECEIPT_SCAN_OPENAI_MODEL` defaults to `gpt-5-mini`.

The previous delete-account v6 source was downloaded and compared before deploy;
only receipt-photo cleanup changed, and Apple revocation code was identical.
The base source commit is `af0c48ab50d4a6ae6a840d82818c39e750d46d6d`.
The deployed migration SHA-256 is
`d628beb3de4e4e509c74d968f234b2e17ffabc86609451387c2886c431742224`.
The app can enter receipts manually if photo reading is temporarily unavailable.
Without the migration, account storage is unavailable and the UI says so.

Published the updated privacy page to https://pocketcart.app/privacy in Cloudflare
Worker version `3e4ce690-1d37-4e86-a265-a19b86ab3cdd`.
Updated and verified App Store Connect Photos or Videos from not-linked to
**linked to identity**, for App Functionality without tracking. The user restored
the expired web login before publication. See `store-assets/app-privacy.md`.

## Native release tracking

- Feature source: `bd30615d5e673cfed7e7cd3972710963f6f4dba1`, pushed to `main`.
- Feature CI: [Mobile Release Check 35066304485](https://github.com/HazelGeeks/Pocketcart/actions/runs/35066304485), passed.
- iOS version: **1.0.0 (12)**. EAS increments the build number in `app.json` and
  `ios/PocketCart/Info.plist`; these version changes are synchronized separately.
- [EAS production build](https://expo.dev/accounts/w_sungjun/projects/pocketcart/builds/4cf4f1b7-46dc-4193-9d05-bf1c5fd7c7e6).
- Build and [submission 26a6ff4e](https://expo.dev/accounts/w_sungjun/projects/pocketcart/submissions/26a6ff4e-5d29-4f01-ade8-bafb09b59c26)
  both finished successfully. Apple reported **VALID / IN_BETA_TESTING** for build
  12, uploaded September 16, 2026 at 00:10 PDT. External beta review and public
  App Store release were not performed.
- [App Store Connect TestFlight](https://appstoreconnect.apple.com/apps/6809854257/testflight/ios).
  Build completion, submission and Apple processing are separate statuses; consult
  these services for the current state.
- Camera permission copy in both app config and the native Info.plist includes
  photographing receipts.

## Validation

- `npm run verify` (typecheck, lint, complete test suite, web export).
- `PGLITE_MODULE=/path/to/@electric-sql/pglite/dist/index.js node tests/integration/receipts.mjs`
  uses an isolated PostgreSQL database; covers migration retries, owner isolation,
  storage policies, malformed item JSON, scan quota, stale edits, deletion and
  account cascade. It does not connect to production.
- Mocked endpoint tests cover authentication, invalid photos, quota, optional
  manual fallback, incomplete responses, and no user identifiers in OpenAI input.
- `scripts/test-live-receipts.mjs` passed against the deployed backend using two
  disposable accounts and two independent sessions for the owner. Verified photo
  upload/view, itemized storage, cross-session reads/edits, duplicate-ID rejection,
  outsider read/write/photo isolation, stale-write rejection, daily quota and
  receipt/account cleanup, including abandoned draft photos.
- A synthetic receipt sent through the live function and OpenAI returned two
  correct items, date, CAD currency, tax 0.65 and final total 13.63. No real user
  receipt was sent. All disposable accounts, rows and photos were removed.
- Re-run the live smoke only with explicit production-test authorization and
  `SUPABASE_PROJECT_ID`, service-role/anon keys or the signed-in `SUPABASE_CLI`.
  Credentials stay in process memory and are not logged.
- Device release smoke still requires a real receipt: photograph, read, correct,
  save; verify the photo and item totals from a second device; edit and delete;
  confirm account deletion cleans up photos. Simulator cannot prove real capture.

## Technical references

- [OpenAI image inputs](https://developers.openai.com/api/docs/guides/images-vision)
- [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [Supabase Storage access policies](https://supabase.com/docs/guides/storage/security/access-control)

Local verification on September 16, 2026 (UTC): 417/417 tests passed, typecheck and
lint passed, web export and iOS Hermes bundle export passed, isolated receipt DB
tests passed, and `git diff --check` passed. Native visual verification stopped
because the Mac was locked. Production migration, function deployment and backend
smoke checks are now complete as recorded above. Native build and TestFlight
provenance are tracked separately in the release links above.
