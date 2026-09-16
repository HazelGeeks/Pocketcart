# PocketCart social authentication setup

The app code supports native Sign in with Apple on iOS and Supabase's browser-based Google OAuth flow on iOS and Android. Email and password authentication continues to work independently.

No provider secret belongs in the Expo app or in an `EXPO_PUBLIC_*` environment variable. Provider credentials must only be stored in Apple, Google Cloud, and the Supabase dashboard.

## Shared Supabase settings

1. Open **Authentication → URL Configuration** in the PocketCart Supabase project.
2. Add `pocketcart://auth/callback` to **Redirect URLs**.
3. Keep `EXPO_PUBLIC_AUTH_REDIRECT_URL=pocketcart://auth/callback` in the local and EAS build environments.

For the production website, **Site URL** is `https://pocketcart.app`.
The exact web redirect URLs are `https://pocketcart.app/`,
`https://www.pocketcart.app/`, and `https://pocketcart.hazelgeeks.workers.dev/`.
Keep the existing native callback and local-development entries. Web email
confirmation and password-reset requests explicitly return to their current web
origin; native requests retain the configured app deep link.

Supabase automatically links identities that return the same verified email address. Test this with a non-production account before launch.

## Sign in with Apple

1. In Apple Developer, enable **Sign in with Apple** for the App ID `com.pocketcart.app`.
2. Confirm that the provisioning profile used by EAS includes the capability.
3. In **Supabase → Authentication → Providers → Apple**, enable Apple and register `com.pocketcart.app` as a client ID for native sign-in.
4. Rebuild the iOS development app after changing the native capability:

   ```sh
   npm run ios
   ```

The app saves the name returned by Apple immediately because Apple normally supplies it only on the first authorization.

Account deletion obtains a fresh Apple authorization code on iOS. The authenticated
`delete-account` function exchanges it with Apple, checks that Apple's returned
subject and audience match the Supabase Apple identity and this app, and revokes
the returned refresh/access token before deleting the account. Tokens are not stored
or logged. Cancelling the Apple prompt cancels deletion. If Apple is unavailable,
the account is still deleted and the app explains how to disconnect Apple manually,
as required by Apple's TN3194 account-deletion guidance.

Before deploying this flow, create a Sign in with Apple key restricted to the
PocketCart primary App ID and configure these **server-only** Supabase secrets:

- `APPLE_CLIENT_ID=com.pocketcart.app`
- `APPLE_TEAM_ID` — the Apple Developer team ID
- `APPLE_KEY_ID` — the Sign in with Apple key ID
- `APPLE_PRIVATE_KEY` — the downloaded `.p8` content; never commit this file

Deploy `delete-account`, then install a new native build containing the
reauthorization flow. Older clients can still delete their account but cannot send
the fresh code. Until real-device revocation is verified with the configured key,
the production store submission must remain blocked.

Reference: https://developer.apple.com/documentation/technotes/tn3194-handling-account-deletions-and-revoking-tokens-for-sign-in-with-apple

## Google

1. In Google Cloud Console, configure the OAuth consent screen.
2. Create a **Web application** OAuth client.
3. Add the Supabase callback URL shown in the Google provider panel, normally `https://<project-ref>.supabase.co/auth/v1/callback`, as an authorized redirect URI.
4. Copy that Web Client ID and secret into **Supabase → Authentication → Providers → Google** and enable the provider.
5. Do not put the Google client secret in `.env` or `app.json`.

## Release checks

- Test a brand-new Apple account so the first-login name path is exercised.
- Test Apple Hide My Email and an existing email account.
- Test Google cancellation, provider errors, and returning to `pocketcart://auth/callback`.
- Verify that a new social account sees the optional shopping profile survey and an existing account does not.
- Verify sign-out, session restoration after relaunch, and account deletion for each provider.
- Verify that deleting an Apple-created account also revokes its Apple authorization token.
