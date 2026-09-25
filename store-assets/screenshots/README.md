# Store Screenshots

Use real device or simulator captures from a release build. Do not use the web
admin dashboard, synthetic mockups, fabricated data, or overlays.

## Current iOS submission — September 25, 2026 (UTC)

The active set contains two unedited 1320 × 2868 JPEG screenshots:

- `ios-6.9/01-discover.jpg`: Home with the live production catalog.
- `ios-6.9/02-price-details.jpg`: Product Details with the current price, price
  change, store, Cart action, sale alert action, and price trend.

Both were captured from the Release simulator app built from `a2d6621`, version
1.0.0 (17), on iPhone 17 Pro Max / iOS 26.5 using
`simctl io screenshot --type=jpeg`. The app was signed out and optional location
was skipped. No layout or content was altered after capture.

Both images were uploaded to the English (U.S.) App Store Connect screenshot set
and reached `COMPLETE`. They replace the previous build 10 screenshots. The old
Stores screenshot was removed from the active set because it does not represent
the latest build; its previous contents remain available in Git history.

The simulator build used an iOS 15.1 deployment-target override for older Pods
and `ARCHS=arm64` with `ONLY_ACTIVE_ARCH=YES`. These command-line overrides did
not change the project or consume an EAS cloud build.

## Future captures

Refresh screenshots whenever the visible app changes. Useful additional screens
include Cart, sale alerts, the store map, and Account. Capture authenticated
screens only with a dedicated account containing no personal information.

This release targets iPhone. Check App Store Connect's current display-size
requirements when adding screenshots; iPad is not part of this submission.

Android screenshots have not been refreshed for this release. Capture them from
a signed release or internal-testing install before a Google Play submission.
