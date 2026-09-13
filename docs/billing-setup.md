# Pocketcart billing setup

Implementation is staged with sales disabled. My Freezer storage and expiry reminders remain free and unlimited. Free accounts can monitor five products for sale alerts; Plus supports unlimited product alerts. The account menu provides Pocketcart Plus, restore, subscription management and status refresh.

## Approved initial plan

The user selected **USD $0.99 per month** on September 12, 2026. This is the intended US storefront price; it has **not yet been saved in App Store Connect or RevenueCat**.

- Plan: Pocketcart Plus Monthly, auto-renewing every one month (`P1M`), without an annual commitment.
- US storefront: USD 0.99 per month. Set this in App Store Connect; client code cannot set the charged price.
- Proposed new iOS product ID: `com.pocketcart.plus.monthly` (check for an existing equivalent product before creation).
- RevenueCat: attach the store product to entitlement `pocketcart_plus` and the current offering's monthly package (`$rc_monthly`).
- The app only offers and purchases one-month packages. It continues to display the store's localized price; no fallback price is fabricated when store configuration is missing.
- Other storefront prices must be reviewed in the store console. USD 0.99 does not mean CAD 0.99 or a fixed currency conversion.
- Confirmed benefit: unlimited sale-alert products (free plan: five). My Freezer storage and expiry reminders remain unlimited and free. Family sharing and reports are not included or implemented. Keep sales disabled until server rollout, store setup and sandbox checks are complete.

## Configuration before sandbox testing

1. Create a RevenueCat project with iOS app `com.pocketcart.app` (and an Android app when ready). Connect the store credentials in RevenueCat; never put store signing keys or secret RevenueCat keys in the app.
2. Use the exact RevenueCat entitlement identifier `pocketcart_plus`. Configure the approved monthly plan above and attach it to that entitlement and a current offering. The app uses that offering's one-month packages and the store's localized title, description, price and billing period. Complete actual paid benefit descriptions before release.
3. Configure RevenueCat restore behavior deliberately. Prefer **Keep with original App User ID** for this account-based implementation. Test restores with the same Pocketcart account and a different Pocketcart account before launch. An app account is a Supabase Auth user UUID; purchasing requires sign-in. Do not use emails as RevenueCat IDs.
4. Set public platform SDK keys in EAS: `EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_...` and/or `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_...`. Secret keys and RevenueCat Test Store keys are rejected by the client configuration gate.
5. Deploy `supabase functions deploy billing-status`. Set `REVENUECAT_SECRET_API_KEY` using Supabase secrets. `SUPABASE_URL` and `SUPABASE_ANON_KEY` are supplied by Supabase. Never prefix a secret with `EXPO_PUBLIC_`.
6. In a separate sandbox backend, set `REVENUECAT_ALLOW_SANDBOX=true` for TestFlight tests. The production default is false. This controls server entitlement access, not whether Apple charges a transaction. TestFlight uses store sandbox transactions.
7. Keep `EXPO_PUBLIC_PURCHASES_ENABLED=false` until products and actual benefits are ready. When deliberately testing configured sandbox products, set true **for that build**. This is a build-time flag, not an instant remote kill switch.
8. Rebuild the native app after installing the SDK/configuring public keys. `pod install` resolves iOS dependencies; Expo Go cannot verify native store purchases. Android needs its own Play setup and native build.

## Access and lifecycle

The UI clears state immediately on an account change, serializes SDK identity/purchase operations, refreshes on app activation and after purchase/restore/management, and prevents duplicate purchase taps. Store cancellation preserves access until the entitlement expires. Server verification failures do not grant Plus. Purchase restoration still works when new sales are disabled.

`billing-status` authenticates the bearer token through Supabase Auth, ignores client-supplied user IDs, and queries RevenueCat REST v1 with a server secret. It checks expiration, billing grace and sandbox policy. No writable `is_premium` profile field or localStorage entitlement flag is used. No subscription webhook/cache is required for this on-demand approach. The watchlist quota migration below is required.

**Future paid server features must perform this authenticated server-side entitlement check themselves on each protected request.** The client `billing.isPlus` value is for UI and cannot authorize server resources. The `watchlist-access` endpoint performs this server-side check for the unlimited-alert benefit. My Freezer has no subscription gate.

## Release gates still requiring external setup

- Apple Paid Apps Agreement, banking/tax setup, subscription products/localizations, actual paid benefit descriptions and review materials.
- RevenueCat project/store connection, correct offering and entitlement mapping; server deployment/secrets.
- Real-device sandbox checks: purchase, cancellation, pending payment, renewal, expiration, refund, restore after reinstall, account switch and wrong-account restore, offline failure, and Manage subscription return.
- Test current-product prices and intervals in relevant storefronts. No introductory discount or free trial is promised by the app; the store confirmation is authoritative.
- TestFlight validation is not production approval and does not charge testers. Activate production sales only after the paid functionality and review are complete.

Sources: https://www.revenuecat.com/docs/getting-started/installation/expo · https://www.revenuecat.com/docs/getting-started/displaying-products · https://www.revenuecat.com/docs/customers/identifying-customers · https://www.revenuecat.com/docs/getting-started/restoring-purchases · https://developer.apple.com/help/app-store-connect/configure-in-app-purchase-settings/overview-for-configuring-in-app-purchases

## Five-product free alert limit rollout

1. Deploy `watchlist-access` and the updated `sync-sale-alerts` and `send-sale-alert-push` functions with the same RevenueCat secret/sandbox policy as `billing-status`.
2. Apply `20260913010000_watchlist_plan_limit.sql` and release the updated app together. The migration retains older clients' direct insert/update access with a database trigger enforcing the free five-product cap. Paid additions use the service-only RPC. Reads/deletes remain available.
3. The service-only RPC locks per account while counting/saving. Clients cannot supply a trusted Plus flag or bypass the cap with parallel insert calls, including through the legacy table API. A duplicate product updates its existing slot.
4. Existing excess items are retained, not deleted. Free/downgraded users receive alerts for their oldest five products; other rows show Paused in Alerts. Removing an active item frees a slot (the next saved item becomes active). Restoring Plus resumes all saved items.
5. Background generation and direct push delivery verify eligible products independently. RevenueCat failures never enable extra slots; background delivery temporarily falls back to the free five. App verification failures show a retry error. Missing billing keys mean the free tier.
6. Verify a sixth free addition fails, existing-product edits work at five, concurrent additions cannot exceed five, removal frees a slot, Plus allows six or more, expiration returns to five, and Freezer can save more than five items with reminders unchanged.

Local SQL verification: `PGLITE_MODULE=/absolute/path/to/@electric-sql/pglite/dist/index.js node scripts/test-watchlist-plan-db.mjs`. No production migration or Edge Function deployment is implied by passing local tests.

Deployment workflow: `Alert and Billing Backend Release` applies only this release's schema changes, deploys all four affected functions, and tests the free quota and Freezer behavior using a disposable account that is deleted afterward. It does not enable paid sales or send push notifications.
