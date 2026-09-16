# iOS App Privacy disclosure

Reviewed against the production 1.0.0 (12) code on September 16, 2026 (UTC).
The initial answers were published after the owner's explicit confirmation of
Apple's accuracy and compliance declaration. The Receipts photo-linkage update
was published and verified in App Store Connect on September 16, 2026 (UTC).

| Data type | Purpose | Linked to identity | Tracking |
| --- | --- | --- | --- |
| Name | App Functionality | Yes | No |
| Email Address | App Functionality | Yes | No |
| Photos or Videos | App Functionality | Yes | No |
| Customer Support | App Functionality | Yes | No |
| Other User Content | App Functionality, Product Personalization | Yes | No |
| User ID | App Functionality | Yes | No |
| Device ID | App Functionality | Yes | No |
| Purchase History | App Functionality | Yes | No |
| Other Diagnostic Data | App Functionality | Yes | No |

## Implementation evidence

- Account name, email and Supabase user ID: `src/services/userProfile.ts`.
- Saved cart, purchased status, food inventory, watchlist and optional preferences:
  `src/services/shoppingList.ts`, `src/services/freezerStorage.ts`,
  `src/services/profilePreferences.ts`. Purchase History refers to shopping records
  and purchase tendencies, not collection of payment card details.
- Favourite stores influence catalog results and map filters:
  `src/hooks/useNativeCatalog.ts`, `src/hooks/useNativeStoreMap.ts`.
- Optional Food Scan images: `src/services/foodScan.ts` and
  `supabase/functions/food-scan/index.ts`. The request uses the public anonymous
  credential and sends image, barcode, MIME type and scan mode. It does not send
  the account ID or user session. The image is sent to OpenAI when configured;
  provider retention means it is included in this disclosure.
- Push token/platform and error diagnostics are linked through `user_id` in
  `user_push_tokens`: `src/services/pushNotifications.ts` and
  `supabase/functions/_shared/pushDelivery.ts`.
- Native GPS coordinates remain on device; geocoding uses the platform service.
  See `src/hooks/useNativeOnboarding.ts` and `src/services/mapLocationSearch.ts`.
- Google Analytics is web-only: `src/hooks/useAnalytics.ts`. No advertising
  tracking, IDFA collection or data-broker sharing was found in the native flow.
- RevenueCat purchases are disabled in the current production environment.
  Reassess the disclosure before enabling purchases or introducing telemetry.

Privacy policy: https://pocketcart.app/privacy

Privacy choices / deletion: https://pocketcart.app/delete-account

Reference: https://developer.apple.com/app-store/app-privacy-details/

## Receipts release delta — published September 16, 2026

The Receipts feature stores account-linked receipt photos and itemized purchases.
Updated **Photos or Videos → Linked to identity → Yes** in App Store Connect
(App Functionality; no tracking). Purchase History remains linked to identity for
App Functionality. Verified the published timestamp and the Photos or Videos
section showing both App Functionality and linkage to the user's identity.

Evidence: `src/services/receipts.ts`, `supabase/migrations/20260916010000_receipts.sql`,
`supabase/functions/receipt-scan/index.ts`. Photo reading is optional, explicitly
confirmed, and sent to OpenAI with `store: false`; that flag is not a zero-retention
claim. Account deletion removes Storage objects before deleting the user.
