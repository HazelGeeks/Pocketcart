import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(
  readFileSync(join(projectRoot, "scripts/vendor-security-manifest.json"), "utf8"),
);

export function checkVendoredSecurity(root = projectRoot) {
  const lock = JSON.parse(readFileSync(join(root, "package-lock.json"), "utf8"));
  let checked = 0;
  for (const fork of manifest) {
    const copies = Object.keys(lock.packages).filter(
      (path) =>
        path === `node_modules/${fork.alias}` || path.endsWith(`/node_modules/${fork.alias}`),
    );
    if (!copies.length) throw new Error(`Missing security fork: ${fork.alias}`);
    for (const copy of [fork.directory, ...copies]) {
      const base = join(root, copy);
      const pkg = JSON.parse(readFileSync(join(base, "package.json"), "utf8"));
      if (pkg.name !== fork.name || pkg.version !== fork.version) {
        throw new Error(`Unreviewed dependency at ${copy}`);
      }
      const files = [];
      function walk(directory, prefix = "") {
        for (const entry of readdirSync(directory, { withFileTypes: true })) {
          const relative = prefix + entry.name;
          if (entry.isDirectory()) walk(join(directory, entry.name), `${relative}/`);
          else files.push(relative);
        }
      }
      walk(base);
      if (JSON.stringify(files.sort()) !== JSON.stringify(Object.keys(fork.files).sort())) {
        throw new Error(`Unexpected security fork files: ${copy}`);
      }
      for (const [file, expected] of Object.entries(fork.files)) {
        const actual = createHash("sha256")
          .update(readFileSync(join(base, file)))
          .digest("hex");
        if (actual !== expected) throw new Error(`Security fork hash mismatch: ${copy}/${file}`);
        checked++;
      }
    }
  }
  return checked;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(`Verified ${checkVendoredSecurity()} files in patched dependency forks.`);
}
