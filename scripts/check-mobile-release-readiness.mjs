import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const args = new Set(process.argv.slice(2));
const checkExternal = args.has("--external");

const requiredFiles = [
  "app.json",
  "eas.json",
  "package.json",
  "package-lock.json",
  ".easignore",
  ".github/workflows/mobile-release-check.yml",
  ".github/workflows/eas-build.yml",
  ".github/workflows/eas-submit.yml",
  ".github/workflows/supabase-functions.yml",
  "docs/mobile-store-release.md",
  "scripts/check-store-submission-assets.mjs",
  "store-assets/README.md",
  "store-assets/metadata/en-US.json",
  "store-assets/google-play/feature-graphic.svg",
  "store-assets/google-play/feature-graphic.jpg",
  "store-assets/screenshots/README.md",
  "ios/PocketCart/Info.plist",
  "ios/PocketCart/PrivacyInfo.xcprivacy",
  "android/app/build.gradle",
  "android/app/src/main/AndroidManifest.xml",
  "supabase/config.toml",
  "supabase/functions/delete-account/index.ts",
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

if (app.android?.package === "com.pocketcart.app") {
  pass("Android package is com.pocketcart.app");
} else {
  fail(`Unexpected Android package: ${app.android?.package}`);
}

if (app.android?.versionCode === 1) {
  pass("Android versionCode is 1");
} else {
  fail(`Unexpected Android versionCode: ${app.android?.versionCode}`);
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
includes("ios/PocketCart/Info.plist", "<string>pocketcart</string>", "iOS pocketcart URL scheme is present");
includes(
  "ios/PocketCart/PrivacyInfo.xcprivacy",
  "NSPrivacyCollectedDataTypeEmailAddress",
  "iOS privacy manifest declares email address collection",
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
  "Confirm Delete",
  "Native More tab includes in-app account deletion confirmation",
);
includes(
  "supabase/config.toml",
  "[functions.delete-account]",
  "Supabase delete-account function is configured",
);
includes(
  "supabase/functions/delete-account/index.ts",
  "auth.admin.deleteUser",
  "Supabase delete-account function deletes the authenticated user",
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
  ".github/workflows/mobile-release-check.yml",
  "npm run release:native:check",
  "GitHub Actions runs the mobile release readiness check",
);
includes(
  ".github/workflows/mobile-release-check.yml",
  "npm audit --audit-level=high",
  "GitHub Actions blocks high severity dependency audit failures",
);
includes(
  ".github/workflows/eas-build.yml",
  "secrets.EXPO_TOKEN",
  "EAS build workflow uses an Expo token secret",
);
includes(
  ".github/workflows/eas-build.yml",
  "eas-cli build",
  "EAS build workflow can create native artifacts",
);
includes(
  ".github/workflows/eas-submit.yml",
  "eas-cli submit",
  "EAS submit workflow can submit latest native artifacts",
);
includes(
  ".github/workflows/eas-submit.yml",
  "--latest --non-interactive",
  "EAS submit workflow runs non-interactively against the latest artifact",
);
includes(
  ".github/workflows/supabase-functions.yml",
  "supabase functions deploy delete-account",
  "Supabase workflow deploys the account deletion function",
);
includes(
  ".github/workflows/supabase-functions.yml",
  "SUPABASE_SERVICE_ROLE_KEY",
  "Supabase workflow sets the delete-account service role secret",
);
includes(
  ".easignore",
  "*.jks",
  "EAS ignore excludes local Android keystores",
);
includes(
  ".easignore",
  "GoogleService-Info.plist",
  "EAS ignore excludes local platform service config files",
);
includes(
  "package.json",
  "release:store-assets:check",
  "Package scripts include the store asset validator",
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
  "app.json",
  "eas.json",
  "package.json",
  "docs/mobile-store-release.md",
  "store-assets/metadata/en-US.json",
  "store-assets/README.md",
  "store-assets/screenshots/README.md",
  "supabase/functions/delete-account/README.md",
  "supabase/functions/back-office-flyer/README.md",
];

for (const file of filesToScan) {
  if (secretPattern.test(read(file))) {
    fail(`Potential real secret pattern found in ${file}`);
  }
}
pass("No obvious real secret values found in release metadata files");

if (checkExternal) {
  if (process.env.EXPO_TOKEN || commandOk("eas", ["whoami"])) {
    pass("Expo authentication is available through EXPO_TOKEN or EAS CLI login");
  } else {
    fail("Expo authentication is missing. Set EXPO_TOKEN for CI or install EAS CLI and run: eas login");
  }

  if (process.env.SUPABASE_ACCESS_TOKEN || commandOk("supabase", ["projects", "list"])) {
    pass("Supabase authentication is available through SUPABASE_ACCESS_TOKEN or CLI login");
  } else {
    fail("Supabase authentication is missing. Set SUPABASE_ACCESS_TOKEN for CI or install Supabase CLI and run: supabase login");
  }

  if (process.env.SUPABASE_PROJECT_ID) {
    pass("SUPABASE_PROJECT_ID is present for CI function deploys");
  } else {
    fail("SUPABASE_PROJECT_ID is not set for CI function deploys");
  }

  if (process.env.POCKETCART_GOOGLE_MAPS_ANDROID_API_KEY) {
    pass("Android Google Maps API key is present in the environment");
  } else {
    fail("POCKETCART_GOOGLE_MAPS_ANDROID_API_KEY is not set");
  }

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    pass("SUPABASE_SERVICE_ROLE_KEY is present in the environment");
  } else {
    fail("SUPABASE_SERVICE_ROLE_KEY is not set");
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
