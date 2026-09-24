# Lint cleanup — 2026-09-24

> Local source review following the final code review. Counts below apply to
> `npx biome lint src`, not external services or the entire tool/test directory.

**Final result: 0 errors, 0 warnings and 0 informational diagnostics in `src`.**
The passes below document how the remaining behavior-sensitive items were resolved.

## Initial pass

Source diagnostics decreased from **159 warnings / 16 informational diagnostics**
to **53 warnings / 0 informational diagnostics**, with zero errors. No lint rule
was disabled and no new suppression comments were added.

- Removed all 84 explicit-`any` diagnostics. Admin components now accept the actual
  shared style type, while table cells accept `StyleProp<ViewStyle>`. Style modules
  preserve their named properties instead of exposing an untyped dictionary.
- Browser APIs use DOM types; PDF/OCR integration uses library types. The PDF
  options retain their previous values, and rendering explicitly supplies canvas.
- Web-only CSS passes through a typed `webViewStyle` boundary: input is checked
  with `CSSProperties`, while the output adapts to native component style props.
  Runtime values and platform guards are unchanged.
- Corrected missing dependencies and object captures in catalog scrolling,
  billing, notification admin, map state, and SEO effects. Map dependencies still
  track coordinates rather than incidental store-object identity. SEO structured
  data still uses serialized value equality.
- Removed seven non-null assertions using guarded local values, and keyed price
  chart points by their record ID. Simplified redundant Boolean conversions,
  type-only imports, and CSV template construction.

## Warnings after the initial pass

| Category | Count | Reason retained |
| --- | ---: | --- |
| Hook dependencies | 16 | Explicit retry/reset/invalidation triggers, including account/family changes, pagination resets and image retries; removing these changes behavior |
| Non-null assertions | 16 | Existing lookup/validation invariants; replacing them with defaults or skipped rows would alter data handling and needs focused tests |
| Array-index keys | 3 | Calendar blanks and read-only rows that can contain duplicate names; changing keys requires a suitable identity contract |
| CSS selector specificity | 11 | Existing cascade/media-query order needs browser visual verification before reordering |
| CSS `!important` | 7 | Existing override behavior, including accessibility-related CSS, requires visual validation before removal |

## Verification

- `npm run release:native:check`: passed, including typecheck, lint errors,
  **424 tests**, web export, native configuration and store asset checks.
- Existing release-device screenshot warning remains.
- iOS Hermes export and `git diff --check`: passed. Signed native builds and
  real-device interaction were not repeated for this cleanup.
- No packages, native configuration, database schema, or production data changed.
- No commit, push or deployment was performed.

## Follow-up: remaining safe fixes

Source diagnostics decreased further from **53 to 20 warnings**, with **zero
errors and informational diagnostics**. No rules were disabled or suppressed.

- Removed the remaining 16 non-null assertions. Date normalization now produces
  validated non-null dates; missing lookup records produce explicit invariant
  errors instead of silently skipping records. Footer navigation checks routes,
  and push registration reports an unconfigured account service explicitly.
- Product deletion rows use product IDs; leading calendar blanks use weekday
  identities instead of positional keys.
- Lowered CSS element-reset specificity with `:where`, removing four unnecessary
  `!important` declarations while preserving component and mobile overrides.
  Moved heading accents and hover rules after component rules, resolving all 11
  descending-specificity warnings.

### Retained diagnostics

| Category | Count | Reason retained |
| --- | ---: | --- |
| Hook dependencies | 16 | Account/family changes, reset keys and explicit retry/invalidation triggers intentionally rerun effects or recreate callbacks |
| Array-index keys | 1 | Immutable receipt detail lines have no persistent line IDs and may repeat identical names; a schema or identity change is not justified for this display-only list |
| CSS `!important` | 3 | Reduced-motion overrides must take precedence over component transitions, animations and smooth scrolling |

### Follow-up verification

- `npm run release:native:check` passed, including **424 tests** and typecheck.
- After the final CSS edits, `npm run build:web` and iOS Hermes export passed.
- Browser checks confirmed unchanged sampled blog styles after rule reordering;
  Home's sampled styles matched except for its auto-centered container margin.
  At a 390 px viewport, primary/preview buttons retained their white text and
  intended font sizes/padding, with no horizontal page overflow.
- `git diff --check` passed. Existing release-device screenshot warning remains;
  signed builds and real-device interaction were not repeated.
- Changes remain local; no packages, native configuration, database schema or
  production data changed, and no commit, push or deployment was performed.

## Final pass: context ownership and explicit retries

The remaining 20 warnings were resolved without disabling rules or adding
suppression comments:

- `useScopedState` owns resettable values together with their account/filter/
  navigation context. Context changes reset values before children receive them;
  setters captured by a different context cannot overwrite the current state.
  Pagination, family forms, Cart transfer state and forward history use this
  shared behavior instead of effects with dependency-only reset triggers.
- Store and receipt-photo retry buttons invoke memoized loading functions.
  Request generations reject superseded responses and completions after cleanup.
- Notification requests explicitly track their owning account/tab. Freezer
  reminders subscribe to a memoized account/family context, preserving refreshes
  on family changes without resubscribing for identical context values.
- Bottom-bar and blog scroll resets track the context of their imperative state.
  The redundant freezer deletion dependency was removed because its existing
  scope already includes the family ID.
- Receipt display keys combine all line values with the occurrence number of an
  identical line. Duplicate names and duplicate lines remain visible; unrelated
  line reordering preserves identity. Stored receipt data is unchanged.
- CSS transitions are enabled only under `prefers-reduced-motion: no-preference`,
  removing the need for blanket `!important` overrides. No other marketing CSS
  animations or smooth-scroll declarations currently exist.

### Final verification

- Source lint: **0 errors / 0 warnings / 0 informational diagnostics**.
- Typecheck, full tests, web export, native config and store asset checks passed.
- Six additional behavioral tests cover context resets and stale setters, tab
  request cancellation, family reminder refresh/cleanup, store/photo retries and
  duplicate receipt identities. Existing navigation-history tests also pass.
- iOS Hermes export passed. Release-device screenshots remain an external release
  requirement; simulator/real-device interaction and signed builds were not
  repeated in this final pass.
- No lint configuration, packages, schema or production data changed. Work remains
  local; no commit, push or deployment was performed.

## Pre-push review

A return-to-context race was found in the new scoped-state helper: after moving
from A to B and back to A, an old setter from the first visit to A could match the
scope string again. Each context transition now increments a revision, so earlier
visits cannot write into a later visit. The scoped-state regression test exercises
this sequence. The full suite passes **430 tests**.

Maintained documentation links resolve locally. The release checks and source lint
pass; npm audit policy passes with one existing allowed transitive build-tool
finding. iOS export remains a bundle check, not a signed native release.
