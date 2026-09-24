# Documentation

Maintained guides were checked against repository code on **2026-09-24**.
This review did not recheck production data, external credentials, store console
settings, or live deployments.

## Maintained guides

| Guide | Purpose | Primary source |
| --- | --- | --- |
| [Mobile store release](mobile-store-release.md) | Local/cloud builds, credentials, submission, release checks | `package.json`, `eas.json`, `.github/workflows/` |
| [Family sharing](family-sharing.md) | Invitations, shared Cart/Freezer, synchronization and backend rollout | `src/contexts/FamilyContext.tsx`, `src/hooks/useFamilyCart.ts` |
| [Billing setup](billing-setup.md) | Monthly Plus, five-product free alert limit, server verification | `src/services/billingClient.ts`, `supabase/functions/watchlist-access/` |
| [Social authentication](social-auth-setup.md) | Apple/Google sign-in and account deletion | `src/services/nativeSocialAuth.ts`, `supabase/functions/delete-account/` |
| [Receipts](receipts-implementation.md) | Private account records/photos, extraction and validation | `src/services/receipts.ts`, `supabase/functions/receipt-scan/` |

For development commands and current app structure, start with the
[project README](../README.md). Store submission copy and privacy answers live in
[`store-assets`](../store-assets/README.md). Database changes live in
`supabase/migrations/`; documentation is not proof that a migration is deployed.

## Historical records

These preserve observations and verification from a specific date. Old test
counts, build numbers, navigation labels, source line numbers, and service states
are historical evidence, not current operating instructions.

- [2026-09-24 lint cleanup](archive/2026-09-24-lint-cleanup.md)
- [2026-09-24 final code review](archive/2026-09-24-code-review.md)
- [2026-09-24 code cleanup](archive/2026-09-24-code-cleanup.md)
- [2026-09-16 Receipts release](archive/2026-09-16-receipts-release.md)
- [2026-09-16 domain setup](archive/2026-09-16-domain-setup.md)
- [2026-09-16 App Store setup](archive/2026-09-16-store-setup.md)
- [2026-09-12 UI/UX review](archive/2026-09-12-ui-ux-review.md)
- [2026-09-08 production preflight](archive/2026-09-08-production-preflight.md)

## Naming and maintenance

- Maintained guides: lowercase `kebab-case.md`, without dates in filenames.
- Historical records: `archive/YYYY-MM-DD-topic.md`, using the original record date.
- `README.md` is the conventional exception for a directory index.
- Use one descriptive H1, short sections, and relative Markdown links.
- After renaming a document, update inbound links and any script references.
- Record code verification dates separately from live deployment checks.
- Read changing versions, build numbers, and policy exceptions from their source
  files instead of duplicating them in maintained instructions.
