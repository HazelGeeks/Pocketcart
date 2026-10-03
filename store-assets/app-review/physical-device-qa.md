# App Review physical-device QA and recording

This ledger separates dated observations from the exact binary tested. A previous TestFlight result does not verify later local changes or the currently selected App Store submission.

## October 3, 2026 — current QA

Status: Core navigation/persistence checks completed on build 19; owner-confirmed preview and local photo capture passed on final build 21 with screen sharing off. Remaining coverage is listed below. Physical iPhone 17 Pro, iOS 27.0.1 (24A446), Developer Mode enabled. Local Release 1.0.0 (21) is development-signed, installed as an update and launched. This is not a TestFlight or App Store submission. The owner reports that TestFlight still shows build 18.

### Exact artifact and local checks

- Apple account reauthentication resolved the initial development-signing failure. Xcode Release compilation, strict deep signature verification and update installation succeeded. Fresh Apple device inventory confirms 1.0.0 (21). Existing app data and the ordinary review-account session were preserved.
- Build 21 source inventory SHA-256: `57826d91d8f30d68387650d20590c41837ef389e14eaf8571642b41c0939048b` (504 tracked/non-ignored files under src, ios, vendor and scripts, plus package.json, package-lock.json, app.json and eas.json; dirty worktree; sorted path/NUL/content/NUL). Environment values are excluded.
- Signed executable SHA-256: `c161e416d167041bbf8e323c55e6e39bce390cb821fdacb544b9b72da7204e4d`. Hermes main.jsbundle SHA-256: `9a7efc2e68a7152537b04882b5517d07a1e9602c1163858a71e3ac97c4d66477`.
- `npm run release:native:check`: PASS, including 462 tests, typecheck, lint, web export, native configuration and store-asset checks. Store checks still warn that submission screenshots need actual release/TestFlight captures.
- `npm audit --json`: zero findings at every severity. `npm run audit:ci`: PASS, including two compatibility/security patches and 181 fork files. An initial DNS failure was retried successfully with network access. `git diff --check`: PASS.
- Build 19 used for the core tests below: source inventory `af985f6b898f391ccfa457ae575cd3ffeb36d80ff69e1ed66f36843e2bcbc216`, executable `2b6a8c2c22042b6ea3d11e0f8276ba952c691e4b1326736811474e2c71f3b553`, main.jsbundle `2e55afe902d75cdacfcf72330b4a17ba928b0fa43d4feafe1aae633c60bbdfe9`. These checks are not silently relabeled as build 21 tests.

### Physical behavior and data restoration

| Check | Observation |
| --- | --- |
| Launch and session | Build 19 launch and subsequent permission-change cold launches passed; ordinary review session remained signed in. Build 20 also launched after update. |
| Discover and details | 272 products loaded. Jumbo Carrot detail showed image, CAD 0.79 at PriceSmart Foods, previous CAD 0.69, trend and +14.49% change. |
| Cart persistence | Napa Cabbage quantity 1 → 2 changed subtotal CAD 1.28 → 2.56; navigating away and reopening retained quantity 2. Restored quantity 1 and CAD 1.28. Existing three pending and two purchased items were preserved. |
| Freezer persistence | Milk demo quantity 1 → 2 saved and remained 2 after navigating away and reopening. Restored Milk demo quantity 1. Existing Chinese Eggplant was preserved. |
| Feature/support menu | Build 19 Account displayed Map and Receipts; Food Scan and Support Pocket Cart donation row were absent. |
| Manual receipts | Started with zero receipts/CAD 0.00. Created one synthetic October 3 receipt, CAD 7.00, one item, quantity 1, tax/discount 0, reviewed details; saved, reopened and retained after navigation. |
| Receipt cleanup | Owner explicitly approved deletion. Deleted the single synthetic receipt and confirmed zero receipts/CAD 0.00 on re-entry, including after update to build 20. |
| Denied camera | Owner approved temporary permission change. With camera off, receipt camera showed neutral denial guidance, Settings link and manual-entry return. Settings link opened PocketCart settings. |
| Permission restoration | Camera toggle restored ON and visually confirmed. Permission changes caused an app cold launch; this does not establish a same-mounted-screen foreground refresh on physical hardware. |
| Camera preview | With Device Hub sharing active, builds 19 and 20 showed a black preview on both Hub and the physical phone. The owner also found the built-in Camera app black. After stopping Device Hub screen sharing, the owner confirmed both built-in Camera and PocketCart were normal. On final build 21 with sharing off, the owner confirmed both live preview and the captured photo were normal. |

Device Hub forwarded alphabetic hardware-keyboard input as Option-key variants during the manual receipt test. Numeric input worked. The synthetic store/item labels included those variants; exact ASCII text entry was not validated. No real receipt or private photo was captured or sent to OpenAI in the automated checks.

### Camera investigation and test environment

- Explicit CameraView width/height in build 20 did not resolve the preview. Temporary native diagnostics confirmed bounds and preview frame 362 × 430, a running/uninterrupted capture session, and an enabled/active back-camera preview connection. No image contents or credentials were logged.
- The owner confirmed the same black image in the built-in Camera. Device Hub screen sharing was stopped, and the owner confirmed both camera apps were then normal. The screen-sharing condition explains this observed reproduction; no Expo library defect or physical hardware failure is asserted.
- Reverted the ineffective preview sizing change and restored the original Expo camera source. Final build 21 has no temporary native diagnostic strings. The owner performed the final camera/capture test directly on the iPhone with Device Hub screen sharing off and confirmed the live preview and captured photo were normal. The instructed fixture was a non-private test sheet, with no save or OpenAI read action. Do not reopen sharing while asking the owner to confirm camera behavior.
- iPhone Mirroring was quit at the owner's request, and process inspection confirmed it exited. Only Device Hub was used for earlier navigation; it is now disconnected from screen sharing.
- At the owner's request, 20 redundant/older simulators were removed from an inventory of 22 shut-down simulators. Retained iPhone 18 Pro and Pro Max on iOS 27.0. Unused iOS 18.1, 18.2 and 26.5 runtimes were removed after Apple deletion dry-runs. A fresh inventory confirmed two simulators and only the iOS 27.0 runtime; unrelated watchOS and physical iPhone/iPad registrations were preserved.

### Production web deployment

- Owner explicitly approved deployment to pocketcart.app. Initial cleanup deployed as Cloudflare version `0831d919-d387-4a73-989d-b538c47bd668` and removed the live Ko-fi URL/card.
- Final verification found old Food Scan service wording in Terms and old More/support-request directions on the deletion page. Updated these factual descriptions to paused Food Scan, optional receipts, Account > Account actions > Delete Account, and the existing deletion request form. Published final Cloudflare version `baa63231-e353-4d1f-9e01-bf91ec7c013e`.
- Final entry: `/_expo/static/js/web/AppEntry-1d1156084966ffd95dad52f1e4e3faa5.js`, SHA-256 `1d1156084966ffd95dad52f1e4e3faa5be1e49e842ae3ed247501f874196d067`. Fresh live download contains zero `ko-fi.com` occurrences and the revised service/deletion guidance; support/privacy/terms/delete-account all returned HTTP 200. Live support renders account/permission/privacy/deletion guidance without a donation card. Privacy, Terms and deletion pages were opened in the browser; Terms and deletion guidance were verified after final deployment. No deletion request was submitted.
- Support screenshot: [qa-2026-10-03-support.jpg](qa-2026-10-03-support.jpg). This shows the deployed website, not a physical app or submission screenshot.

### Remaining boundaries

First-use camera system prompt is not physically tested because the existing permission was already granted. New registration, social sign-in, disposable account deletion, remote push delivery, family invites, denied location/manual Map search, optional OpenAI extraction and photo-storage cleanup remain unverified in this session. No full continuous recording was captured. General support contact routing, content rights, exact submission screenshots and App Store metadata remain release gates.

No Git commit/push, TestFlight upload, App Store Notes edit or review resubmission was performed. Do not report the development-signed binary as beta-ready or App Store-approved.

## September 25, 2026 — historical QA

Status at that time: Build 18 installed and physical launch/core-flow checks passed. Complete QA and review-ready footage remained incomplete. The user changed scope to a self-recording checklist and English response/Notes drafts; automated recording and broader testing were discontinued. See recording-checklist-ko.md.
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
