# Store Screenshot Capture Plan

Screenshots should be real device or simulator captures from the production app
build. Do not use the web admin dashboard or synthetic mockups for store review.

## Captured iPhone set — September 16, 2026 (UTC)

`ios-6.9/01-discover.jpg`, `02-price-details.jpg`, and `03-stores.jpg` are actual
Release-app captures from iPhone 17 Pro Max / iOS 26.5, made with Xcode 27 Device Hub.
They show the production catalog, product price detail, and supported-store list.
The user was signed out, with optional location and notifications skipped.

The files are 1320 × 2868 JPEGs without alpha, converted from the original Device
Hub PNG captures without changing layout or content. No synthetic UI, overlay text,
or fabricated data was added. Capture source: `610bd59`, version 1.0.0 (10).

The simulator build used the existing app deployment target of iOS 15.1 to override
older Pods' deployment targets rejected by Xcode 27, and `ARCHS=arm64` with
`ONLY_ACTIVE_ARCH=YES`. Those command-line overrides did not change the project.

## iOS

Capture at least these screens from a release or TestFlight build:

- Home catalog with price and unit visible
- Product detail with chart and store price comparison
- Watchlist with a watched item and target-price state
- Map with store markers and optional location permission skipped or accepted
- More account screen showing sign in and account deletion path

Recommended upload sets:

- 6.9-inch iPhone display
- 6.5-inch iPhone display
This first release targets iPhone only, so iPad screenshots are not part of the
default submission package.

## Android

Capture at least these screens from the signed Android App Bundle or an internal
testing install:

- Home catalog with price and unit visible
- Product detail with chart and store price comparison
- Watchlist with a watched item and target-price state
- Map with store markers and optional location permission skipped or accepted
- More account screen showing sign in and account deletion path

Recommended upload sets:

- Phone screenshots
- 7-inch tablet screenshots if Play Console requests them
- 10-inch tablet screenshots if Play Console requests them
