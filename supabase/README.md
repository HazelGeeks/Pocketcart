# Supabase backend

This directory contains database change history and server functions. Code review
date: 2026-10-03. These files do not prove the current production deployment.

## Structure

- `migrations/`: dated SQL changes. Preserve applied migrations; make subsequent
  changes in new migrations rather than rewriting deployment history.
- `functions/<name>/`: Edge Function handlers. `_shared/` contains shared server
  logic; it is not a separately deployed function.
- `config.toml`: function JWT gateway settings. A `verify_jwt = false` handler
  must be reviewed for its own authentication or an intentional public contract.
- [`../database/schema.sql`](../database/schema.sql): base schema and SQL reference.
  It does not contain every later feature migration, and the migration directory
  does not include the original core-table bootstrap. Neither alone is a verified
  complete fresh-environment provisioning procedure.

## Function groups

| Responsibility | Functions |
| --- | --- |
| Account removal | `delete-account`, `delete-account-request` |
| Admin flyer import and notification | `back-office-flyer`, `admin-flyer-notification` |
| Sale alert selection and delivery | `sync-sale-alerts`, `send-sale-alert-push` |
| Existing billing and watchlist access | `billing-status`, `watchlist-access` |
| Image analysis | `food-scan`, `receipt-scan` |

## Deployment and maintenance

[Supabase Backend Release](../.github/workflows/supabase-release.yml) replaces the
previous five backend workflows. [release.json](release.json) registers every
migration and configured function, the target project and the pinned CLI version.
A disk/inventory mismatch fails before deployment. `all` deploys all nine active functions; Food Scan is registered as disabled and excluded.
selected function names are also supported.

SQL deployment requires explicit versions. Identical recorded migrations are
skipped, modified recorded files are rejected, and SQL plus history and feature
access checks commit in one transaction. Existing manually deployed SQL is
initially **untracked**, not necessarily missing. Verify it before recording its
history; never replay all SQL as a synchronization shortcut.

Read the [backend deployment procedure](../docs/backend-deployment.md) for initial
history adoption, prerequisites, failure recovery and smoke tests. The
[operations guide](../docs/operations-guide.md) lists remaining maintenance risks.
Feature procedures live in the [documentation index](../docs/README.md).
