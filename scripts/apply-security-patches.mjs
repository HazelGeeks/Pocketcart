import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const patches = JSON.parse(
  readFileSync(join(projectRoot, "scripts/security-patches.json"), "utf8"),
);
const sha256 = (content) => createHash("sha256").update(content).digest("hex");

// Check every installed copy listed by npm, including nested copies. Unknown
// versions/source fail closed so an upgrade requires reviewing these backports.
export function checkSecurityPatches({ apply = false, root = projectRoot } = {}) {
  const lock = JSON.parse(readFileSync(join(root, "package-lock.json"), "utf8"));
  let checked = 0;
  for (const patch of patches) {
    const installs = Object.entries(lock.packages).filter(
      ([path]) =>
        path.endsWith(`/node_modules/${patch.package}`) || path === `node_modules/${patch.package}`,
    );
    if (installs.length === 0) throw new Error(`Missing security dependency: ${patch.package}`);
    for (const [path, record] of installs) {
      const installed = JSON.parse(readFileSync(join(root, path, "package.json"), "utf8"));
      if (record.version !== patch.version || installed.version !== patch.version) {
        throw new Error(`Review security backport for ${path}: expected ${patch.version}`);
      }
      const target = join(root, path, patch.file);
      const content = readFileSync(target, "utf8");
      if (sha256(content) !== patch.afterSha256) {
        if (!apply || sha256(content) !== patch.beforeSha256) {
          throw new Error(`Security patch missing or unexpected source: ${path}/${patch.file}`);
        }
        let patched = content;
        for (const replacement of patch.replacements) {
          patched = patched.replaceAll(replacement.before, replacement.after);
        }
        if (sha256(patched) !== patch.afterSha256) throw new Error(`Invalid patch: ${target}`);
        writeFileSync(target, patched);
      }
      checked++;
    }
  }
  return checked;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(`Verified ${checkSecurityPatches({ apply: true })} dependency security patches.`);
}
