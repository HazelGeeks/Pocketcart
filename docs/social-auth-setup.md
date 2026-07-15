# PocketCart social authentication setup

The app code supports native Sign in with Apple on iOS and Supabase's browser-based Google OAuth flow on iOS and Android. Email and password authentication continues to work independently.

No provider secret belongs in the Expo app or in an `EXPO_PUBLIC_*` environment variable. Provider credentials must only be stored in Apple, Google Cloud, and the Supabase dashboard.

## Shared Supabase settings

1. Open **Authentication → URL Configuration** in the PocketCart Supabase project.
2. Add `pocketcart://auth/callback` to **Redirect URLs**.
3. Keep `EXPO_PUBLIC_AUTH_REDIRECT_URL=pocketcart://auth/callback` in the local and EAS build environments.

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

Before an App Store submission, add server-side storage and revocation of the Apple
authorization token used by each account. Apple requires apps that support Sign in
with Apple to revoke the user's token when the account is deleted. Until that backend
flow and its Apple private-key secrets are configured and verified, Apple sign-in is
for internal testing only and the production store submission must remain blocked.

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
