# Dependency security and usage audit

Checked October 3, 2026. Expo SDK 55 and React Native 0.83 are retained.

## Dependency changes

- `brace-expansion`: patched 1.1.21 and 5.0.12 in the respective dependency branches.
- `image-size`: overridden to 2.0.4. Metro's file-path asset loader reads a buffer
  before calling the new decoder. This compatibility patch is version/hash gated.
- Wrangler: lockfile updated from 4.129.0 to 4.147.0 within the existing major range.
  This brings Sharp 0.35.4 and Undici 7.29.1 through the matching Miniflare version,
  addressing additional findings that were hidden by the previous dev omission.
- `braces` and `node-forge`: all dependency paths use private, source-controlled
  security forks, installed from local archives. There is no registry release
  containing the fixes at the time of this audit. These are downstream forks,
  not claimed upstream releases.

The `braces` fork rejects parser nesting and compile/expand/stringify recursion
beyond 128 levels, including direct AST inputs. It fixes the demonstrated recursive
stack exhaustion described in
[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
The `node-forge` fork checks nested DigestAlgorithm element counts during RSA
verification, backported from proposed
[upstream PR 1152](https://github.com/digitalbazaar/forge/pull/1152), commit
`ceba34402e329f0365134f23fe19898756527d65`, for
[GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv).

The original npm archive SHA-512 was verified before copying the source. Original
licenses, exact source changes and provenance are preserved in each fork's
`UPSTREAM.json` and `LICENSE`. Unpatched prebuilt browser bundles are excluded;
these libraries are used by Node build tooling. The fork names identify local
maintenance ownership; the actual source fixes, not the new names, address the
vulnerabilities. A zero registry finding count does not audit local source.

## Reproducible installation and enforcement

Direct registry dependencies now use the exact versions already resolved in the
reviewed lockfile; `.npmrc` sets `save-exact=true` for future additions. This
manifest cleanup did not upgrade/downgrade existing direct application dependencies. Both
dependency sections are alphabetized. Do not replace the lockfile or run broad
updates to shorten the manifest.

Local/CI Node uses `.nvmrc`, matching the EAS `base` build profile. The EAS CLI
version is fixed in `eas.json` and the matching exact devDependency. Local scripts
and CI execute the installed CLI through `scripts/eas-cli.mjs`. It was previously
run through unversioned npx, outside the app lockfile/audit; a separate inspection
found 17 high findings in that external graph. EAS is now included in the shared
lockfile, security overrides and full audit. CLI version/help checks do not prove
a signed cloud build or store submission.

`package.json` keeps development, validation, backend, build and release commands
in that order. `scripts/run-tests.mjs` replaces the inline cleanup/compiler/test
chain and stops after any failed stage. Primary production build aliases remain;
development/preview profiles use `npm run eas -- build --platform <platform>
--profile <profile>`. Store submission requires `--id <REVIEWED_BUILD_UUID>` or
`--path <ARTIFACT>`, with target validation before running the CLI. Named EAS
lifecycle hooks and the security `postinstall` are required and retained.

Root file dependencies and npm `$braces`/`$node-forge` overrides force every
transitive copy to use the reviewed archives in `vendor/packages/`. Lockfile
integrity pins the archives. The corresponding readable source is in
`vendor/braces/` and `vendor/node-forge/`.

The EAS-scoped overrides in `package.json` update its Ajv, Joi, minimatch, tar and
YAML branches to reviewed fixes. Diff 8 and ts-deepmerge 8 also fix its remaining
advisories; their EAS call paths were checked. EAS 24 uses ts-deepmerge's former
default export when generating projects, so a version/hash-gated compatibility
patch selects the upstream 8 `merge` export. The same security-patch installer
and audit check enforce it. Tests resolve actual inherited EAS profiles and
generate synthetic nested app config through the patched EAS function.

`npm ci` applies the Metro and EAS compatibility patches through `postinstall`, requiring
its exact upstream version and original/patched SHA-256. It also verifies every
file of the fork sources and all installed copies against
`scripts/vendor-security-manifest.json`. Unexpected source, metadata, extra files
or unpatched registry copies fail. Install scripts must be enabled. If deliberately
using `--ignore-scripts`, run `npm run postinstall` before using the tools.

`npm run audit:ci` repeats integrity checks and runs **full** `npm audit --json`,
including development dependencies. Every high/critical advisory is a failure.
There are no advisory exemptions or excluded package categories.

`tests/dependencySecurity.test.cjs` covers ordinary and malicious brace patterns,
direct/cyclic ASTs, valid RSA signatures with optional NULL parameters, rejected
nested DigestAlgorithm garbage, Metro image decoding, Expo certificate/CSR/signing
compatibility, modified-source detection, and audit-gate failure behavior.

Maintain these two forks until reviewed upstream releases can replace them.
For a fork update, review source changes, regenerate its archive with
`npm pack ./vendor/<name> --pack-destination vendor/packages --ignore-scripts`,
update the source hash manifest and lockfile, then rerun security/regression/release
checks. Preserve provenance and do not exempt new advisories.

## Unused dependency review

Reviewed all 29 original application dependencies and 6 development dependencies
against source imports, dynamic imports, Expo configuration, native autolinking,
package scripts and build-tool requirements. No safely removable unused direct
dependency was found. The two newly added file dependencies provide enforced
security replacements for build tooling.

| Apparent no-import candidate | Verified use / reason retained |
| --- | --- |
| `@expo/metro-runtime` | Expo web/DOM and Metro runtime support; referenced by Expo's entry machinery |
| `expo-dev-client` | Development-device/simulator builds; native Podfile lock and development profiles |
| `expo-font` | Expo plugin and Nunito's `useFonts` loader |
| `react-dom`, `react-native-web` | Expo web renderer and Babel's platform import transformation |
| `@babel/core`, `babel-preset-expo` | Babel configuration and Expo/Metro transforms |
| `@types/react`, `typescript` | TypeScript compilation and React typings |
| `wrangler` | Worker development, dry-run and deployment commands |
| `react-native-purchases` | Existing subscription status and restoration through `billingClient.ts`; removing it would change that feature |
| `pdfjs-dist`, `tesseract.js` | Dynamic PDF/image extraction in the admin flyer importer |
| `@napi-rs/canvas` | Image-backfill and receipt backend smoke scripts |

Framer Motion, React Query, Zustand, Supabase, Base64 decoding, icons, SVG,
AsyncStorage, native permission/auth/notification modules and Maps all have active
source imports. No product feature was removed for the dependency cleanup.

## Initial dependency security validation

- Clean `npm ci`: passed; Metro patch and all fork integrity checks run automatically.
- `npm run release:native:check`: passed, including 444 tests, typecheck, lint,
  web export, native configuration and store assets. The existing store screenshot
  warning is unrelated to dependency security.
- iOS and Android Hermes exports: passed. These are bundle checks, not signed
  binaries or physical-device QA.
- Wrangler 4.147.0 Worker deployment dry-run: passed; no deployment was performed.
- Full `npm audit` (including dev dependencies): zero findings at every severity.
- `npm run audit:ci`: passed without advisory exceptions, after validating Metro
  and 181 source/installed fork files.
- Working/staged whitespace checks passed. Existing staged flyer changes were
  preserved. No commit, push or deployment was performed.

## Package and EAS stability validation — October 3

- Scripts reduced from 38 to 34; uncommon development/preview builds use the
  common pinned EAS entrypoint. Long test orchestration moved to a standalone file.
- Existing 31 direct application package versions are unchanged from the reviewed
  lockfile. EAS is an additional development dependency, included in the audit.
- Clean `npm ci`: passed, automatically applying both compatibility patches and
  verifying 181 source/installed fork files.
- `npm run release:native:check`: passed with 462 tests, typecheck, lint, web export,
  native configuration and basic store assets. The screenshot warning remains.
- Expo dependency check passed against its installed SDK dependency map. It ran
  offline and did not refresh Expo's remote recommended-version endpoint.
- Full `npm audit` including EAS: zero findings at every severity; `audit:ci` passed.
- Explicit store target validation and real EAS profile resolution/project generation
  passed without starting a build or submission. Build/submit help and version checks
  run against the installed CLI; `eas.json` and its devDependency must match.
- Local/CI Node and EAS runtime use 22.22.3. Direct versions must match root lockfile
  metadata. These invariants are part of release readiness checks.
- Git commit/push, remote CI, signed native/cloud builds and store submission were
  not performed. No production service was changed by this package review.
