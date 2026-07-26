import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

if (process.env.EAS_BUILD_PLATFORM && process.env.EAS_BUILD_PLATFORM !== "android") {
  console.log("Skipping Android Firebase configuration for this EAS build.");
  process.exit(0);
}

const targetPath = resolve("android/app/google-services.json");
const sourcePath = process.env.GOOGLE_SERVICES_JSON?.trim();

if (!sourcePath) {
  if (existsSync(targetPath)) {
    console.log("Using the local ignored Android Firebase configuration.");
    process.exit(0);
  }
  throw new Error(
    "GOOGLE_SERVICES_JSON is required when android/app/google-services.json is unavailable.",
  );
}

const resolvedSourcePath = resolve(sourcePath);
if (!existsSync(resolvedSourcePath)) {
  throw new Error("The GOOGLE_SERVICES_JSON file supplied by EAS does not exist.");
}

mkdirSync(dirname(targetPath), { recursive: true });
if (resolvedSourcePath !== targetPath) {
  copyFileSync(resolvedSourcePath, targetPath);
}
console.log("Prepared the ignored Android Firebase configuration for the native build.");
