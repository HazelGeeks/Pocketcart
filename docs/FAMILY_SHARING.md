# Family sharing

Settings → Family creates a family or accepts an invitation. Cart and My Freezer switch to a separate family inventory. Alerts, notification preferences and subscription entitlements remain personal. This feature adds no paid gate or Freezer item quota.

An owner creates a single-use, 7-day link and shares it through the system share sheet. Generating another link cancels the old link. The HTTPS landing page opens `pocketcart://family?invite=...`; there is a paste-link fallback in Settings for installations without deferred deep linking. Invites stay in AsyncStorage through signup, email verification and login. The recipient explicitly chooses Join invited family after authentication. Links are bearer invitations: anyone possessing an unused link may join. Only token hashes are stored in the database; the HTTPS page carries tokens in its fragment and has no analytics.

Personal Cart and food are preserved when creating/joining. Cart offers “Copy my personal Cart”; Settings offers “Move my personal food to family” with an explicit confirmation. All members can modify family inventory. Only the owner creates/revokes invites or removes members. Ownership transfers when the owner leaves/deletes their account. Shared food is reassigned to a remaining member so an account deletion does not cascade-delete it. The last member's departure deletes the family inventory, as explained in the confirmation.

## Synchronization

The foreground app checks the family Cart every 5 seconds, the open Freezer every 10 seconds, and membership every 15 seconds, plus on resume. Cart uses a revision-checked transaction, rebasing a queued mutation on concurrent changes; it does not replace other members' edits with a stale device snapshot. Custom items, purchase status and Freezer transfer markers are shared. Network errors are shown rather than silently accepting offline shared writes. Personal Cart storage remains independent.

Freezer edits use the version read when the editor opened. A conflicting edit requires refresh; server timestamps prevent dependence on device clocks. RLS enforces personal/family scope on every request. Local expiry reminders are reconciled on app resume or family change; this is not a server delivery guarantee while a device is offline.

## Release order and verification

1. Run the existing prerequisite migrations (profiles/My Freezer), then apply **only** `supabase/migrations/20260914010000_family_sharing.sql`. Do not replay unrelated historical migrations.
2. Deploy the web export containing `family.html` to the existing PocketCart web origin.
3. Build and submit the updated native app. Its `pocketcart` URL scheme already exists. This implementation does not add Universal Links or automatic App Store deferred deep links: after installation, reopen the invite or paste it in Settings.
4. Test two separate accounts/devices: create family, signup from invite, accept, edit Cart from both, add/edit/remove food, revoke/reuse/expire an invite, remove/leave, and re-enter the app. Verify the migration is deployed before native rollout: the app fails closed if membership cannot be resolved.

Local checks: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build:web`. Run the SQL integration suite with `PGLITE_MODULE=/absolute/path/to/@electric-sql/pglite/dist/index.js node scripts/test-family-sharing-db.mjs` using an installed PGlite runtime. It verifies real SQL/RLS, invitation lifecycle, stale Cart rejection, membership isolation, ownership transfer and shared data retention after account deletion. Unit tests cover rebase/connection failures, source selection/account isolation and transfer scope checks. Native live signup/join requires the deployed migration and two test accounts; local SQL tests do not prove production rollout.
