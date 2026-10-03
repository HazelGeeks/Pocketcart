import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { featureChecks } from "./supabase-release-checks.mjs";
import { loadRelease, managementQuery, migrationTransaction, readHistory, selectFunctions, selectMigrations, validateHistory } from "./supabase-release-lib.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const args = process.argv.slice(2);
const action = args.shift() ?? "plan";
const values = new Map();
for (const arg of args) {
  const match = /^--(migrations|functions|remote)(?:=(.*))?$/.exec(arg);
  if (!match || values.has(match[1]) || (match[1] !== "remote" && !match[2]) || (match[1] === "remote" && match[2] !== undefined)) {
    throw new Error(`Invalid release argument: ${arg}`);
  }
  values.set(match[1], match[2] ?? true);
}
if (!["plan", "apply-schema", "record-existing", "deploy-functions", "release"].includes(action)) throw new Error("Unknown release action.");
const release = await loadRelease(root);
const selected = values.has("migrations") ? selectMigrations(release, values.get("migrations")) : [];
const names = selectFunctions(release, values.get("functions") ?? "all");
const schemaAction = ["apply-schema", "record-existing", "release"].includes(action);
if (schemaAction && !selected.length) throw new Error("Schema writes require --migrations=<explicit comma-separated versions>.");
const remote = action !== "plan" || values.has("remote");
const project = process.env.SUPABASE_PROJECT_ID;
const token = process.env.SUPABASE_ACCESS_TOKEN;
if (remote && (project !== release.projectRef || !token)) throw new Error("Missing credentials or incorrect Pocketcart project. No changes made.");
const query = remote ? managementQuery(project, token) : null;
const history = query ? await readHistory(query) : [];
const plan = validateHistory(release.migrations, history);
console.log(`Action: ${action}; project: ${release.projectRef}; CLI: ${release.cliVersion}`);
for (const item of selected.length ? plan.filter((entry) => selected.some((item) => item.version === entry.version)) : plan) {
  console.log(`${remote ? item.status : "local-only"} ${item.name} sha256=${item.hash}`);
}
console.log(`Functions: ${names.join(", ")}`);
console.log("Untracked means no runner record; it does NOT mean missing from production. Review existing SQL before apply or record-existing.");
if (action === "plan") process.exit(0);

function cli(args) {
  const result = spawnSync("npx", ["--yes", `supabase@${release.cliVersion}`, ...args, "--project-ref", project], {
    cwd: root, env: process.env, stdio: "inherit", shell: false,
  });
  if (result.error || result.status !== 0) throw new Error("Supabase CLI failed. Deployment may be partial; inspect the project before retrying.");
}

// Validate function secrets before any schema mutation in a combined release.
const deployFunctions = ["deploy-functions", "release"].includes(action);
if (deployFunctions && names.some((name) => ["sync-sale-alerts", "send-sale-alert-push", "admin-flyer-notification"].includes(name))) {
  if (!process.env.PUSH_FUNCTION_SECRET?.trim() || /[\r\n]/.test(process.env.PUSH_FUNCTION_SECRET)) throw new Error("Missing or invalid PUSH_FUNCTION_SECRET. No changes made.");
}
if (schemaAction) {
  const [base] = await query("select to_regclass('public.products') is not null and to_regclass('public.profiles') is not null and to_regclass('public.stores') is not null as installed");
  if (!base?.installed) throw new Error("Core schema missing. This runner updates an existing Pocketcart DB; it does not bootstrap a new project.");
  await query(migrationTransaction(selected, { recordExisting: action === "record-existing", checks: featureChecks(selected) }), false);
  const after = validateHistory(release.migrations, await readHistory(query));
  if (selected.some((item) => after.find((entry) => entry.version === item.version)?.status !== "recorded")) {
    throw new Error("Migration history verification failed; inspect the database before retrying.");
  }
  console.log(action === "record-existing" ? "Reviewed existing migrations recorded; migration SQL was not executed." : "Selected migrations committed; identical recorded versions were skipped.");
}
if (deployFunctions) {
  if (names.some((name) => ["sync-sale-alerts", "send-sale-alert-push", "admin-flyer-notification"].includes(name))) {
    const temp = await mkdtemp(join(tmpdir(), "pocketcart-release-secret-"));
    try {
      const file = join(temp, ".env");
      await writeFile(file, `PUSH_FUNCTION_SECRET=${JSON.stringify(process.env.PUSH_FUNCTION_SECRET)}\n`, { mode: 0o600 });
      cli(["secrets", "set", "--env-file", file]);
    } finally {
      await rm(temp, { recursive: true, force: true });
    }
  }
  cli(["functions", "deploy", ...names, "--use-api", "--jobs", "1"]);
  cli(["functions", "list"]);
  console.log("Function deployments finished. Run the relevant live smoke test; list output alone is not functional verification.");
}
