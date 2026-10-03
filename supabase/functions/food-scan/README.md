# Food Scan — temporarily paused

Code state: 2026-10-03. The app flag in `src/shared/features.ts` is disabled and
`supabase/release.json` lists this function under `disabledFunctions`, excluding
it from ordinary releases. The entrypoint returns `503 FEATURE_DISABLED` before
reading the request body or invoking a provider. `analysis.ts` preserves the
previous implementation for future work and is not imported by the entrypoint.

Deploy the shutdown entrypoint explicitly when pausing the existing live function.
Removing it from the ordinary release list alone does not disable an existing
deployment. Do not delete shared OpenAI secrets; Receipt Scan also uses them.

Before reactivation, add server-side caller validation and atomic usage/cost
limits, review image handling and consent, test guest/account flows as applicable,
then restore the app flag and release inventory together. Never restore the old
unauthenticated handler directly.
