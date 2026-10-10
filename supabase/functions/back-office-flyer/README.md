# back-office-flyer Edge Function

Server-side AI extraction for PocketCart flyer imports.

## Environment

Set these secrets in Supabase:

```bash
supabase secrets set GOOGLE_VISION_API_KEY=<google-vision-api-key>
supabase secrets set GOOGLE_VISION_PDF_PAGES=5
supabase secrets set OPENAI_API_KEY=<openai-api-key>
supabase secrets set FLYER_OPENAI_MODEL=gpt-6-luna
supabase secrets set FLYER_ADMIN_EMAILS=admin@example.com
```

`GOOGLE_VISION_API_KEY` enables Google Vision OCR for images and PDFs.
`OPENAI_API_KEY` enables prompt-based AI mapping into the back-office columns:
store brand, branch/store name, sale start date, sale end date, English product name,
Korean product name, category, product brand, price, unit, and memo.
Without OpenAI, the function only uses Google Vision OCR and falls back to a simple price-line parser.
`GOOGLE_VISION_PDF_PAGES`, `FLYER_OPENAI_MODEL`, and `FLYER_ADMIN_EMAILS` are optional.
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

## Product template extraction

The model receives the original image/PDF even when Vision OCR succeeds. OCR text is
supplementary, so the model can use the page layout to associate products and prices.
An empty or failed OCR result also falls back to reading the original attachment.

The extraction prompt supplies an English name (translating from Korean only when needed),
optional Korean text copied from the source, consistent English categories, full selling
sizes, and visible store/date metadata. Conditional offers without an unconditional
single-item price are left without a price and explained in Memo for review.

`Export Product CSV` shares the exact header and order of the Product import template.
Rows with a missing English name, category, selling unit or single price must be corrected
or deselected first. Retailer, branch and sale dates may be blank when exporting a draft;
complete sale details before importing prices. Nonempty invalid dates still need correction. No product/store IDs are invented.
A blank branch retains the existing Product import behavior: all active branches of
the supplied retailer. Confirm that the flyer applies to those branches.
`Export CSV` retains review notes; Product CSV does not include Memo.

Deploy this function to activate the new extraction prompt and original-file handling;
rebuild the admin web client for normalization, review messages and template export.
Local tests mock provider responses and check file forwarding and the extraction-to-
Product-import contract. They do not measure real flyer OCR or translation accuracy.
After deployment, compare a representative image and PDF against their source: names,
sizes, prices, dates, store scope, missing rows and neighboring-product mix-ups.

### Text-only scope

Flyer extraction no longer requests or processes image crops. The original attachment
is still sent to the model to read the product text and layout; no product image is
extracted, previewed or uploaded. Product CSV retains its thumbnail column, left blank.
Existing product images are not modified by this change.

Korean name generation is deferred. A Korean name printed in the flyer is preserved;
an English-only product can pass Product CSV review without filling Korean name.
The response schema restricts categories to English values. The client also maps known
legacy Korean categories to English and flags unknown ones for review.

Flyer defaults to `gpt-6-luna`. Set `FLYER_OPENAI_MODEL` to override it.
When upgrading an existing deployment, set `FLYER_OPENAI_MODEL=gpt-6-luna` as well;
an existing secret overrides the code default. The web admin accepts up to 30
images/PDFs per batch and processes them sequentially.
The shared `OPENAI_MODEL` setting no longer selects the Flyer model, so existing
Food Scan settings are unaffected. Deploy the updated function to apply this change.

The response includes `usage` for OpenAI calls: model, input/output/total tokens,
cached input, cache writes, reasoning tokens, and `estimatedCostUsd`. The web admin
shows the batch totals alongside its completion notice, including reported usage
for empty results or extraction errors. OCR-only responses use `usage: null`; absent
usage (including older deployments) is shown as unavailable or partial, never as
a confirmed zero charge.

USD estimates use [GPT-6 Luna pricing](https://developers.openai.com/api/docs/models/gpt-6-luna)
checked 2026-10-08, accounting for cache reads/writes, the per-request long-context
threshold, and the returned service tier. Reasoning tokens are already included in
output tokens. Unknown models/tiers retain token counts but show cost unavailable.
Google Vision OCR charges, taxes, and account-specific adjustments are excluded.
Deploy the updated function and web build together to enable the usage display.

### Duplicate extraction and usage limits

Apply `20261010010000_flyer_extraction_cache.sql` through the backend release guide
before deploying the updated function. Missing controls fail before calling a paid
provider. Only the server role can reserve or finish extraction; ordinary users
cannot read saved results, counters or claim RPCs. The function still verifies the
signed-in admin and optional email allowlist on every request, including cache hits.

Successful results are reusable for seven days. The key includes the file hash,
prompt, response schema, model, OCR settings, output limit and extraction version.
Increment the version in the handler if normalization semantics change. PDF names
are canonicalized for extraction; the client retains the actual source filename.
Concurrent duplicates receive 409 while the first request owns its ten-minute
reservation. Failed/expired claims can be retried manually; no paid automatic retry
is performed. Failure attempts remain counted because a provider may have charged.
Expired results and counters older than 30 days are pruned during reservations.

| Setting | Default | Scope |
| --- | --- | --- |
| `FLYER_DAILY_USER_LIMIT` | 120 | New extraction attempts per admin per UTC day |
| `FLYER_DAILY_GLOBAL_LIMIT` | 300 | New extraction attempts across the project per UTC day |
| `FLYER_MAX_OUTPUT_TOKENS` | 32000 | OpenAI reasoning/output ceiling per file; maximum 64000 |

Limits are checked atomically in PostgreSQL. Cache hits remain available after
quota exhaustion and return `usage: null` plus a reuse notice; old usage is not
counted as current spending. A quota error stops the remaining batch requests and
keeps rows already extracted. Provider calls time out after 90 seconds. Incomplete
OpenAI responses are rejected without importing partial rows; split large files
before retrying. These are request/output limits, not a guaranteed USD spending cap:
input tokens, Google OCR and provider pricing remain separate costs.
Google OCR remains enabled when configured to preserve extraction quality.

Run the isolated DB check with `PGLITE_MODULE=/path/to/pglite/dist/index.js node
tests/integration/flyer-cost-control.mjs`. Production migration application,
function deployment and live quota/cache verification are separate release steps.
