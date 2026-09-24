# Receipts implementation and release

> Maintained guide · checked against repository code on 2026-09-24.
> External account settings and deployed service status require separate verification.

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

## Backend requirements

Apply the prerequisite schema and the reviewed
`supabase/migrations/20260916010000_receipts.sql` migration, then deploy
`receipt-scan` and the receipt-aware `delete-account` function. The migration
provides owner RLS, the private photo bucket, and the scan quota RPC.
`receipt-scan` verifies the caller through Auth with gateway `verify_jwt=false`;
`delete-account` retains gateway JWT verification and its own Auth check.
`RECEIPT_SCAN_OPENAI_MODEL` defaults to `gpt-5-mini`.

Without the migration, account storage is unavailable and the UI reports it.
If extraction is unavailable, users can still enter receipts manually. Production
schema changes require their own reviewed deployment; local tests do not apply them.

Prior deployment evidence is in the [September 16 release record](archive/2026-09-16-receipts-release.md).
For build and submission steps, use the [mobile release guide](mobile-store-release.md).

## Validation

- `npm run verify` (typecheck, lint, complete test suite, web export).
- `PGLITE_MODULE=/path/to/@electric-sql/pglite/dist/index.js node tests/integration/receipts.mjs`
  uses an isolated PostgreSQL database; covers migration retries, owner isolation,
  storage policies, malformed item JSON, scan quota, stale edits, deletion and
  account cascade. It does not connect to production.
- Mocked endpoint tests cover authentication, invalid photos, quota, optional
  manual fallback, incomplete responses, and no user identifiers in OpenAI input.
- Run `node scripts/test-live-receipts.mjs` only with explicit production-test authorization and
  `SUPABASE_PROJECT_ID`, service-role/anon keys or the signed-in `SUPABASE_CLI`.
  Credentials stay in process memory and are not logged.
- Device release smoke still requires a real receipt: photograph, read, correct,
  save; verify the photo and item totals from a second device; edit and delete;
  confirm account deletion cleans up photos. Simulator cannot prove real capture.

## Technical references

- [OpenAI image inputs](https://developers.openai.com/api/docs/guides/images-vision)
- [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [Supabase Storage access policies](https://supabase.com/docs/guides/storage/security/access-control)
