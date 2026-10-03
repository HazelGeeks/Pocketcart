# PocketCart Store Assets

This folder contains store-submission copy and static assets that should stay in
source control. Do not commit certificates, App Store Connect API keys, Google
Play service account files, keystores, or private reviewer credentials.

## Files

- `metadata/en-US.json`: listing copy, URLs, data-safety baseline, and review
  note draft.
- `google-play/feature-graphic.svg`: editable source for the Google Play
  feature graphic.
- `google-play/feature-graphic.jpg`: upload-ready 1024 x 500 feature graphic.
- `screenshots/README.md`: capture provenance and dated upload evidence; two iOS
  screenshots are committed under `screenshots/ios-6.9/`.
- `app-privacy.md`: privacy questionnaire evidence and disclosure rationale.
- `app-review/`: review response drafts, recording checklist and dated device QA
  or crash evidence. Draft placeholders are not ready for submission.

Listing fields belong in `metadata/en-US.json`. Build-specific review responses
and evidence belong in `app-review/`; use `response-draft.txt` as the single source
for both the review reply and Notes. Historical upload or QA records do
not confirm the currently selected submission build.

## Validate

```bash
npm run release:store-assets:check
```

The validator checks metadata length limits and basic image dimensions. It does
not enforce screenshot completeness, review placeholder removal, or consistency
with the selected submission build. A passing check is not final submission
approval. See the [operations guide](../docs/operations-guide.md) for the current
review and remaining maintenance work.
For the camera permission and external donation rejection, follow
[App Review readiness](../docs/app-review-readiness.md). The revised local copy
still needs the matching website and native build to be deployed before submission.
