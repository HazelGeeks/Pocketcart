# PocketCart (React Native Scaffold)

TypeScript-first scaffold for a shopping helper app where users can
compare prices, track products, and estimate savings.

Current language support:

- English (`en`)
- French (`fr`)

## Run

```bash
nvm use
npm install
npm run dev
npm run verify
```

Web-first development:

- `npm run dev` or `npm run dev:web`: start web app on `http://localhost:8081`

Native development:

- `npm run dev:native`: start Expo for native targets
- `npm run ios`
- `npm run android`

Recommended Node runtime:

- Node 22 LTS (`.nvmrc` included)

## Quality Gates

- `npm run typecheck`: TypeScript compile checks
- `npm run lint`: strict no-emit TypeScript check (temporary lint gate)
- `npm run test`: route smoke tests
- `npm run build:web`: Expo static web export
- `npm run verify`: full pre-release gate (`typecheck + lint + test + build:web`)

## Structure

- `App.tsx`: route shell + section composition
- `src/screens/NativeAppScreen.tsx`: native app shell
  (Home / Watchlist / Map / Alert / More)
- `src/services/supabaseClient.ts`: Supabase client bootstrap
- `src/services/userProfile.ts`: sign-up and profile read/write helpers
- `src/screens/DeleteAccountScreen.tsx`: external account deletion page
  (`/delete-account`)
- `src/sections/*`: landing page sections
- `src/components/*`: shared UI blocks
- `src/i18n/siteI18n.tsx`: locale provider + persistence
- `src/i18n/siteCopy.ts`: EN/FR copy dictionary for the SPA
- `src/screens/BlogScreen.tsx`: blog route
- `src/screens/PrivacyScreen.tsx`: privacy route
- `src/screens/TermsScreen.tsx`: terms route

## Notes

- Google Analytics 4:
  - Create a web data stream in GA4 and set
    `EXPO_PUBLIC_GA_MEASUREMENT_ID` in your local env and deployment env.
  - Example: copy `.env.example` to `.env` and replace the placeholder value.
- Supabase (for native `More` tab sign-up/profile):
  - Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env`
  - Create `profiles` and `watchlist_items` tables and RLS policies in Supabase SQL Editor:

```sql
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create table if not exists public.watchlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  store text not null,
  target_price text,
  latest_price text,
  created_at timestamptz not null default now()
);

alter table public.watchlist_items enable row level security;

create policy "watchlist_select_own"
on public.watchlist_items
for select
to authenticated
using (auth.uid() = user_id);

create policy "watchlist_insert_own"
on public.watchlist_items
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "watchlist_update_own"
on public.watchlist_items
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "watchlist_delete_own"
on public.watchlist_items
for delete
to authenticated
using (auth.uid() = user_id);
```
- Web deploy:
  - Export a production build with `npm run build:web`
  - Upload the generated `dist/` directory to your hosting provider
- Get the App navigation:
  - Hover `Get the App` in the top navbar (web) to open direct iOS/Android download links.
  - Tap `Get the App` on native/mobile to toggle the same two links.
- Native app shell:
  - iOS/Android renders a dedicated native app scaffold, separate from the web landing screen.
  - `Home` tab supports product search, detail page transition, `Add to Watchlist`, and 7-day price trend with previous-price list.
  - `Map` tab is wired to in-app map + local search (sample store data for now).
  - `More` tab is wired to Supabase sign-up and user profile summary.
  - `Watchlist` tab now shows only user-added items from Supabase.
- Deletion route:
  - Web: `http://localhost:8081/delete-account`
  - Use this URL for Google Play "account deletion URL" field
- Android review hardening:
  - Blocked `SYSTEM_ALERT_WINDOW`
  - Blocked `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE`
- Added release hardening:
  - Route parser smoke tests for `/`, `/blog`, `/privacy`, `/terms`, `/delete-account`
  - Scripted release gate via `npm run verify`
- Web release checklist:
  - Set `EXPO_PUBLIC_GA_MEASUREMENT_ID`
  - Run `npm run verify`
  - Inspect generated `dist/` and deploy
- Breakpoints requested:
  - `xs: 480`
  - `sm: 640`
  - `md: 768`
  - `lg: 1024`
  - `xl: 1280`
  - `2xl: 1536`
- Readable line length target is kept across key source files.
