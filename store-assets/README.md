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
- `screenshots/README.md`: required screenshot capture plan.

## Validate

```bash
npm run release:store-assets:check
```

The validator checks metadata length limits and the committed feature graphic
dimensions. Screenshots are intentionally kept out of Git until real device or
simulator captures are ready.
