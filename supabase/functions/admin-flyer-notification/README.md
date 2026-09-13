# Admin Flyer notifications

The web admin Notifications menu creates an English announcement, with a retailer and
Flyer start date. Test sends go only to the signed-in administrator. Full sends
create an inbox entry for every non-anonymous, non-deleted account, including users
without push permissions. Enabled registered devices are eligible for push delivery.

## Deployment

1. Apply `supabase/migrations/20260913230000_admin_flyer_notifications.sql` to the
   intended Supabase project through the normal migration process. It depends on
   the existing stores, sale_alerts, user_push_tokens, admin_audit_logs and is_admin.
2. Deploy `admin-flyer-notification` using the repository's `supabase/config.toml`.
   The endpoint validates the user JWT with Auth and then checks `is_admin`.
   Supabase supplies SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY.
3. Deploy the web build. Distribute the updated native app for notification taps
   and inbox entries to open the selected retailer's current deals. Existing app
   versions can show the English push and inbox text but lack the new navigation.
4. Log into a physical device with the same admin account, enable notifications,
   and use **Send test to my account**. Verify reception and retailer navigation.
   A real full broadcast must be initiated explicitly by the administrator after
   the corresponding deals have been published.

## Delivery semantics

- The database transaction creates the campaign, all inbox entries, recipient
  queue and audit log together. One full announcement per retailer/start date is
  enforced by a unique index, including across different branches of that retailer.
- Test campaigns have a `[Test]` title prefix and do not consume that issue's full
  announcement slot. Retain the original start date if continuing an existing send.
- The selector lists each active retailer once. Announcements have no branch ID.
  The recipient-only destination RPC resolves the retailer to its active branches
  so the app can show their deals together.
- Keep the admin page open during processing. Each server request claims at most
  ten recipients with `FOR UPDATE SKIP LOCKED`. Unclaimed recipients can be
  continued from history, even after a reload or interrupted connection.
- A claimed recipient is never automatically resent. Processing errors or a worker
  timeout may follow a push that Expo already accepted. History shows errors and
  processing counts; investigate those before any manual recovery. Do not reset
  claims blindly or change the start date to work around duplicate protection.
- Accepted counts are Expo acceptance, not confirmed device delivery. The existing
  push_delivery_tickets / sync-sale-alerts receipt pipeline records delivery
  receipts and disables invalid tokens. Users with no enabled devices still get
  their inbox entry. Enabled devices are checked again at processing time.
- This feature uses the existing device notification preference. It does not send
  email, web push, or push to anonymous/unregistered devices.

## Checks

`npm run release:native:check` includes endpoint tests with mocked Auth, database,
and delivery. These tests never send real pushes.

The database integration test uses an isolated PGlite PostgreSQL instance and
minimal prerequisite tables, rather than connecting to a Supabase project:

```sh
npm install --prefix /tmp/pocketcart-notification-test --no-package-lock --no-audit --no-fund @electric-sql/pglite
PGLITE_MODULE=/tmp/pocketcart-notification-test/node_modules/@electric-sql/pglite/dist/index.js node tests/integration/flyer-notifications.mjs
```

It checks authorization, recipient coverage, test isolation, atomic duplicate
prevention across branches, queue claims, send-history aggregation and RPC grants.
Production RLS/auth integration and physical-device delivery remain deployment
checks; passing local tests does not establish live delivery.
