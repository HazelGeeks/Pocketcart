import { execFileSync } from "node:child_process";
import { join } from "node:path";

// Simulator entitlements live in Mach-O sections, not the macOS code signature.
// Never re-sign a simulator binary with device entitlements: macOS rejects it.
export function decodeSimulatorEntitlements(output) {
  const words = output.split("\n").flatMap((line) => {
    const fields = line.trim().split(/\s+/);
    return /^[0-9a-f]{16}$/i.test(fields[0]) ? fields.slice(1) : [];
  });
  if (!words.length || words.some((word) => !/^(?:[0-9a-f]{2}){1,4}$/i.test(word))) return "";
  return Buffer.concat(words.map((word) => Buffer.from(word, "hex").reverse())).toString("utf8").replace(/\0+$/, "");
}

export function hasSimulatorKeychainAccess(entitlements, bundleId) {
  const identifier = entitlements["application-identifier"];
  return typeof identifier === "string"
    && identifier.endsWith(`.${bundleId}`)
    && Array.isArray(entitlements["keychain-access-groups"])
    && entitlements["keychain-access-groups"].includes(identifier);
}

export function simulatorHasKeychainAccess(udid, bundleId) {
  const options = { encoding: "utf8", timeout: 30000, stdio: ["ignore", "pipe", "pipe"] };
  try {
    const appPath = execFileSync("xcrun", ["simctl", "get_app_container", udid, bundleId, "app"], options).trim();
    const info = JSON.parse(execFileSync("plutil", ["-convert", "json", "-o", "-", join(appPath, "Info.plist")], options));
    if (info.CFBundleIdentifier !== bundleId || !info.CFBundleSupportedPlatforms?.includes("iPhoneSimulator")) return false;
    const output = execFileSync("xcrun", ["otool", "-X", "-s", "__TEXT", "__entitlements", join(appPath, info.CFBundleExecutable)], options);
    const xml = decodeSimulatorEntitlements(output);
    if (!xml) return false;
    const entitlements = JSON.parse(execFileSync("plutil", ["-convert", "json", "-o", "-", "--", "-"], { ...options, stdio: ["pipe", "pipe", "pipe"], input: xml }));
    return hasSimulatorKeychainAccess(entitlements, bundleId);
  } catch {
    return false;
  }
}
