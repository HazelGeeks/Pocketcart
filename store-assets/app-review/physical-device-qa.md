# App Review physical-device QA and recording

Status: Build 18 installed and physical launch/core-flow checks passed on September 25. Complete QA and review-ready footage remain incomplete. The user explicitly changed scope to a self-recording checklist and English response/Notes drafts; automated recording and broader testing were discontinued. See recording-checklist-ko.md.
Local base: b60a819 plus uncommitted recovery changes; app.json declares 1.0.0 (18). The rejected App Store submission still references 1.0.0 (17), build ID c7b5eef2-2557-45a1-bba4-29ce8cbb0038.

## Prerequisites

- The user updated the physical iPhone 17 Pro to iOS 27.0. Device Hub screen sharing works. The installed TestFlight app matches build 17 but crashes before its first screen.
- Apple security releases (https://support.apple.com/en-us/100100), checked this session, identifies iOS 27 as the latest public version. The device upgrade and installed TestFlight build are now verified. Launch must be fixed before the requested recording.
- Use synthetic shopping and receipt data, a disposable demonstration account, and separate working reviewer credentials.
- Obtain owner clarification of retailer image/flyer sources and usage permissions.
- App Store Connect login is now verified. The submission is rejected under Guideline 2.1 / Information Needed. Review sign-in fields and existing Notes are present. Preserve those credentials; no new Notes or response were saved/sent.

## Continuous recording sequence

1. Start recording on the physical device before launching PocketCart. Show launch from the Home Screen.
2. Show guest browsing and product details, store prices and offer dates.
3. Open Account, register a disposable account, then sign out and sign in again. Complete any required email verification. Document provider used; check Apple sign-in separately when supported.
4. Add a product to Cart, change its quantity and mark it purchased. Confirm persistence after navigating away and reopening.
5. Save a product sale alert and show target-price settings. Notification delivery requires separate evidence; do not claim delivery just from saving a preference.
6. Open My Freezer, create a synthetic item with quantity/storage/date, edit it and reopen it.
7. Open Account > Features > Map and find a supported location using city or postal-code search. Show behavior without location permission.
8. Open Account > Features > Receipts. Enter a synthetic receipt manually and verify it persists. Photograph the sample below, demonstrate the AI consent and review/correct extracted fields before saving.
9. Open Food Scan. Show the confirmation before an image leaves the device, including cancellation. If analysis is demonstrated, record the actual result.
10. Show Family invitation-only sharing and its member controls using test accounts. Do not send an invitation to a real contact. Record which controls exist; do not claim reporting/blocking controls that are absent.
11. Show that no paid feature is required. If the submitted binary differs from local source, demonstrate its actual purchase/access flow and revise the response accordingly. Do not make a real payment.
12. In the disposable demonstration account, show Account > Account actions > Delete Account and the completion state. Check that the old account can no longer sign in. Never delete the owner's or reviewer's account.
13. Stop recording, watch the entire exported video, check legibility and absence of private data, and save the exact file and duration.

## Synthetic receipt

DEMO GROCERY — TEST DATA, NOT A REAL PURCHASE
Date: use today's date
Milk: 1 x CAD 4.00
Apples: 1 x CAD 3.00
Subtotal: CAD 7.00
Tax: CAD 0.00
Total: CAD 7.00
No name, address, payment card or loyalty details.

## Evidence ledger

| Check | Result | Evidence |
| --- | --- | --- |
| Exact submitted build | Confirmed 1.0.0 (17) | Rejected submission 08c97faa-95f5-4f33-918f-baef4061053f |
| Physical device / current public OS | Confirmed iPhone 17 Pro / iOS 27.0 (24A437) | Device Hub and crash report |
| Launch and browse | Build 17 FAIL; build 18 PASS for observed launch and navigation | Build 17: ios27-launch-failure.json; build 18: physical Device Hub UI |
| Registration and login | Existing review-account email login PASS; new registration pending | Signed-in test account visible; password not saved to device |
| Cart persistence | PASS across tab navigation | Added BC Ambrosia Apple, quantity 2, subtotal CAD 4.64; Purchased marking changed remaining subtotal to CAD 1.28 |
| Alerts | Save and in-app activity PASS; remote push delivery unverified | BC Ambrosia Apple shown in Manage alerts and activity |
| Freezer persistence | PASS across tab navigation | Synthetic Milk demo item saved and reopened |
| Map / location optional | Map loaded; optional-location flow pending | Existing location permission was active; one store marker logo appeared blank |
| Receipts / AI consent | Receipts screen loaded; entry/AI flow pending | Empty account receipt summary visible |
| Family controls | Not tested | Video timestamp |
| Paid feature status | Build 18 free-feature explanation verified | Pocketcart Plus: no subscription required; no new purchase option visible |
| Account deletion | Not tested | Disposable account only |
| Third-party content rights | Pending | Owner statement / documents |
| Review reply sent | No | Verify sent message |
| Notes saved | No | Reload and compare saved text |

## Local verification completed

- Recovery build 18: `npm run release:native:check` passed, including 434 tests, typecheck, lint, export, native configuration and store-asset checks.
- Xcode 27 Release simulator compilation passed after regenerating Pods with the existing deployment-target normalization. This is compilation evidence, not physical QA.
- Signed production IPA: `/tmp/pocketcart-testflight18.ipa`; SHA-256 `1f2969a320e4464736fbdddb70bcd52f4b39c787a4110f29cb388ac7a6c6c173`. Inspected version 1.0.0 (18), iPhoneOS 27.0 SDK and resolved `PocketCart.SceneDelegate` manifest.
- Apple accepted upload at 2026-09-24 23:43:44 PDT. Exact build ID: `69935f0f-80f8-4984-82c2-97ae191f1d43`. API subsequently verified `VALID`, `IN_BETA_TESTING`, internal beta group `Group`, and saved English test notes.
- The physical device returned to its passcode screen while Apple processed the build. The user subsequently unlocked the Device Hub session. `devicectl device info apps` confirmed the physical installation is version 1.0.0, bundleVersion 18.
- Physical session September 25, approximately 00:11–00:35 PDT: launch, sign-in, browsing, Cart, alert storage and Freezer checks described above. No full-suite claim is made. The first iPhone screen recording displayed a 4:51 saving indicator; a later core-flow recording was started. Neither recording was exported, fully reviewed, or approved for submission. The owner took over the device and requested self-recording instead.
- Current App Store availability was read through the official API: only CAN available, new-territory availability off. English response and Notes drafts are now 3,625 characters each, with explicit placeholders for video, grocery sources and content rights.

- `npm run verify`: PASS (typecheck, lint, tests and web export). This does not prove physical-device behavior or the rejected binary.
- `npm run release:store-assets:live-check`: PASS after allowing network access; support, marketing, privacy, terms and account-deletion URLs all returned HTTP 200. The checker retains a general screenshot warning; no new physical-device recording was made.
- Draft response and identical Notes draft are below 4,000 characters before placeholders are replaced.

## Submission

Complete response-draft.txt from verified facts. Keep Notes within 4,000 characters; attach additional evidence if needed. Upload the physical-device recording and include its attachment name or accessible link in both the review reply and Notes. Preserve existing review-contact and sign-in fields. Reopen the saved page to verify persistence. Do not claim completion while any required evidence is missing.
