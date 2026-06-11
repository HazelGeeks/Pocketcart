# back-office-flyer Edge Function

Server-side AI extraction for PocketCart flyer imports.

## Environment

Set these secrets in Supabase:

```bash
supabase secrets set GOOGLE_VISION_API_KEY=AIza...
supabase secrets set GOOGLE_VISION_PDF_PAGES=5
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set OPENAI_MODEL=gpt-4.1-mini
```

`GOOGLE_VISION_API_KEY` enables Google Vision OCR for images and PDFs.
`OPENAI_API_KEY` enables prompt-based AI mapping into the Korean back-office columns:
마트명, 지역/지점, 세일 시작일, 세일 종료일, 이름, 대분류, 중분류, 브랜드, 가격, 단위, 메모.
Without OpenAI, the function only uses Google Vision OCR and falls back to a simple price-line parser.
`GOOGLE_VISION_PDF_PAGES` and `OPENAI_MODEL` are optional.

Do not put provider API keys in `EXPO_PUBLIC_*` variables. The Expo client should only receive the function URL.

## Deploy

```bash
supabase functions deploy back-office-flyer
```

This function is configured as a public browser upload endpoint in `supabase/config.toml`:

```toml
[functions.back-office-flyer]
verify_jwt = false
```

If you created the function through the Supabase Dashboard Editor, turn off JWT verification for `back-office-flyer` in the function settings as well.

Use the deployed function URL in the Expo client:

```bash
EXPO_PUBLIC_FLYER_AI_ENDPOINT=https://YOUR_PROJECT_REF.supabase.co/functions/v1/back-office-flyer
```

The frontend sends the current Supabase session bearer token when available.
