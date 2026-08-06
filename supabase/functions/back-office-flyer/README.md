# back-office-flyer Edge Function

Server-side AI extraction for PocketCart flyer imports.

## Environment

Set these secrets in Supabase:

```bash
supabase secrets set GOOGLE_VISION_API_KEY=<google-vision-api-key>
supabase secrets set GOOGLE_VISION_PDF_PAGES=5
supabase secrets set OPENAI_API_KEY=<openai-api-key>
supabase secrets set OPENAI_MODEL=gpt-4.1-mini
supabase secrets set FLYER_ADMIN_EMAILS=admin@example.com
```

`GOOGLE_VISION_API_KEY` enables Google Vision OCR for images and PDFs.
`OPENAI_API_KEY` enables prompt-based AI mapping into the back-office columns:
store brand, branch/store name, sale start date, sale end date, English product name,
Korean product name, category, product brand, price, unit, and memo.
Without OpenAI, the function only uses Google Vision OCR and falls back to a simple price-line parser.
`GOOGLE_VISION_PDF_PAGES`, `OPENAI_MODEL`, and `FLYER_ADMIN_EMAILS` are optional.
If `FLYER_ADMIN_EMAILS` is set, only those signed-in Supabase users can call the function.

Do not put provider API keys in `EXPO_PUBLIC_*` variables. The Expo client should only receive the function URL.

## Deploy

```bash
supabase functions deploy back-office-flyer
```

This function is configured as an authenticated browser upload endpoint in `supabase/config.toml`:

```toml
[functions.back-office-flyer]
verify_jwt = true
```

If you created the function through the Supabase Dashboard Editor, keep JWT verification enabled for `back-office-flyer`.

Use the deployed function URL in the Expo client:

```bash
EXPO_PUBLIC_FLYER_AI_ENDPOINT=https://YOUR_PROJECT_REF.supabase.co/functions/v1/back-office-flyer
```

The frontend sends the current Supabase session bearer token when available.
