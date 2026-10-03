import { existsSync, statSync } from "node:fs";
import { extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runEas } from "./eas-cli.mjs";

export function submissionArgs(args) {
  const [platform, ...options] = args;
  if (!["ios", "android"].includes(platform)) throw new Error("Choose ios or android.");
  let id, path, nonInteractive = false;
  for (let i = 0; i < options.length; i++) {
    const flag = options[i];
    if (flag === "--non-interactive" && !nonInteractive) nonInteractive = true;
    else if (flag === "--id" && !id) id = options[++i];
    else if (flag === "--path" && !path) path = options[++i];
    else throw new Error("Use --id BUILD_UUID or --path ARTIFACT; --latest is not supported.");
  }
  if (Boolean(id) === Boolean(path)) throw new Error("Specify exactly one --id BUILD_UUID or --path ARTIFACT.");
  if (id && !/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(id)) throw new Error("--id must be a build UUID.");
  if (path && (!existsSync(path) || !statSync(path).isFile() || !(platform === "ios" ? [".ipa"] : [".aab", ".apk"]).includes(extname(path)))) {
    throw new Error("--path must point to an existing artifact for the selected platform.");
  }
  return ["submit", "--platform", platform, "--profile", "production",
    ...(id ? ["--id", id] : ["--path", resolve(path)]), ...(nonInteractive ? ["--non-interactive"] : [])];
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { process.exitCode = runEas(submissionArgs(process.argv.slice(2))); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
