import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export function easVersion(root = projectRoot) {
  const version = JSON.parse(readFileSync(resolve(root, "eas.json"), "utf8")).cli?.version;
  if (!/^\d+\.\d+\.\d+$/.test(version ?? "")) {
    throw new Error("eas.json cli.version must contain one exact reviewed version.");
  }
  return version;
}
export function runEas(args, { root = projectRoot, spawn = spawnSync } = {}) {
  const version = easVersion(root);
  const installed = JSON.parse(readFileSync(resolve(root, "node_modules/eas-cli/package.json"), "utf8"));
  if (installed.version !== version) throw new Error("Installed EAS CLI differs from eas.json; run npm ci.");
  const entry = resolve(root, "node_modules/eas-cli/bin/run");
  const result = spawn(process.execPath, [entry, ...args], {
    cwd: root, stdio: "inherit", shell: false,
  });
  if (result.error) throw new Error("Could not start the pinned EAS CLI.");
  return result.status ?? 1;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    if (args.length === 1 && args[0] === "--print-version") console.log(easVersion());
    else process.exitCode = runEas(args);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
