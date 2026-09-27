# Physical-device launch failure — 2026-09-24 PDT

## Confirmed result

- Physical device: iPhone 17 Pro (iPhone18,1), iOS 27.0 (24A437), public release.
- TestFlight lists PocketCart 1.0.0 (17), matching the rejected App Store submission.
- Launch from TestFlight and the Home Screen failed. iOS displayed “PocketCart: Grocery Savings Crashed”.
- Device Hub reports five PocketCart crashes between 23:17:47 and 23:19:36.
- The latest report confirms version 1.0.0 (17), EXC_BREAKPOINT / SIGTRAP, with top frame `___UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption_block_invoke`.
- No normal user flow, registration, login or account deletion could be tested. No review-ready recording exists. No review reply or Notes update was submitted.

## Cause

The local iOS project starts React Native with a UIWindow from AppDelegate and has no UIApplicationSceneManifest. The production binary reports AppStoreTools 27A261. Apple requires apps built against the iOS 27 SDK to adopt the scene lifecycle; this matches the physical crash stack.

Sources:
- https://developer.apple.com/documentation/uikit/transitioning-to-the-uikit-scene-based-life-cycle
- https://github.com/expo/fyi/blob/main/ios-scene-lifecycle.md

## Required recovery before review footage

Adopt a supported scene lifecycle integration, create a new iOS build, validate launch, foreground/background transitions, authentication return URLs, notification handling and cold-start links, then repeat physical-device QA and capture the normal flow. Expo 55 in this repository does not contain ExpoAppSceneDelegate; the current Expo migration guide provides supported opt-in on Expo 57.0.23+ and default support on SDK 58. Do not add a scene manifest alone without implementing window creation and callback forwarding. Do not label a new local binary as the submitted build 17.

## Recording environment

Device Hub screen sharing and UI control now work on iOS 27. Controls > Record Screen is disabled for this device. QuickTime movie inputs currently list cameras but no iPhone screen source. A supported screen-capture path or iPhone recording/export must be established after restoring app launch. Nothing was recorded by QuickTime.

## Evidence

The sanitized JSON alongside this file was transcribed from the Console UI. The full report was read in Console; shell access to its protected Device Hub container was denied. No full device report or device-specific personal identifiers were added to this folder.
