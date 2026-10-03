import { spawnSync } from "node:child_process";
import { readdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
rmSync(resolve(root, ".tmp-tests"), { recursive: true, force: true });
const compiler = resolve(root, "node_modules/typescript/bin/tsc");
const tests = readdirSync(resolve(root, "tests")).filter(name => name.endsWith(".test.cjs")).sort();
if (!tests.length) throw new Error("No test files found.");
for (const args of [
  [compiler, "-p", "tsconfig.test.json"],
  [compiler, "-p", "tsconfig.push-tests.json"],
  ["--test", ...tests.map(name => resolve(root, "tests", name))],
]) {
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: "inherit", shell: false });
  if (result.error) throw new Error("Could not start the test compiler/runner.");
  if (result.status !== 0) { process.exitCode = result.status ?? 1; break; }
}
