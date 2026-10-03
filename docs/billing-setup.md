# Product alerts and existing subscriptions

> Maintained guide · repository code checked on 2026-09-24.
> Local validation does not imply production deployment.

Product sale alerts are free, with no product-count limit or Plus requirement.
Cart is separate and permits adding up to ten different products. My Freezer
storage and expiry reminders remain free. Receipts is a preview in Account Features.

## Application behavior

The alert manager displays the active count without a five-product quota. All saved
alert records remain eligible for generation and delivery; RevenueCat availability
cannot pause product alerts. Authentication and account ownership checks remain.

The subscription screen does not offer new purchases. Existing customers can still
restore purchases, refresh status and open store subscription management. This code
change does not cancel or refund existing store subscriptions. Any future paid
benefits require a separate product decision and verified store configuration.

## Backend rollout

1. Apply `supabase/migrations/20260924010000_free_product_alerts.sql`. It removes the
   old quota trigger and replaces the service-only save RPC without deleting rows.
   Its legacy `p_plus` parameter is accepted for compatibility but no longer gates saves.
2. Deploy `watchlist-access`, `sync-sale-alerts` and `send-sale-alert-push` together.
   The shared eligibility helper now includes all saved products without billing calls.
3. Release the updated app. UI changes alone do not remove an old production DB quota.

The manual `Supabase Backend Release` workflow uses
`scripts/supabase-release.mjs`; select migration `20260924010000`, the affected
functions, and the `alerts` smoke test. Follow [backend deployment](backend-deployment.md)
to verify prerequisites and adopt existing migration history before applying SQL.
It must not replay the obsolete five-product migration as the final policy.
`billing-status` remains for managing existing subscriptions, not alert eligibility.

## Verification

`npm run release:native:check` covers the app and endpoint/unit tests. Run the
isolated DB check with `PGLITE_MODULE=/absolute/path/to/@electric-sql/pglite/dist/index.js
node scripts/test-watchlist-plan-db.mjs`. It verifies the legacy-to-free migration,
more than ten alerts, duplicate updates and service-only permissions.

`scripts/test-live-alert-plan.mjs` creates and deletes a disposable account; run only
as part of an authorized backend rollout. It does not send push notifications.

Previous subscription setup is retained in the
[historical paid-alert plan](archive/2026-09-24-paid-alert-plan.md).
