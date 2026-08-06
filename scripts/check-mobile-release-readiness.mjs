import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const args = new Set(process.argv.slice(2));
const checkExternal = args.has("--external");

const requiredFiles = [
  "App.native.tsx",
  "app.config.js",
  "app.json",
  "eas.json",
  "package.json",
  "package-lock.json",
  ".easignore",
  ".github/workflows/mobile-release-check.yml",
  ".github/workflows/eas-build.yml",
  ".github/workflows/eas-submit.yml",
  ".github/workflows/supabase-functions.yml",
  ".github/workflows/sale-alert-sync.yml",
  ".github/workflows/live-user-flow.yml",
  ".github/workflows/supabase-schema.yml",
  "database/schema.sql",
  "docs/mobile-store-release.md",
  "src/components/nativeApp/NativeAccountTab.tsx",
  "src/components/nativeApp/NativeHomeTab.tsx",
  "src/components/nativeApp/NativeListTabs.tsx",
  "src/components/nativeApp/NativeMapTab.tsx",
  "src/hooks/useNativeAccount.ts",
  "src/hooks/useNativeAccountLinks.ts",
  "src/hooks/useNativeAuthActions.ts",
  "src/hooks/useNativeBackNavigation.ts",
  "src/hooks/useNativeCatalog.ts",
  "src/hooks/useNativePermissions.ts",
  "src/hooks/useNativeProductActions.ts",
  "src/hooks/useNativeProfileActions.ts",
  "src/hooks/useNativeSaleAlerts.ts",
  "src/hooks/useNativeShellState.ts",
  "src/hooks/useNativeShoppingPlan.ts",
  "src/hooks/useNativeStoreMap.ts",
  "scripts/print-mobile-release-setup-guide.mjs",
  "scripts/prepare-google-services.mjs",
  "scripts/check-store-submission-assets.mjs",
  "store-assets/README.md",
  "store-assets/metadata/en-US.json",
  "store-assets/google-play/feature-graphic.svg",
  "store-assets/google-play/feature-graphic.jpg",
  "store-assets/screenshots/README.md",
  "ios/PocketCart/Info.plist",
  "ios/PocketCart/PocketCartDebug.entitlements",
  "ios/PocketCart/PocketCart.entitlements",
  "ios/PocketCart/PrivacyInfo.xcprivacy",
  "android/app/build.gradle",
  "android/app/src/main/AndroidManifest.xml",
  "supabase/config.toml",
  "supabase/functions/delete-account/index.ts",
  "supabase/functions/delete-account-request/index.ts",
  "supabase/functions/delete-account-request/README.md",
  "supabase/functions/send-sale-alert-push/index.ts",
  "supabase/functions/sync-sale-alerts/index.ts",
  "supabase/functions/_shared/pushDelivery.ts",
  "supabase/functions/_shared/pushTickets.ts",
  "supabase/functions/_shared/saleAlertDeduplication.ts",
  "supabase/functions/_shared/saleAlertSelection.ts",
  "supabase/migrations/20260714055500_account_deletion_requests.sql",
  "supabase/migrations/20260714162000_profile_preferences.sql",
  "supabase/migrations/20260715043000_shopping_list_items.sql",
  "supabase/migrations/20260715130000_push_delivery_tickets.sql",
  "supabase/migrations/20260724050000_admin_user_directory.sql",
  "supabase/migrations/20260724060000_product_identity.sql",
  "supabase/migrations/20260724070000_product_identity_reviews.sql",
  "supabase/migrations/20260724080000_user_favorite_stores.sql",
  "supabase/migrations/20260724090000_product_identity_and_sale_period_guards.sql",
  "supabase/migrations/20260724100000_product_price_summary_rpc.sql",
  "supabase/migrations/20260724110000_product_identity_workflow.sql",
  "supabase/migrations/20260724120000_product_merge_watchlist_guard.sql",
  "supabase/migrations/20260803093000_admin_audit_logs.sql",
  "supabase/migrations/20260805120000_english_first_product_names.sql",
  "supabase/migrations/20260805233000_correct_swapped_product_names.sql",
];

const findings = [];

function pass(message) {
  findings.push({ level: "pass", message });
}

function fail(message) {
  findings.push({ level: "fail", message });
}

function warn(message) {
  findings.push({ level: "warn", message });
}

function read(path) {
  return readFileSync(path, "utf8");
}

function readJson(path) {
  return JSON.parse(read(path));
}

function includes(path, text, message) {
  if (read(path).includes(text)) {
    pass(message);
  } else {
    fail(`${message} (${path})`);
  }
}

function readAndroidTargetSdkFromManifest(path) {
  if (!existsSync(path)) return null;
  const match = read(path).match(/android:targetSdkVersion="(\d+)"/);
  return match ? Number(match[1]) : null;
}

function extractNamedBlock(source, name, fromIndex = 0) {
  const start = source.indexOf(`${name} {`, fromIndex);
  if (start === -1) return "";
  const open = source.indexOf("{", start);
  let depth = 0;

  for (let index = open; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(open + 1, index);
      }
    }
  }

  return "";
}

function commandOk(command, commandArgs) {
  try {
    execFileSync(command, commandArgs, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 8000,
    });
    return true;
  } catch {
    return false;
  }
}

function commandOutput(command, commandArgs) {
  try {
    return execFileSync(command, commandArgs, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 15000,
    });
  } catch {
    return null;
  }
}

function extractNamedItems(payload) {
  if (Array.isArray(payload)) {
    return payload
      .map((item) => (typeof item?.name === "string" ? item.name : null))
      .filter(Boolean);
  }

  if (payload && typeof payload === "object") {
    return Object.values(payload)
      .flatMap((value) => extractNamedItems(value));
  }

  return [];
}

function readJsonCommandNames(command, commandArgs) {
  const output = commandOutput(command, commandArgs);
  if (!output) return null;

  try {
    return new Set(extractNamedItems(JSON.parse(output)));
  } catch {
    return null;
  }
}

function readGithubSecretNames() {
  return readJsonCommandNames("gh", ["secret", "list", "--json", "name"]);
}

function readEasProductionEnvNames() {
  const output = commandOutput("npx", [
    "eas-cli",
    "env:list",
    "production",
    "--format",
    "long",
  ]);
  if (!output) return null;

  return new Set(output.match(/\b[A-Z][A-Z0-9_]{2,}\b/g) ?? []);
}

for (const file of requiredFiles) {
  if (existsSync(file)) {
    pass(`Required file exists: ${file}`);
  } else {
    fail(`Required file missing: ${file}`);
  }
}

const pkg = readJson("package.json");
const app = readJson("app.json").expo;
const eas = readJson("eas.json");
const nativeBuildProfiles = [
  "development",
  "development-device",
  "preview",
  "preview-simulator",
  "production",
];
if (
  eas.build?.base?.node === "22.22.3" &&
  nativeBuildProfiles.every((profile) => eas.build?.[profile]?.extends === "base")
) {
  pass("All EAS native build profiles use Node.js 22.22.3");
} else {
  fail("Every EAS native build profile must extend the Node.js 22.22.3 base profile");
}

if (pkg.version === app.version) {
  pass(`Package and Expo versions match: ${pkg.version}`);
} else {
  fail(`Package version ${pkg.version} does not match Expo version ${app.version}`);
}

if (app.version === "1.0.0") {
  pass("Release version is 1.0.0");
} else {
  fail(`Release version should be 1.0.0, found ${app.version}`);
}

if (app.scheme === "pocketcart") {
  pass("Deep link scheme is pocketcart");
} else {
  fail(`Unexpected app scheme: ${app.scheme}`);
}

if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(app.extra?.eas?.projectId ?? "")) {
  pass("Expo app is linked to an EAS project");
} else {
  fail("Expo app must include extra.eas.projectId from eas init/project link");
}

const expoLocationPlugin = Array.isArray(app.plugins)
  ? app.plugins.find((plugin) => Array.isArray(plugin) && plugin[0] === "expo-location")
  : null;
if (expoLocationPlugin) {
  pass("Expo location config plugin is configured for future native sync");
} else {
  fail("Expo location config plugin must be configured for future native sync");
}

if (app.ios?.bundleIdentifier === "com.pocketcart.app") {
  pass("iOS bundle identifier is com.pocketcart.app");
} else {
  fail(`Unexpected iOS bundle identifier: ${app.ios?.bundleIdentifier}`);
}

if (app.ios?.buildNumber === "1") {
  pass("iOS build number is 1");
} else {
  fail(`Unexpected iOS build number: ${app.ios?.buildNumber}`);
}

if (app.ios?.supportsTablet === false) {
  pass("iOS first release is scoped to iPhone only");
} else {
  fail("iOS supportsTablet should be false for the first phone-only release");
}

if (app.ios?.infoPlist?.ITSAppUsesNonExemptEncryption === false) {
  pass("iOS Expo config declares no non-exempt encryption");
} else {
  fail("iOS Expo config should set ITSAppUsesNonExemptEncryption to false");
}

const defaultIosKeychainGroup = "$(AppIdentifierPrefix)$(CFBundleIdentifier)";
if (app.ios?.entitlements?.["keychain-access-groups"]?.includes(defaultIosKeychainGroup)) {
  pass("iOS Expo config preserves the default Keychain access group");
} else {
  fail("iOS Expo config must preserve the default Keychain access group");
}

if (app.android?.package === "com.pocketcart.app") {
  pass("Android package is com.pocketcart.app");
} else {
  fail(`Unexpected Android package: ${app.android?.package}`);
}

if (Number.isInteger(app.android?.versionCode) && app.android.versionCode >= 1) {
  pass(`Android versionCode is ${app.android.versionCode}`);
} else {
  fail(`Android versionCode must be an integer greater than or equal to 1, found ${app.android?.versionCode}`);
}

includes(
  "android/app/build.gradle",
  "targetSdkVersion rootProject.ext.targetSdkVersion",
  "Android app target SDK follows React Native/Expo root target",
);
includes(
  "android/app/build.gradle",
  "require.resolve('hermes-compiler/package.json')",
  "Android release build uses the installed Hermes compiler package",
);
includes(
  "android/app/build.gradle",
  'buildConfigField "String", "REACT_NATIVE_RELEASE_LEVEL"',
  "Android release build defines the React Native release level",
);
const reactNativeTargetSdk = readAndroidTargetSdkFromManifest(
  "node_modules/react-native/ReactAndroid/src/main/AndroidManifest.xml",
);
if (reactNativeTargetSdk !== null && reactNativeTargetSdk >= 35) {
  pass(`Android target SDK baseline is Google Play compliant (${reactNativeTargetSdk})`);
} else {
  fail(`Android target SDK baseline must be 35 or higher, found ${reactNativeTargetSdk ?? "unknown"}`);
}

if (pkg.dependencies?.["expo-location"]) {
  pass("expo-location dependency is installed for native foreground location");
} else {
  fail("expo-location dependency is required for native foreground location");
}

if (eas.build?.production?.android?.buildType === "app-bundle") {
  pass("Production Android EAS build creates an app bundle");
} else {
  fail("Production Android EAS build must use app-bundle");
}

if (eas.build?.production?.autoIncrement === true) {
  pass("Production EAS builds auto-increment store build numbers");
} else {
  warn("Production EAS autoIncrement is not enabled");
}

if (eas.build?.production?.environment === "production") {
  pass("Production EAS builds use the production environment");
} else {
  fail("Production EAS builds must use the production environment");
}

if (
  eas.build?.["preview-simulator"]?.environment === "production" &&
  eas.build?.["preview-simulator"]?.distribution === "internal" &&
  eas.build?.["preview-simulator"]?.ios?.simulator === true
) {
  pass("iOS simulator preview creates an internally distributed standalone artifact");
} else {
  fail("iOS simulator preview profile is not configured for internal testing");
}

if (eas.submit?.production) {
  pass("Production EAS submit profile is configured");
} else {
  fail("Production EAS submit profile is required for non-interactive store submission");
}

if (eas.submit?.production?.ios && typeof eas.submit.production.ios === "object") {
  pass("Production iOS submit profile is configured");
} else {
  fail("Production iOS submit profile is required for App Store submission");
}

if (eas.submit?.production?.android && typeof eas.submit.production.android === "object") {
  pass("Production Android submit profile is configured");
} else {
  fail("Production Android submit profile is required for Google Play submission");
}

if (eas.submit?.production?.android?.track === "internal") {
  pass("Production Android submit profile targets the internal track first");
} else {
  warn("Production Android submit profile should target the internal track for first review uploads");
}

if (pkg.expo?.doctor?.appConfigFieldsNotSyncedCheck?.enabled === false) {
  pass("Expo doctor app-config sync warning is disabled for this manually synced native project");
} else {
  warn("Expo doctor app-config sync warning is not explicitly configured for this native project");
}

includes(
  "ios/PocketCart/Info.plist",
  "NSLocationWhenInUseUsageDescription",
  "iOS location permission usage description is present",
);
includes(
  "ios/PocketCart/Info.plist",
  "ITSAppUsesNonExemptEncryption",
  "iOS native project declares export compliance encryption setting",
);
includes("ios/PocketCart/Info.plist", "<string>pocketcart</string>", "iOS pocketcart URL scheme is present");
includes(
  "ios/PocketCart/PocketCartDebug.entitlements",
  "<key>aps-environment</key>",
  "iOS Debug entitlements declare APNs access",
);
includes(
  "ios/PocketCart/PocketCartDebug.entitlements",
  "$(APS_ENVIRONMENT)",
  "iOS Debug APNs entitlement follows its build configuration",
);
includes(
  "ios/PocketCart/PocketCartDebug.entitlements",
  "<key>keychain-access-groups</key>",
  "iOS Debug entitlements declare Keychain access groups",
);
includes(
  "ios/PocketCart/PocketCartDebug.entitlements",
  defaultIosKeychainGroup,
  "iOS Debug entitlements preserve the default Keychain access group",
);
if (read("ios/PocketCart/PocketCartDebug.entitlements").includes("com.apple.developer.applesignin")) {
  fail("iOS Debug entitlements must omit Sign in with Apple for email-auth device testing");
} else {
  pass("iOS Debug entitlements omit Sign in with Apple for email-auth device testing");
}
includes(
  "ios/PocketCart/PocketCart.entitlements",
  "<key>aps-environment</key>",
  "iOS Release entitlements declare APNs access",
);
includes(
  "ios/PocketCart/PocketCart.entitlements",
  "$(APS_ENVIRONMENT)",
  "iOS Release APNs entitlement follows its build configuration",
);
includes(
  "ios/PocketCart/PocketCart.entitlements",
  "<key>keychain-access-groups</key>",
  "iOS native entitlements declare Keychain access groups",
);
includes(
  "ios/PocketCart/PocketCart.entitlements",
  defaultIosKeychainGroup,
  "iOS native entitlements preserve the default Keychain access group",
);
includes(
  "ios/PocketCart/PocketCart.entitlements",
  "com.apple.developer.applesignin",
  "iOS Release entitlements preserve Sign in with Apple",
);
const xcodeProject = read("ios/PocketCart.xcodeproj/project.pbxproj");
const targetDebugConfiguration = xcodeProject.match(
  /\/\* Debug \*\/ = \{[\s\S]*?PRODUCT_BUNDLE_IDENTIFIER = com\.pocketcart\.app;[\s\S]*?name = Debug;/,
)?.[0] ?? "";
const targetReleaseConfiguration = xcodeProject.match(
  /\/\* Release \*\/ = \{[\s\S]*?PRODUCT_BUNDLE_IDENTIFIER = com\.pocketcart\.app;[\s\S]*?name = Release;/,
)?.[0] ?? "";
if (targetDebugConfiguration.includes("CODE_SIGN_ENTITLEMENTS = PocketCart/PocketCartDebug.entitlements;")) {
  pass("iOS Debug builds use the development entitlement set");
} else {
  fail("iOS Debug builds must use PocketCartDebug.entitlements");
}
if (targetDebugConfiguration.includes("APS_ENVIRONMENT = development;")) {
  pass("iOS Debug builds request the APNs development environment");
} else {
  fail("iOS Debug builds must set APS_ENVIRONMENT to development");
}
if (targetReleaseConfiguration.includes("CODE_SIGN_ENTITLEMENTS = PocketCart/PocketCart.entitlements;")) {
  pass("iOS Release builds use the store entitlement set");
} else {
  fail("iOS Release builds must use PocketCart.entitlements");
}
if (targetReleaseConfiguration.includes("APS_ENVIRONMENT = production;")) {
  pass("iOS Release builds request the APNs production environment");
} else {
  fail("iOS Release builds must set APS_ENVIRONMENT to production");
}
const targetBuildConfigurationList = xcodeProject.match(
  /Build configuration list for PBXNativeTarget "PocketCart" \*\/ = \{[\s\S]*?\n\t\t\};/,
)?.[0] ?? "";
if (
  targetBuildConfigurationList.indexOf("/* Release */") >= 0 &&
  targetBuildConfigurationList.indexOf("/* Release */") <
    targetBuildConfigurationList.indexOf("/* Debug */")
) {
  pass("Expo autolinking prioritizes the Release entitlement set");
} else {
  fail("PocketCart target must list Release before Debug for Expo entitlement discovery");
}
includes(
  "ios/PocketCart.xcodeproj/project.pbxproj",
  '"$(SRCROOT)/PocketCart/PocketCart.entitlements"',
  "Expo configure-project phase tracks the Release entitlement set",
);
includes(
  "ios/PocketCart/PrivacyInfo.xcprivacy",
  "NSPrivacyCollectedDataTypeEmailAddress",
  "iOS privacy manifest declares email address collection",
);
includes(
  "ios/PocketCart/PrivacyInfo.xcprivacy",
  "NSPrivacyCollectedDataTypePreciseLocation",
  "iOS privacy manifest declares optional precise location use",
);
includes(
  "ios/PocketCart/PrivacyInfo.xcprivacy",
  "NSPrivacyCollectedDataTypeCoarseLocation",
  "iOS privacy manifest declares optional coarse location use",
);
includes(
  "ios/PocketCart/PrivacyInfo.xcprivacy",
  "NSPrivacyAccessedAPICategoryFileTimestamp",
  "iOS privacy manifest declares file timestamp required-reason API use",
);
includes(
  "ios/PocketCart/PrivacyInfo.xcprivacy",
  "C617.1",
  "iOS privacy manifest declares file timestamp reason",
);
includes(
  "ios/PocketCart/PrivacyInfo.xcprivacy",
  "NSPrivacyAccessedAPICategoryUserDefaults",
  "iOS privacy manifest declares UserDefaults required-reason API use",
);
includes(
  "ios/PocketCart/PrivacyInfo.xcprivacy",
  "CA92.1",
  "iOS privacy manifest declares UserDefaults reason",
);
includes(
  "ios/PocketCart/PrivacyInfo.xcprivacy",
  "NSPrivacyAccessedAPICategorySystemBootTime",
  "iOS privacy manifest declares system boot time required-reason API use",
);
includes(
  "ios/PocketCart/PrivacyInfo.xcprivacy",
  "35F9.1",
  "iOS privacy manifest declares system boot time reason",
);
includes(
  "android/app/src/main/AndroidManifest.xml",
  "android.permission.ACCESS_FINE_LOCATION",
  "Android location permission is declared",
);
if (read("android/app/src/main/AndroidManifest.xml").includes("android.permission.VIBRATE")) {
  fail("Android VIBRATE permission should not be declared until native vibration or push features exist");
} else {
  pass("Android VIBRATE permission is not declared");
}
if (read("ios/PocketCart.xcodeproj/project.pbxproj").includes("TARGETED_DEVICE_FAMILY = 1;")) {
  pass("iOS native project targets iPhone only");
} else {
  fail("iOS native project should target iPhone only for this release");
}
includes(
  "src/services/nativePermissions.ts",
  "Location.requestForegroundPermissionsAsync",
  "Native location permission uses expo-location",
);
includes(
  "src/services/nativePermissions.ts",
  "Location.getCurrentPositionAsync",
  "Native current position uses expo-location",
);
includes(
  "App.native.tsx",
  "NativeAppScreen",
  "Native app entry renders the native app screen",
);
if (read("App.native.tsx").includes("AdminScreen") || read("App.native.tsx").includes("pdfjs-dist")) {
  fail("Native app entry must not import web admin or PDF extraction modules");
} else {
  pass("Native app entry excludes web admin and PDF extraction modules");
}
includes(
  "android/app/src/main/AndroidManifest.xml",
  "com.google.android.geo.API_KEY",
  "Android Google Maps API key metadata is present",
);
includes(
  "android/app/src/main/AndroidManifest.xml",
  '<data android:scheme="pocketcart"/>',
  "Android pocketcart deep link scheme is present",
);

const gradle = read("android/app/build.gradle");
const buildTypesBlock = extractNamedBlock(gradle, "buildTypes");
const releaseBuildTypeBlock = extractNamedBlock(buildTypesBlock, "release");
if (!releaseBuildTypeBlock) {
  fail("Android release buildType block is missing");
} else if (releaseBuildTypeBlock.includes("signingConfig signingConfigs.debug")) {
  fail("Android release build must not use debug signing config");
} else {
  pass("Android release build does not use debug signing config");
}
includes(
  "android/app/build.gradle",
  "POCKETCART_GOOGLE_MAPS_ANDROID_API_KEY is required for Android release builds.",
  "Android release build requires Google Maps API key",
);
includes(
  "src/components/nativeApp/MorePanel.tsx",
  "Delete your account?",
  "Native More tab includes in-app account deletion confirmation",
);
includes(
  "src/services/userProfile.ts",
  "completeAuthSessionFromUrl",
  "Native auth service can complete email verification callbacks",
);
includes(
  "src/services/userProfile.ts",
  "exchangeCodeForSession",
  "Native auth service supports PKCE email callback codes",
);
includes(
  "src/services/userProfile.ts",
  "setSession",
  "Native auth service supports implicit email callback tokens",
);
includes(
  "src/hooks/useNativeAccountLinks.ts",
  "Linking.getInitialURL",
  "Native app handles auth callback cold starts",
);
includes(
  "src/hooks/useNativeAccountLinks.ts",
  'Linking.addEventListener("url"',
  "Native app handles auth callback while running",
);
includes(
  "supabase/config.toml",
  "[functions.delete-account]",
  "Supabase delete-account function is configured",
);
includes(
  "supabase/config.toml",
  "[functions.delete-account-request]",
  "Supabase delete-account-request function is configured",
);
includes(
  "supabase/config.toml",
  "[functions.send-sale-alert-push]",
  "Supabase send-sale-alert-push function is configured",
);
includes(
  "supabase/config.toml",
  "[functions.sync-sale-alerts]",
  "Supabase sync-sale-alerts function is configured",
);
includes(
  "supabase/functions/delete-account/index.ts",
  "auth.admin.deleteUser",
  "Supabase delete-account function deletes the authenticated user",
);
includes(
  "supabase/functions/delete-account-request/index.ts",
  "account_deletion_requests",
  "Supabase delete-account-request function stores web deletion requests",
);
includes(
  "database/schema.sql",
  "create table if not exists public.account_deletion_requests",
  "Supabase schema includes account deletion request table",
);
includes(
  "database/schema.sql",
  "create table if not exists public.user_push_tokens",
  "Supabase schema includes push token table",
);
includes(
  "database/schema.sql",
  "create table if not exists public.sale_alerts",
  "Supabase schema includes sale alert table",
);
includes(
  "database/schema.sql",
  "create table if not exists public.push_delivery_tickets",
  "Supabase schema includes push delivery receipt tracking",
);
includes(
  "database/schema.sql",
  "create table if not exists public.shopping_list_items",
  "Supabase schema includes shopping list sync table",
);
includes(
  "database/schema.sql",
  "create or replace function public.admin_list_users()",
  "Supabase schema includes the admin user directory function",
);
includes(
  "database/schema.sql",
  "if not public.is_admin() then",
  "Admin user directory enforces server-side admin access",
);
includes(
  "database/schema.sql",
  "revoke all on function public.admin_list_users() from public, anon",
  "Admin user directory revokes anonymous and public execution",
);
includes(
  "database/schema.sql",
  "create trigger on_auth_user_created_profile",
  "Supabase schema creates profiles from auth users",
);
includes(
  "database/schema.sql",
  "add column if not exists product_id uuid references public.products",
  "Supabase schema links watchlist items to products",
);
includes(
  "database/schema.sql",
  "add column if not exists valid_from timestamptz",
  "Supabase schema includes product price validity windows",
);
includes(
  "database/schema.sql",
  "add column if not exists gtin text",
  "Supabase schema includes stable product identity columns",
);
includes(
  "database/schema.sql",
  "korean_name text not null",
  "Supabase schema names the Korean product field explicitly",
);
includes(
  "supabase/migrations/20260805120000_english_first_product_names.sql",
  "alter table public.products rename column name to korean_name",
  "Supabase migration preserves product data while renaming the Korean field",
);
includes(
  "supabase/migrations/20260805233000_correct_swapped_product_names.sql",
  "korean_name = english_name",
  "Supabase migration corrects swapped English and Korean product names",
);
includes(
  "database/schema.sql",
  "create table if not exists public.product_identity_reviews",
  "Supabase schema includes the product identity review queue",
);
includes(
  "database/schema.sql",
  "create table if not exists public.user_favorite_stores",
  "Supabase schema includes My stores account sync",
);
includes(
  "database/schema.sql",
  "product_prices_product_store_sale_period_key",
  "Supabase schema distinguishes complete sale periods",
);
includes(
  "database/schema.sql",
  "create or replace function public.is_valid_gtin",
  "Supabase schema validates GTIN length and check digit",
);
includes(
  "database/schema.sql",
  "create or replace function public.list_product_price_summaries",
  "Supabase schema computes current price summaries server-side",
);
includes(
  "database/schema.sql",
  "create or replace function public.merge_products",
  "Supabase schema supports transactional product merges",
);
includes(
  "database/schema.sql",
  "watchlist_items_user_product_unique",
  "Supabase schema prevents duplicate linked watchlist products",
);
includes(
  "supabase/migrations/20260724120000_product_merge_watchlist_guard.sql",
  "on conflict (user_id, product_id)",
  "Product merges consolidate duplicate watchlist products",
);
includes(
  "database/schema.sql",
  "insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)",
  "Supabase schema provisions product image storage bucket",
);
includes(
  "src/screens/DeleteAccountScreen.tsx",
  "submitAccountDeletionRequest",
  "Web delete-account page submits deletion requests",
);
includes(
  "docs/mobile-store-release.md",
  "Google Play Console app created",
  "Mobile store release checklist includes Google Play setup",
);
includes(
  "docs/mobile-store-release.md",
  "App Store Connect app created",
  "Mobile store release checklist includes App Store setup",
);
includes(
  "docs/mobile-store-release.md",
  "npx eas-cli credentials:configure-build --platform ios --profile production",
  "Mobile store release checklist documents iOS build credential configuration",
);
includes(
  "docs/mobile-store-release.md",
  "npx eas-cli credentials --platform ios",
  "Mobile store release checklist documents iOS EAS credential setup",
);
includes(
  "docs/mobile-store-release.md",
  "Distribution Certificate is not validated for non-interactive builds",
  "Mobile store release checklist documents the iOS certificate validation blocker",
);
includes(
  "docs/mobile-store-release.md",
  "npx eas-cli credentials --platform android",
  "Mobile store release checklist documents Android EAS credential setup",
);
includes(
  "docs/mobile-store-release.md",
  "Required EAS `production` environment variables",
  "Mobile store release checklist documents EAS production env vars",
);
includes(
  "docs/mobile-store-release.md",
  "gh secret set EXPO_TOKEN",
  "Mobile store release checklist documents GitHub secret setup",
);
includes(
  ".github/workflows/mobile-release-check.yml",
  "npm run release:native:check",
  "GitHub Actions runs the mobile release readiness check",
);
includes(
  ".github/workflows/mobile-release-check.yml",
  "npm run audit:ci",
  "GitHub Actions blocks high severity dependency audit failures",
);
includes(
  ".github/workflows/eas-build.yml",
  "secrets.EXPO_TOKEN",
  "EAS build workflow uses an Expo token secret",
);
includes(
  ".github/workflows/eas-build.yml",
  "Missing GitHub secret: EXPO_TOKEN",
  "EAS build workflow fails clearly when EXPO_TOKEN is missing",
);
includes(
  ".github/workflows/eas-build.yml",
  "npm run release:native:check",
  "EAS build workflow runs the full release readiness check",
);
includes(
  ".github/workflows/eas-build.yml",
  "Validate EAS production environment",
  "EAS build workflow validates production environment variables before building",
);
includes(
  ".github/workflows/eas-build.yml",
  "Missing EAS production env: POCKETCART_GOOGLE_MAPS_ANDROID_API_KEY",
  "EAS build workflow validates the Android Maps key before building",
);
includes(
  ".github/workflows/eas-build.yml",
  "inputs.platform == 'android' || inputs.platform == 'all'",
  "EAS build workflow scopes Android-only release secrets to Android artifacts",
);
includes(
  ".github/workflows/eas-build.yml",
  "eas-cli build",
  "EAS build workflow can create native artifacts",
);
includes(
  ".github/workflows/eas-build.yml",
  "timeout-minutes: 120",
  "EAS build workflow allows enough time for store artifacts",
);
if (read(".github/workflows/eas-build.yml").includes("--no-wait")) {
  fail("EAS build workflow must wait for native artifact completion");
} else {
  pass("EAS build workflow waits for native artifact completion");
}
includes(
  ".github/workflows/eas-submit.yml",
  "eas-cli submit",
  "EAS submit workflow can submit latest native artifacts",
);
if (eas.submit?.production) {
  pass("EAS submit workflow has a matching production submit profile");
} else {
  fail("EAS submit workflow references production but eas.json has no matching submit profile");
}
includes(
  ".github/workflows/eas-submit.yml",
  "Missing GitHub secret: EXPO_TOKEN",
  "EAS submit workflow fails clearly when EXPO_TOKEN is missing",
);
includes(
  ".github/workflows/eas-submit.yml",
  "--latest --non-interactive",
  "EAS submit workflow runs non-interactively against the latest artifact",
);
includes(
  ".github/workflows/eas-submit.yml",
  "npm run release:store-assets:live-check",
  "EAS submit workflow verifies live legal and support URLs",
);
includes(
  ".github/workflows/eas-submit.yml",
  "Validate EAS production environment",
  "EAS submit workflow validates production environment variables before submission",
);
includes(
  ".github/workflows/eas-submit.yml",
  "if: ${{ inputs.platform == 'android' }}",
  "EAS submit workflow does not require Android-only settings for iOS submission",
);
includes(
  ".github/workflows/supabase-functions.yml",
  "supabase functions deploy delete-account",
  "Supabase workflow deploys the account deletion function",
);
includes(
  ".github/workflows/supabase-functions.yml",
  "supabase functions deploy delete-account-request",
  "Supabase workflow deploys the account deletion request function",
);
includes(
  ".github/workflows/supabase-functions.yml",
  "supabase functions deploy send-sale-alert-push",
  "Supabase workflow deploys the sale alert push function",
);
includes(
  ".github/workflows/supabase-functions.yml",
  "supabase functions deploy sync-sale-alerts",
  "Supabase workflow deploys the sale alert sync function",
);
includes(
  ".github/workflows/supabase-functions.yml",
  "PUSH_FUNCTION_SECRET",
  "Supabase workflow sets the push function secret",
);
includes(
  ".github/workflows/sale-alert-sync.yml",
  "schedule:",
  "Sale alert workflow runs on a schedule",
);
includes(
  ".github/workflows/sale-alert-sync.yml",
  "sync-sale-alerts",
  "Sale alert workflow invokes the sync function",
);
includes(
  ".github/workflows/sale-alert-sync.yml",
  "PUSH_FUNCTION_SECRET",
  "Sale alert workflow authenticates with the push function secret",
);
includes(
  "supabase/functions/send-sale-alert-push/index.ts",
  "deliverPushAlerts",
  "Sale alert push function uses shared Expo delivery",
);
includes(
  "supabase/functions/sync-sale-alerts/index.ts",
  "reconcilePushReceipts",
  "Sale alert sync function uses shared receipt reconciliation",
);
includes(
  "supabase/functions/sync-sale-alerts/index.ts",
  "selectSaleAlertPrices",
  "Sale alert sync function applies explicit and favorite store selection",
);
includes(
  "supabase/functions/sync-sale-alerts/index.ts",
  "dedupeSaleAlertPayloads",
  "Sale alert sync function deduplicates alert keys before insert",
);
includes(
  "supabase/functions/_shared/pushDelivery.ts",
  "push_delivery_tickets",
  "Shared Expo delivery stores receipt tickets",
);
includes(
  "supabase/functions/_shared/pushDelivery.ts",
  "push/getReceipts",
  "Shared Expo delivery checks delivery receipts",
);
includes(
  ".github/workflows/live-user-flow.yml",
  "LIVE USER FLOW E2E PASSED",
  "Live E2E workflow covers the disposable user journey",
);
includes(
  ".github/workflows/live-user-flow.yml",
  "/functions/v1/delete-account",
  "Live E2E workflow verifies authenticated account deletion",
);
includes(
  ".github/workflows/live-user-flow.yml",
  "/rest/v1/shopping_list_items",
  "Live E2E workflow verifies shopping list account sync",
);
includes(
  ".github/workflows/supabase-schema.yml",
  "/database/query",
  "Supabase schema workflow applies the account deletion migration",
);
includes(
  ".github/workflows/supabase-schema.yml",
  "20260714162000_profile_preferences.sql",
  "Supabase schema workflow applies the profile preferences migration",
);
includes(
  ".github/workflows/supabase-schema.yml",
  "20260715043000_shopping_list_items.sql",
  "Supabase schema workflow applies the shopping list migration",
);
includes(
  ".github/workflows/supabase-schema.yml",
  "20260715130000_push_delivery_tickets.sql",
  "Supabase schema workflow applies the push delivery receipt migration",
);
includes(
  ".github/workflows/supabase-schema.yml",
  "20260724050000_admin_user_directory.sql",
  "Supabase schema workflow applies the admin user directory migration",
);
includes(
  ".github/workflows/supabase-schema.yml",
  "20260724060000_product_identity.sql",
  "Supabase schema workflow applies the product identity migration",
);
includes(
  ".github/workflows/supabase-schema.yml",
  "20260724070000_product_identity_reviews.sql",
  "Supabase schema workflow applies the identity review queue migration",
);
includes(
  ".github/workflows/supabase-schema.yml",
  "20260724080000_user_favorite_stores.sql",
  "Supabase schema workflow applies the My stores migration",
);
includes(
  ".github/workflows/supabase-schema.yml",
  "20260724090000_product_identity_and_sale_period_guards.sql",
  "Supabase schema workflow applies sale period and GTIN guards",
);
includes(
  ".github/workflows/supabase-schema.yml",
  "20260724100000_product_price_summary_rpc.sql",
  "Supabase schema workflow applies the product price summary RPC",
);
includes(
  ".github/workflows/supabase-schema.yml",
  "20260724110000_product_identity_workflow.sql",
  "Supabase schema workflow applies the product identity workflow",
);
includes(
  ".github/workflows/supabase-schema.yml",
  "20260724120000_product_merge_watchlist_guard.sql",
  "Supabase schema workflow applies the product merge watchlist guard",
);
includes(
  ".github/workflows/supabase-schema.yml",
  "20260803093000_admin_audit_logs.sql",
  "Supabase schema workflow applies the admin audit logs migration",
);
includes(
  ".github/workflows/supabase-schema.yml",
  "20260805120000_english_first_product_names.sql",
  "Supabase schema workflow applies the English-first product names migration",
);
includes(
  ".github/workflows/supabase-schema.yml",
  "20260805233000_correct_swapped_product_names.sql",
  "Supabase schema workflow applies the product language correction migration",
);
includes(
  ".gitignore",
  "google-services.json",
  "Git ignore excludes Firebase platform configuration files",
);
includes(
  ".gitignore",
  "*firebase-adminsdk*.json",
  "Git ignore excludes Firebase Admin service account files",
);
includes(
  ".gitignore",
  "*.keystore",
  "Git ignore excludes local Android signing keys",
);
includes(
  ".easignore",
  "*.jks",
  "EAS ignore excludes local Android keystores",
);
includes(
  ".easignore",
  "*firebase-adminsdk*.json",
  "EAS ignore excludes Firebase Admin service account files",
);
includes(
  ".easignore",
  "credentials.json",
  "EAS ignore excludes downloaded EAS credential bundles",
);
includes(
  ".easignore",
  "google-services.json",
  "EAS ignore excludes the local Android Firebase config",
);
includes(
  ".easignore",
  "GoogleService-Info.plist",
  "EAS ignore excludes local platform service config files",
);
includes(
  "package.json",
  "eas-build-post-install",
  "Package scripts prepare the ignored Firebase config during EAS builds",
);
includes(
  "scripts/prepare-google-services.mjs",
  "GOOGLE_SERVICES_JSON",
  "EAS build hook consumes the Firebase secret-file environment variable",
);
includes(
  "package.json",
  "release:store-assets:check",
  "Package scripts include the store asset validator",
);
includes(
  "package.json",
  "release:native:setup-guide",
  "Package scripts include the mobile release setup guide",
);
includes(
  "docs/mobile-store-release.md",
  "npm run release:native:setup-guide",
  "Mobile store release checklist references the setup guide",
);
includes(
  "scripts/print-mobile-release-setup-guide.mjs",
  "npx eas-cli credentials:configure-build --platform ios --profile production",
  "Mobile release setup guide prints iOS build credential configuration command",
);
includes(
  "scripts/print-mobile-release-setup-guide.mjs",
  "npx eas-cli credentials --platform ios",
  "Mobile release setup guide prints iOS credential setup command",
);
includes(
  "scripts/print-mobile-release-setup-guide.mjs",
  "npx eas-cli credentials --platform android",
  "Mobile release setup guide prints Android credential setup command",
);
includes(
  "store-assets/metadata/en-US.json",
  "accountDeletionUrl",
  "Store metadata includes account deletion URL",
);
includes(
  "store-assets/screenshots/README.md",
  "real device or simulator captures",
  "Store screenshot plan requires real app captures",
);

const secretPattern =
  /(BEGIN PRIVATE KEY|sk_[A-Za-z0-9_]{10,}|AIza[0-9A-Za-z_-]{20,}|SUPABASE_SERVICE_ROLE_KEY=(?!["']?\$)[^\s<.]|POCKETCART_UPLOAD_STORE_PASSWORD=(?!["']?\$)[^\s.]|POCKETCART_UPLOAD_KEY_PASSWORD=(?!["']?\$)[^\s.])/;
const filesToScan = [
  ".env.example",
  ".github/workflows/eas-build.yml",
  ".github/workflows/eas-submit.yml",
  ".github/workflows/mobile-release-check.yml",
  ".github/workflows/supabase-functions.yml",
  "app.config.js",
  "app.json",
  "eas.json",
  "package.json",
  "docs/mobile-store-release.md",
  "store-assets/metadata/en-US.json",
  "store-assets/README.md",
  "store-assets/screenshots/README.md",
  "supabase/functions/delete-account/README.md",
  "supabase/functions/delete-account-request/README.md",
  "supabase/functions/back-office-flyer/README.md",
];

for (const file of filesToScan) {
  if (secretPattern.test(read(file))) {
    fail(`Potential real secret pattern found in ${file}`);
  }
}
pass("No obvious real secret values found in release metadata files");

if (checkExternal) {
  const githubSecretNames = readGithubSecretNames();
  const easProductionEnvNames = readEasProductionEnvNames();

  if (process.env.EXPO_TOKEN || githubSecretNames?.has("EXPO_TOKEN") || commandOk("npx", ["eas-cli", "whoami"])) {
    pass("Expo authentication is available through EXPO_TOKEN, GitHub secret, or EAS CLI login");
  } else {
    fail("Expo authentication is missing. Set EXPO_TOKEN for CI or run: npx eas-cli login");
  }

  if (process.env.SUPABASE_ACCESS_TOKEN || githubSecretNames?.has("SUPABASE_ACCESS_TOKEN") || commandOk("supabase", ["projects", "list"])) {
    pass("Supabase authentication is available through SUPABASE_ACCESS_TOKEN, GitHub secret, or CLI login");
  } else {
    fail("Supabase authentication is missing. Set SUPABASE_ACCESS_TOKEN for CI or install Supabase CLI and run: supabase login");
  }

  const requiredGithubSecrets = [
    "EXPO_TOKEN",
    "SUPABASE_ACCESS_TOKEN",
    "SUPABASE_PROJECT_ID",
    "SUPABASE_SERVICE_ROLE_KEY",
    "PUSH_FUNCTION_SECRET",
  ];
  if (!githubSecretNames) {
    fail("Unable to verify GitHub repository secrets. Run: gh auth login");
  } else {
    for (const secretName of requiredGithubSecrets) {
      if (githubSecretNames.has(secretName)) {
        pass(`GitHub secret is configured: ${secretName}`);
      } else {
        fail(`GitHub secret is missing: ${secretName}`);
      }
    }
  }

  if (process.env.SUPABASE_PROJECT_ID || githubSecretNames?.has("SUPABASE_PROJECT_ID")) {
    pass("SUPABASE_PROJECT_ID is present for CI function deploys");
  } else {
    fail("SUPABASE_PROJECT_ID is not set for CI function deploys");
  }

  if (process.env.POCKETCART_GOOGLE_MAPS_ANDROID_API_KEY || easProductionEnvNames?.has("POCKETCART_GOOGLE_MAPS_ANDROID_API_KEY")) {
    pass("Android Google Maps API key is present for production builds");
  } else {
    fail("POCKETCART_GOOGLE_MAPS_ANDROID_API_KEY is not set");
  }

  const requiredEasPublicEnv = [
    "EXPO_PUBLIC_SUPABASE_URL",
    "EXPO_PUBLIC_SUPABASE_ANON_KEY",
    "EXPO_PUBLIC_AUTH_REDIRECT_URL",
    "GOOGLE_SERVICES_JSON",
  ];
  if (!easProductionEnvNames) {
    fail("Unable to verify EAS production environment variables. Run: npx eas-cli login");
  }
  for (const envName of requiredEasPublicEnv) {
    if (process.env[envName]?.trim() || easProductionEnvNames?.has(envName)) {
      pass(`${envName} is present for production EAS builds`);
    } else {
      fail(`${envName} is not set for production EAS builds`);
    }
  }

  if (process.env.EXPO_PUBLIC_SUPABASE_PRODUCT_IMAGE_BUCKET?.trim() || easProductionEnvNames?.has("EXPO_PUBLIC_SUPABASE_PRODUCT_IMAGE_BUCKET")) {
    pass("EXPO_PUBLIC_SUPABASE_PRODUCT_IMAGE_BUCKET is present for production EAS builds");
  } else {
    warn("EXPO_PUBLIC_SUPABASE_PRODUCT_IMAGE_BUCKET is not set; app will use the product-images default");
  }
}

const failed = findings.filter((item) => item.level === "fail");
const warnings = findings.filter((item) => item.level === "warn");

for (const item of findings) {
  const marker = item.level === "pass" ? "PASS" : item.level === "warn" ? "WARN" : "FAIL";
  console.log(`${marker}: ${item.message}`);
}

if (warnings.length > 0) {
  console.log(`\n${warnings.length} warning(s).`);
}

if (failed.length > 0) {
  console.error(`\n${failed.length} release readiness check(s) failed.`);
  process.exit(1);
}

console.log("\nMobile release readiness checks passed.");
