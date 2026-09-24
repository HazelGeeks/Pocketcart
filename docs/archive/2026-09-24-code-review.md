# Final code review — 2026-09-24

> Snapshot of the local working tree after source and documentation cleanup.
> No commit, push, deployment, or production data changes were performed.

## Assessment

The main responsibilities are separated into components, hooks, services, and
pure utilities. Components generally use PascalCase, hooks use `use` prefixes,
and platform variants retain Metro's `.native.tsx` naming. Existing source
directories use lower camel case; maintained docs use kebab case. These different
conventions serve different roles and do not require a repository-wide rename.

No case-insensitive path collisions were found in the 515 files scanned under
`src`, `docs`, `tests`, and `scripts` before this report was added. Every remaining
TypeScript source file under `src` was reachable in the combined web/native import
graph. Type checking and both platform exports passed after cleanup.

## Corrections made in this review

`useNativeCatalog` did not catch exceptions thrown by product/price services,
which could leave loading indicators active and produce an unhandled rejection.
It now displays failure feedback and clears loading state for the current request.
Changing products clears previous price data while the new request is pending.
Leaving product details invalidates the outstanding price response.

Four behavioral tests cover recovery after failure, account-switch races, price
failure after a successful detail load, and late responses after leaving details.
The navigation and catalog tests share a small hook scheduler instead of copying
the existing scheduler into another test harness.

## Verification

- `npm run release:native:check`: passed, including typecheck, lint, **424 tests**,
  web export, native configuration, and store asset checks.
- Catalog/navigation tests after formatting: **7 passed**.
- iOS Hermes export: passed. This is not a signed native binary build.
- `npm run audit:ci`: passed after network access was available; **one existing
  policy-allowed transitive build-tool finding** remains.
- `git diff --check`: passed.
- Store asset checks retain the existing release-screenshot warning.

## Remaining maintenance work and limits

The full source lint report contains **159 warnings and 16 informational
diagnostics**, despite zero lint errors. Examples include 84 explicit-`any`
diagnostics and 28 hook-dependency diagnostics. Some dependencies intentionally
trigger retries or reset state; changing them automatically could break behavior.
These require targeted review rather than bulk suppression or automatic fixes.

The largest logic modules remain `useAdminDashboardData.ts` (498 lines),
`useAdminStoreActions.ts` (487), and `userProfile.ts` (435). They are candidates for
future responsibility-based splitting, not evidence of a runtime failure by size
alone. Broad extraction was not mixed into this final regression fix.

No blocker remains in the executed checks. This is not a guarantee of zero bugs:
real-device interaction, signed native builds, external provider behavior, and
production database state were not revalidated in this review.
