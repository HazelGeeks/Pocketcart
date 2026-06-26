# delete-account Edge Function

Authenticated account deletion endpoint for iOS and Android store review.

The Expo client calls this function from the native More tab while the user is
signed in. The function validates the bearer token and deletes the matching
Supabase Auth user through the service-role Admin API. Related profile,
watchlist, and admin rows are removed through existing `auth.users` foreign-key
cascades.

## Environment

Set this as a Supabase Edge Function secret:

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<supabase-service-role-key>
```

Do not put `SUPABASE_SERVICE_ROLE_KEY` in any `EXPO_PUBLIC_*` variable.

## Deploy

```bash
supabase functions deploy delete-account
```

JWT verification must stay enabled:

```toml
[functions.delete-account]
verify_jwt = true
```
