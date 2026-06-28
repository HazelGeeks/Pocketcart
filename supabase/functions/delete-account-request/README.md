# delete-account-request Edge Function

Public web account-deletion request endpoint for store review. The hosted
`/delete-account` page calls this function when a user cannot access the app.

## Data Flow

- JWT verification is disabled in `supabase/config.toml` so a signed-out user
  can submit a request.
- The function validates email and platform values.
- The request is inserted into `public.account_deletion_requests` with the
  service-role key.
- Apply `database/schema.sql` before deploying this function.

## Deploy

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<supabase-service-role-key>
supabase functions deploy delete-account-request
```

Do not expose `SUPABASE_SERVICE_ROLE_KEY` to the Expo client.
