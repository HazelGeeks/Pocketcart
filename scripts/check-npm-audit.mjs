import { spawnSync } from "node:child_process";
import { checkSecurityPatches } from "./apply-security-patches.mjs";
import { checkVendoredSecurity } from "./check-vendored-security.mjs";

// Local backports are defense in depth, not an exemption from registry findings.
console.log(`Verified ${checkSecurityPatches()} dependency security patches before audit.`);
console.log(`Verified ${checkVendoredSecurity()} patched fork files before audit.`);

const audit = spawnSync("npm", ["audit", "--json"], {
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
  console.error(
    report.message || audit.stderr || "npm audit did not return a vulnerability report.",
  );
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
for (const [packageName, record] of Object.entries(vulnerabilities)) {
  if (!["high", "critical"].includes(record.severity)) continue;
  const advisoryIds = advisoryIdsFor(packageName);
  blocked.push({
    packageName,
    severity: record.severity,
    advisoryIds: [...advisoryIds],
  });
}

if (blocked.length > 0) {
  console.error("Unresolved high/critical npm audit findings (no exceptions):");
  for (const finding of blocked) {
    console.error(
      `- ${finding.packageName} (${finding.severity}; advisories: ${
        finding.advisoryIds.join(", ") || "unknown"
      })`,
    );
  }
  process.exit(1);
}

console.log("npm audit policy check passed; zero high or critical advisories.");
