import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const githubSecrets = [
  "EXPO_TOKEN",
  "SUPABASE_ACCESS_TOKEN",
  "SUPABASE_PROJECT_ID",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const easProductionEnv = [
  "EXPO_PUBLIC_SUPABASE_URL",
  "EXPO_PUBLIC_SUPABASE_ANON_KEY",
  "EXPO_PUBLIC_AUTH_REDIRECT_URL",
  "EXPO_PUBLIC_SUPABASE_PRODUCT_IMAGE_BUCKET",
  "POCKETCART_GOOGLE_MAPS_ANDROID_API_KEY",
];

function commandOutput(command, args) {
  try {
    return execFileSync(command, args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 15000,
    });
  } catch {
    return null;
  }
}

function parseNamedJsonItems(output) {
  if (!output) return null;
  try {
    const payload = JSON.parse(output);
    if (!Array.isArray(payload)) return null;
    return new Set(
      payload
        .map((item) => (typeof item?.name === "string" ? item.name : null))
        .filter(Boolean),
    );
  } catch {
    return null;
  }
}

function readDotEnvKeys(path) {
  if (!existsSync(path)) return new Set();
  const keys = readFileSync(path, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => line.split("=")[0]?.trim())
    .filter(Boolean);
  return new Set(keys);
}

function readEasEnvNames() {
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

function printStatus(title, required, configured, fallback = new Set()) {
  console.log(`\n${title}`);
  for (const name of required) {
    const isConfigured = configured?.has(name) || fallback.has(name);
    const source = configured?.has(name)
      ? "remote"
      : fallback.has(name)
        ? ".env.local"
        : "missing";
    console.log(`- ${isConfigured ? "OK" : "MISSING"} ${name} (${source})`);
  }
}

const envLocalKeys = readDotEnvKeys(".env.local");
const githubSecretNames = parseNamedJsonItems(
  commandOutput("gh", ["secret", "list", "--json", "name"]),
);
const easWhoami = commandOutput("npx", ["eas-cli", "whoami"]);
const easEnvNames = readEasEnvNames();

console.log("PocketCart mobile release setup guide");
console.log("This script never prints secret values.");

console.log(`\nGitHub CLI: ${githubSecretNames ? "authenticated" : "not ready"}`);
console.log(`EAS CLI: ${easWhoami ? `authenticated as ${easWhoami.trim()}` : "not logged in"}`);

printStatus("GitHub repository secrets", githubSecrets, githubSecretNames);
printStatus("EAS production environment", easProductionEnv, easEnvNames, envLocalKeys);

console.log("\nNext commands for GitHub secrets:");
for (const name of githubSecrets) {
  if (!githubSecretNames?.has(name)) {
    console.log(`gh secret set ${name}`);
  }
}

console.log("\nNext commands for EAS production env:");
if (!easWhoami) {
  console.log("npx eas-cli login");
}
for (const name of easProductionEnv) {
  if (!easEnvNames?.has(name)) {
    const visibility =
      name === "EXPO_PUBLIC_SUPABASE_ANON_KEY" ||
      name === "POCKETCART_GOOGLE_MAPS_ANDROID_API_KEY"
        ? "sensitive"
        : "plaintext";
    console.log(
      `npx eas-cli env:create production --name ${name} --visibility ${visibility}`,
    );
  }
}

console.log("\nAfter setup:");
console.log("npm run release:native:doctor");
