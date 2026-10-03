# Source review — 2026-09-24

Historical record consolidating the former code-cleanup, code-review and
lint-cleanup reports from September 24. This preserves their final outcomes and
verification limits; intermediate counts are omitted to avoid conflicting status.
Original detailed reports remain in Git history. Use the [current documentation](../README.md)
for current behavior and commands.

## Cleanup and structure

The web/native import graph, dependencies, style references and legacy data paths
were reviewed. Retained TypeScript source files were reachable from the combined
entrypoints; platform variants were included. No case-insensitive path collisions
were found in the 515 files scanned across source, docs, tests and scripts.

Disconnected hero previews, download badges, standalone freezer settings and old
shopping recommendation panels were removed. Category-photo caching, shopping
grouping, async-list settlement and coverage-copy utilities used only by tests were
removed along with nine obsolete tests and compilation entries.

Obsolete preview/badge styles, 201 other unused declarations and two empty style
modules were removed. The 564 retained declarations across 23 changed style modules
were compared with the baseline and retained their values.

Dependencies, operational scripts and migrations were retained. Storage migration,
watchlist fallback, freezer schema compatibility and conservative product matching
were preserved. Recent-search/store-filter queues and retailer-grouping paths were
kept separate because their semantics differ.

## Behavior corrections

`useNativeCatalog` now catches product/price request failures, clears loading
state, discards old prices while loading another product and invalidates responses
after leaving details. Four tests cover failure recovery, account-switch races,
price failure after a successful load and late detail responses.

Source lint diagnostics were resolved without rule suppression: actual style/DOM/
PDF/OCR types replaced explicit `any`, guards replaced non-null assertions, and
CSS specificity/order was corrected. Reduced-motion behavior was preserved and
receipt line identities retain duplicate lines.

`useScopedState` owns values with their account/filter/navigation context. Each
context transition increments a revision so an old setter from an earlier visit
cannot write after an A → B → A transition. Loading retries, request generations,
notification ownership and family reminder subscriptions were made explicit.
Tests cover stale setters, tab cancellation, family cleanup, retries and receipt
identities. Catalog/navigation tests share a hook scheduler.

## Final evidence and limits

- Final source lint: zero errors, warnings and informational diagnostics.
- Latest recorded full suite in this review: 430 tests passed. Earlier partial
  phases reported 420/424 and are not separate current acceptance counts.
- Typecheck, web export, native configuration and store asset checks passed.
- iOS Hermes export passed; it was not a signed build or physical-device QA.
- Sampled browser styles and a 390 px layout were checked after CSS changes.
- The audit policy at the time allowed an existing transitive build-tool finding.
  For the current policy and forks, see [dependency security](../dependency-security.md).
- Large logic modules remained candidates for responsibility-based splitting,
  including admin dashboard/store actions and user-profile services.
- No production data/schema, app build number or deployment settings changed.
  No commit, push, deployment, signed build or repeat physical-device test was
  performed within this recorded review. Store screenshot requirements remained.
