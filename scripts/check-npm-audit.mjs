import { spawnSync } from "node:child_process";

// Expo SDK 55 / React Native 0.83 still resolve build tooling through packages
// with no patched compatible release. Keep exceptions scoped to exact advisory
// IDs; runtime dependencies and every new high/critical advisory still fail CI.
const TEMPORARILY_ALLOWED_ADVISORIES = new Set([
  1124334, // brace-expansion in Expo tooling
  1138808, // image-size ICNS parser used by Metro for trusted build assets
  1138809, // image-size JXL/HEIF parsers used by Metro for trusted build assets
]);

const audit = spawnSync("npm", ["audit", "--omit=dev", "--json"], {
  encoding: "utf8",
  maxBuffer: 20 * 1024 * 1024,
});

let report;
try {
  report = JSON.parse(audit.stdout || "{}");
} catch {
  console.error(audit.stderr || "npm audit did not return valid JSON.");
  process.exit(1);
}

if (!report.vulnerabilities || typeof report.vulnerabilities !== "object") {
  console.error(report.message || audit.stderr || "npm audit did not return a vulnerability report.");
  process.exit(1);
}

const vulnerabilities = report.vulnerabilities;
const advisoryIdsByPackage = new Map(
  Object.entries(vulnerabilities).map(([packageName, record]) => [
    packageName,
    new Set(
      (record.via ?? [])
        .filter((source) => typeof source?.source === "number")
        .map((source) => source.source),
    ),
  ]),
);

let advisoryGraphChanged = true;
while (advisoryGraphChanged) {
  advisoryGraphChanged = false;
  for (const [packageName, record] of Object.entries(vulnerabilities)) {
    const ids = advisoryIdsByPackage.get(packageName);
    for (const source of record.via ?? []) {
      if (typeof source !== "string") continue;
      for (const id of advisoryIdsByPackage.get(source) ?? []) {
        if (ids.has(id)) continue;
        ids.add(id);
        advisoryGraphChanged = true;
      }
    }
  }
}

function advisoryIdsFor(packageName) {
  return advisoryIdsByPackage.get(packageName) ?? new Set();
}

const blocked = [];
const allowed = [];
for (const [packageName, record] of Object.entries(vulnerabilities)) {
  if (!["high", "critical"].includes(record.severity)) continue;
  const advisoryIds = advisoryIdsFor(packageName);
  const isAllowed =
    record.severity !== "critical" &&
    advisoryIds.size > 0 &&
    [...advisoryIds].every((id) => TEMPORARILY_ALLOWED_ADVISORIES.has(id));
  (isAllowed ? allowed : blocked).push({
    packageName,
    severity: record.severity,
    advisoryIds: [...advisoryIds],
  });
}

if (blocked.length > 0) {
  console.error("Unapproved high/critical npm audit findings:");
  for (const finding of blocked) {
    console.error(
      `- ${finding.packageName} (${finding.severity}; advisories: ${
        finding.advisoryIds.join(", ") || "unknown"
      })`,
    );
  }
  process.exit(1);
}

if (allowed.length > 0) {
  console.warn(
    `Temporarily allowing ${allowed.length} transitive build-tool finding(s) ` +
      "tied only to exact Expo SDK 55 / React Native 0.83 advisory exceptions.",
  );
}
console.log("npm audit policy check passed; no unapproved high or critical advisories.");
