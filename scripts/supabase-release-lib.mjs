import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";

export const sha256 = (source) => createHash("sha256").update(source).digest("hex");
const literal = (value) => `'${value.replaceAll("'", "''")}'`;

export async function loadRelease(root) {
  const config = JSON.parse(await readFile(`${root}/supabase/release.json`, "utf8"));
  if (!/^[a-z]{20}$/.test(config.projectRef) || !/^\d+\.\d+\.\d+$/.test(config.cliVersion)) {
    throw new Error("Invalid release project or pinned CLI version.");
  }
  const migrations = (await readdir(`${root}/supabase/migrations`)).filter((name) => name.endsWith(".sql")).sort();
  const functions = (await readdir(`${root}/supabase/functions`, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && entry.name !== "_shared").map((entry) => entry.name).sort();
  const registeredFunctions = [...config.functions, ...(config.disabledFunctions ?? [])].sort();
  if (new Set(registeredFunctions).size !== registeredFunctions.length) throw new Error("Duplicate active/disabled function registration.");
  for (const [name, registered, actual] of [["migrations", config.migrations, migrations], ["functions", registeredFunctions, functions]]) {
    if (JSON.stringify(registered) !== JSON.stringify(actual)) {
      throw new Error(`Update supabase/release.json: ${name} inventory differs from disk.`);
    }
  }
  const sql = await Promise.all(migrations.map(async (name) => {
    if (!/^\d{14}_[a-z0-9_]+\.sql$/.test(name)) throw new Error(`Invalid migration filename: ${name}`);
    const source = await readFile(`${root}/supabase/migrations/${name}`, "utf8");
    return { name, version: name.slice(0, 14), source, hash: sha256(source) };
  }));
  if (new Set(sql.map((item) => item.version)).size !== sql.length) throw new Error("Duplicate migration versions.");
  const functionConfig = await readFile(`${root}/supabase/config.toml`, "utf8");
  for (const name of functions) {
    await readFile(`${root}/supabase/functions/${name}/index.ts`, "utf8");
    if (!functionConfig.includes(`[functions.${name}]`)) throw new Error(`Missing function configuration: ${name}`);
  }
  return { ...config, migrations: sql };
}

export function selectMigrations(release, selection) {
  const versions = selection.split(",").map((value) => value.trim()).filter(Boolean);
  if (!versions.length || new Set(versions).size !== versions.length) {
    throw new Error("Specify unique migration versions explicitly; automatic/all schema deployment is disabled.");
  }
  for (const version of versions) {
    if (!/^\d{14}$/.test(version) || !release.migrations.some((item) => item.version === version)) {
      throw new Error(`Unknown migration version: ${version}`);
    }
  }
  return release.migrations.filter((item) => versions.includes(item.version));
}

export function selectFunctions(release, selection) {
  const names = selection === "all" ? release.functions : selection.split(",").map((value) => value.trim()).filter(Boolean);
  if (!names.length || new Set(names).size !== names.length) throw new Error("Specify unique function names or all.");
  for (const name of names) if (!release.functions.includes(name)) throw new Error(`Unknown function: ${name}`);
  return names;
}

export function validateHistory(migrations, rows) {
  const history = new Map(rows.map((row) => [row.version, row]));
  for (const row of rows) {
    const migration = migrations.find((item) => item.version === row.version);
    if (!migration || migration.name !== row.name || migration.hash !== row.sha256) {
      throw new Error(`Recorded migration differs from repository: ${row.version}. Restore the original; add a new migration.`);
    }
  }
  return migrations.map((item) => ({ ...item, status: history.has(item.version) ? "recorded" : "untracked" }));
}

// Only outer transaction wrappers are removed. Function/DO block BEGINs remain intact.
export function migrationBody(source) {
  return source.replace(/^(\s*(?:--[^\n]*\n\s*)*)begin\s*;/i, "$1")
    .replace(/commit\s*;\s*$/i, "");
}

export function migrationTransaction(migrations, { recordExisting = false, checks = [] } = {}) {
  const family = migrations.find((item) => item.version === "20260914010000");
  const familyGuard = family && !recordExisting ? `
DO $pc_family$ BEGIN
  IF NOT EXISTS(SELECT 1 FROM pocketcart_deploy.migrations WHERE version='20260914010000')
    AND to_regclass('public.families') IS NOT NULL THEN
    RAISE EXCEPTION 'Existing family schema is untracked. Verify it and record-existing before applying new changes';
  END IF;
END $pc_family$;` : "";
  const blocks = migrations.map((item) => `
DO $pc_release$
DECLARE previous record;
BEGIN
  SELECT * INTO previous FROM pocketcart_deploy.migrations WHERE version = ${literal(item.version)};
  IF FOUND THEN
    IF previous.sha256 <> ${literal(item.hash)} OR previous.name <> ${literal(item.name)} THEN
      RAISE EXCEPTION 'Recorded migration changed: ${item.version}';
    END IF;
  ELSE
    ${recordExisting ? "-- Operator verified this existing migration before recording." : `EXECUTE ${literal(migrationBody(item.source))};`}
    INSERT INTO pocketcart_deploy.migrations(version, name, sha256)
    VALUES (${literal(item.version)}, ${literal(item.name)}, ${literal(item.hash)});
  END IF;
END $pc_release$;`);
  return `BEGIN;
SELECT pg_advisory_xact_lock(735024109);
CREATE SCHEMA IF NOT EXISTS pocketcart_deploy;
REVOKE ALL ON SCHEMA pocketcart_deploy FROM PUBLIC, anon, authenticated;
CREATE TABLE IF NOT EXISTS pocketcart_deploy.migrations (
  version text PRIMARY KEY, name text NOT NULL, sha256 text NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON pocketcart_deploy.migrations FROM PUBLIC, anon, authenticated;
${familyGuard}
${blocks.join("\n")}
${checks.join("\n")}
NOTIFY pgrst, 'reload schema';
COMMIT;`;
}

export function managementQuery(project, token, fetcher = fetch) {
  return async (query, readOnly = true) => {
    const response = await fetcher(`https://api.supabase.com/v1/projects/${project}/database/query`, {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query, read_only: readOnly }), signal: AbortSignal.timeout(120_000),
    });
    // Response bodies may contain private row data or SQL; do not print them.
    if (!response.ok) throw new Error(`Supabase SQL request failed (${response.status}); inspect the project dashboard. No automatic retry.`);
    return response.json();
  };
}

export async function readHistory(query) {
  const [state] = await query("select to_regclass('pocketcart_deploy.migrations') is not null as installed");
  if (!state?.installed) return [];
  return query("select version, name, sha256 from pocketcart_deploy.migrations order by version");
}
