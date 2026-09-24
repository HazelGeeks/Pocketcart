# Code cleanup — 2026-09-24

> Historical record. Statements, test counts, source line numbers, and external
> service status describe the recorded work, not the current deployment.
> See the [documentation index](../README.md) for maintained guides.

## Scope and evidence

Reviewed the tracked source import graph from both app entrypoints, package usage
in app/admin/build tooling, style references, and legacy data compatibility paths.
Metro platform variants were included when resolving imports. This was a static
cleanup review, not a claim that every runtime path was exercised.

Removed disconnected components: the old hero product preview, download badges
and their icons/placeholder store URLs, standalone freezer reminder settings, and
the former shopping recommendation panel and its plan details.

Removed utilities used only by tests: category-photo caching, shopping-list
grouping, async list result settlement, and shopping coverage presentation copy.
Removed their nine tests and obsolete test compilation entries. The active
shopping optimizer, cart persistence, account isolation, and request-race tests
remain.

Removed the obsolete preview/badge styles, 201 additional unreferenced style
declarations, and two resulting empty style modules. Reference checks found no
computed style-key access. All 564 retained declarations in the 23 edited style
modules were compared against HEAD and have identical values.

## Deliberately retained

- All package dependencies: they support current UI, web admin, OCR, Expo/Metro,
  native linking, testing, or release tooling. No dependency upgrade or lockfile
  change is part of this cleanup.
- Native/web entrypoints and platform-specific components.
- Existing shopping-list storage migration, watchlist fallback, freezer schema
  compatibility, and conservative legacy product matching.
- Database migrations and operational scripts, which are entrypoints outside
  the app import graph and cannot be judged unused from app imports alone.
- Separate recent-search and store-filter storage queues. One performs serialized
  read-modify-write operations; the other replaces a normalized selection.
  Combining them would add behavioral risk without simplifying their contracts.
- Search and filter retailer grouping: their current fallback naming and sorting
  behavior differs, so they were not silently unified during cleanup.

## Validation

- `npm run verify`: typecheck, lint, 420 tests, and web export passed.
- `npx expo export --platform ios`: iOS Hermes bundle export passed. This is not
  a signed native build or a real-device interaction test.
- Native release configuration and store asset checks passed. The existing
  release-device screenshot warning remains.
- No production data, app build number, or deployment configuration changed.
