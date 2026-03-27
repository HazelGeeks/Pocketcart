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
npm run typecheck
```

Web-first development:

- `npm run dev` or `npm run dev:web`: start web app on `http://localhost:8081`

Native development:

- `npm run dev:native`: start Expo for native targets
- `npm run ios`
- `npm run android`

Recommended Node runtime:

- Node 22 LTS (`.nvmrc` included)

## Structure

- `App.tsx`: route shell + section composition
- `src/screens/AppMvpScreen.tsx`: local-first MVP app surface (`/app`)
- `src/screens/DeleteAccountScreen.tsx`: external account deletion page
  (`/delete-account`)
- `src/mvp/store.ts`: account/session/items/history/alerts state engine
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
- Web deploy:
  - Export a production build with `npx expo export --platform web`
  - Upload the generated `dist/` directory to your hosting provider

- MVP route:
  - Web: `http://localhost:8081/app`
  - Also reachable from navbar CTA `Get the App`
- Deletion route:
  - Web: `http://localhost:8081/delete-account`
  - Use this URL for Google Play "account deletion URL" field
- Android review hardening:
  - Blocked `SYSTEM_ALERT_WINDOW`
  - Blocked `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE`
- Implemented MVP scope:
  - Account sign in / sign up / sign out
  - Tracking item CRUD (add / update price / delete)
  - Price history per tracked item
  - Native persistence with AsyncStorage (iOS/Android)
  - Notification center with unread state + mark all read
  - In-app account deletion (two-step confirmation)
  - Compliance links (Privacy, Terms, deletion portal) in MVP screen
  - Basic UX states (loading, saving, validation, empty states)
- Breakpoints requested:
  - `xs: 480`
  - `sm: 640`
  - `md: 768`
  - `lg: 1024`
  - `xl: 1280`
  - `2xl: 1536`
- Readable line length target is kept across key source files.
