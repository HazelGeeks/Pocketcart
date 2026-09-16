# App Store setup — September 16, 2026 (UTC)

App: PocketCart: Grocery Savings — Apple ID `6809854257`.

## Saved in App Store Connect

- English introduction, promotional text, keywords, support and marketing URLs,
  copyright, subtitle and Shopping category. Source: `store-assets/metadata/en-US.json`.
- Free download with Canada as the base territory; Canada is the only available
  country. Automatic availability in future territories is off.
- Manual release after review approval; the version has not been submitted.
- Version 1.0 has TestFlight build 1.0.0 (9) attached.
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
- Apple first sign-in, Hide My Email, session restoration, and deletion still need
  real-device validation.

## Remaining submission gates

- Real iPhone screenshots. The owner accepted the Xcode license; Xcode 27 uses
  Device Hub in place of Simulator. A local Release simulator build is in progress.
- Reviewer sign-in credentials and review contact phone/email.
- Build and test the updated native binary, including real-device Apple revocation.
- Confirm the Canada storefront treatment of the external Ko-fi support link before
  review. The current link grants no digital benefits, but this does not establish
  App Review approval for the payment flow.
- The custom domain `pocketcart.app` did not resolve during the release audit;
  the live workers.dev URLs are used in metadata.

## Operating capacity

Supabase Free-plan grace period ended September 9. Current Usage dashboard is
within included quotas: database 0.04/0.5 GB, egress 0.345/5 GB, storage 0.007/1 GB,
340/500,000 function invocations and 7/50,000 monthly active users. No plan change
or purchase was made. These figures are a point-in-time snapshot.
