# Documentation

Start with the [code map](code-map.md) to find feature owners and the
[documentation rules](documentation-rules.md) before adding or reorganizing files.
Each guide records its own code verification date. Code verification does not
confirm current production data, credentials, store settings or deployment state.

## Maintained guides

| Guide | Purpose | Primary source |
| --- | --- | --- |
| [Code map](code-map.md) | Feature entrypoints, hooks, services and directory responsibilities | `App.tsx`, `App.native.tsx`, `src/` |
| [Web rendering](web-rendering.md) | Static public pages, server-rendered blog, localized SEO, performance and accessibility checks | `src/web/`, `scripts/build-web-server.mjs`, `wrangler.jsonc` |
| [Documentation rules](documentation-rules.md) | Placement, filenames, verification evidence and safe cleanup | This documentation directory |
| [Operations guide](operations-guide.md) | Backend/store responsibilities, deployment gaps and maintenance priorities | `supabase/`, `store-assets/`, `.github/workflows/` |
| [Backend deployment](backend-deployment.md) | Unified Supabase release, explicit SQL selection and migration history adoption | `supabase/release.json`, `scripts/supabase-release.mjs` |
| [Mobile store release](mobile-store-release.md) | Local/cloud builds, credentials, submission, release checks | `package.json`, `eas.json`, `.github/workflows/` |
| [App Review readiness](app-review-readiness.md) | Camera permission and donation rejection fixes, deployment evidence and resubmission checks | Permission screens, SupportScreen, store-assets |
| [Family sharing](family-sharing.md) | Invitations, shared Cart/Freezer, synchronization and backend rollout | `src/contexts/FamilyContext.tsx`, `src/hooks/useFamilyCart.ts` |
| [Billing setup](billing-setup.md) | Free product alerts, backend rollout, existing subscription management | `src/services/billingClient.ts`, `supabase/functions/watchlist-access/` |
| [Social authentication](social-auth-setup.md) | Apple/Google sign-in and account deletion | `src/services/nativeSocialAuth.ts`, `supabase/functions/delete-account/` |
| [Receipts](receipts-implementation.md) | Private account records/photos, extraction and validation | `src/services/receipts.ts`, `supabase/functions/receipt-scan/` |
| [Dependency security](dependency-security.md) | Patched dependency versions, reproducible backports and audit policy | `scripts/apply-security-patches.mjs`, `scripts/check-npm-audit.mjs` |

For development commands and current app structure, start with the
[project README](../README.md). Store submission copy and privacy answers live in
[`store-assets`](../store-assets/README.md). Database changes live in
`supabase/migrations/`; documentation is not proof that a migration is deployed.

## Historical records

The [archive index](archive/README.md) lists dated observations, release evidence
and superseded plans. Old test counts, build numbers and service states are
historical evidence, not current operating instructions.

## Naming and maintenance

Follow [documentation-rules.md](documentation-rules.md). Keep this index focused
on current guides and the archive index focused on historical records.
[AGENTS.md](AGENTS.md) directs agents working in this directory to the same rules.
