# App Store setup — September 16, 2026 (UTC)

App: PocketCart: Grocery Savings — Apple ID `6809854257`.

## Saved in App Store Connect

- English introduction, promotional text, keywords, support and marketing URLs,
  copyright, subtitle and Shopping category. Source: `store-assets/metadata/en-US.json`.
- Free download with Canada as the base territory; Canada is the only available
  country. Automatic availability in future territories is off.
- Manual release after review approval; the version has not been submitted.
- Version 1.0 has TestFlight build 1.0.0 (10) attached and saved.
- Three real iPhone Release screenshots (1320 × 2868) are uploaded and rendered
  in the 6.9-inch slot: Discover, Product Details, and Stores. The 6.5-inch slot
  automatically uses the 6.9-inch set. Files: `store-assets/screenshots/ios-6.9/`.
- Age questionnaire: 13+ for Canada (12+ on operating systems before version 26).
  Food Scan has general nutrition guidance; cooking-wine references are infrequent.
- Third-party content rights: owner confirmed necessary usage rights and legal basis.
- Privacy policy and privacy-choice URLs, plus nine data categories and their
  purposes/identity/tracking answers, published after the owner's explicit approval.
  See `store-assets/app-privacy.md`.

## Authentication

- Supabase Apple provider enabled for native client ID `com.pocketcart.app`.
- Public auth settings confirmed both Apple and Google enabled.
- No Apple OAuth client secret is needed for native ID-token sign-in.
- Apple token revocation on account deletion is implemented with fresh native
  reauthorization. The owner approved issuance of a dedicated Sign in with Apple
  key restricted to the PocketCart App ID. All four server-only Supabase secrets
  were stored and verified by comparing their hashes; no private key is in source.
- The updated `delete-account` Edge Function is deployed. An unauthenticated
  production request returns HTTP 401. Mocked crypto, provider, deletion and native
  reauthorization tests passed as part of the 386-test release gate.
- A non-user token-exchange probe against Apple's official endpoint returned
  `invalid_grant` for the deliberately invalid authorization code, rather than
  `invalid_client`; this checks the client credential without deleting any account.
- Apple first sign-in, Hide My Email, session restoration, and deletion still need
  real-device validation.

## Remaining submission gates

- Reviewer sign-in credentials and review contact phone/email.
- Test the updated native binary, including real-device Apple revocation.
- In the iOS 26.5 simulator, the selected PriceSmart map marker appeared as an
  empty circle while the store list logo loaded. Check marker rendering on the
  physical device; the uploaded set uses the store list screenshot.
- Confirm the Canada storefront treatment of the external Ko-fi support link before
  review. The current link grants no digital benefits, but this does not establish
  App Review approval for the payment flow.
- Resolved after the initial audit: `pocketcart.app` and `www.pocketcart.app` now
  serve the live site over HTTPS. Store URLs and auth configuration use the new
  domain; see [domain setup](domain-setup-2026-09-16.md).

## Deployment evidence

- Source change `4a2d449846df1f055bfe84e4ab620274056ac3dc`; build-number sync
  `610bd591566bea9eacf3bd783c305d23708518af`. Both passed Mobile Release Check.
- EAS iOS production build `23d5b0f6-6c7d-40cd-a5f6-0916a83fec50` completed;
  submission `a49470c8-3e70-4006-8757-9f879c7929f8` completed.
- Apple processed build `72fb5a35-34b2-4b97-ac31-d3387f5d7793`, version 1.0.0 (10),
  and attached it to the existing internal group with one tester. Test instructions
  for Apple sign-in, cancellation, session restoration and deletion were saved.
- The deployed web JavaScript contains the updated privacy text and Ko-fi link;
  `/privacy` responds HTTP 200. The automated Cloudflare build produces a different
  bundle hash from the local environment, so content was verified in the active asset.
- `audit:ci` passed with the five documented policy-allowed transitive findings;
  this is not a claim of zero dependency vulnerabilities.
- Xcode 27 local Release simulator build succeeded. Device Hub captures were
  visually inspected, converted to JPEG without alpha, and uploaded. The app
  showed 335 currently priced groceries and 30 supported store locations. These
  are point-in-time catalog figures, not completeness guarantees.

## Operating capacity

Supabase Free-plan grace period ended September 9. Current Usage dashboard is
within included quotas: database 0.04/0.5 GB, egress 0.345/5 GB, storage 0.007/1 GB,
340/500,000 function invocations and 7/50,000 monthly active users. No plan change
or purchase was made. These figures are a point-in-time snapshot.
