import { spawnSync } from "node:child_process";

// Expo SDK 55 / React Native 0.83 still resolve tooling through vulnerable
// brace-expansion versions. Keep this exception scoped to the exact advisory;
// any new high or critical advisory continues to fail CI.
const TEMPORARILY_ALLOWED_ADVISORIES = new Set([1124334]);

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
const advisoryMemo = new Map();

function advisoryIdsFor(packageName, active = new Set()) {
  if (advisoryMemo.has(packageName)) return advisoryMemo.get(packageName);
  if (active.has(packageName)) return new Set();
  const record = vulnerabilities[packageName];
  if (!record) return new Set();

  const nextActive = new Set(active);
  nextActive.add(packageName);
  const ids = new Set();
  for (const source of record.via ?? []) {
    if (typeof source === "string") {
      for (const id of advisoryIdsFor(source, nextActive)) ids.add(id);
    } else if (typeof source?.source === "number") {
      ids.add(source.source);
    }
  }
  advisoryMemo.set(packageName, ids);
  return ids;
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
    `Temporarily allowing ${allowed.length} transitive finding(s) tied only to ` +
      "GHSA-mh99-v99m-4gvg while PocketCart remains on Expo SDK 55 / React Native 0.83.",
  );
}
console.log("npm audit policy check passed; no unapproved high or critical advisories.");
