const test = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const root = path.resolve(__dirname, "..");
const lib = import("../scripts/supabase-release-lib.mjs");

test("release inventory covers all SQL and configured handlers", async () => {
  const { loadRelease } = await lib;
  const release = await loadRelease(root);
  assert.equal(release.migrations.length, 33);
  assert.equal(release.functions.length, 9);
  assert.ok(release.functions.includes("receipt-scan"));
  assert.ok(!release.functions.includes("food-scan"));
  assert.deepEqual(release.disabledFunctions, ["food-scan"]);
});

test("schema selection rejects broad, unknown, duplicate and injected values", async () => {
  const { loadRelease, selectMigrations } = await lib;
  const release = await loadRelease(root);
  for (const selection of ["", "all", "20260101000000", "20260916010000,20260916010000", "20260916010000;select 1"]) {
    assert.throws(() => selectMigrations(release, selection));
  }
  assert.deepEqual(selectMigrations(release, "20260916010000,20260914010000").map((item) => item.version), ["20260914010000", "20260916010000"]);
});

test("function names are allowlisted before becoming CLI arguments", async () => {
  const { loadRelease, selectFunctions } = await lib;
  const release = await loadRelease(root);
  assert.deepEqual(selectFunctions(release, "all"), release.functions);
  assert.deepEqual(selectFunctions(release, "receipt-scan"), ["receipt-scan"]);
  for (const selection of ["", "--no-verify-jwt", "food-scan", "food-scan,food-scan", "missing"]) {
    assert.throws(() => selectFunctions(release, selection));
  }
});

test("untracked SQL is not reported as pending and recorded history is immutable", async () => {
  const { loadRelease, validateHistory } = await lib;
  const { migrations } = await loadRelease(root);
  const first = migrations[0];
  const row = { version: first.version, name: first.name, sha256: first.hash };
  assert.equal(validateHistory(migrations, [row])[0].status, "recorded");
  assert.equal(validateHistory(migrations, [row])[1].status, "untracked");
  for (const changed of [{ ...row, sha256: "changed" }, { ...row, name: "renamed.sql" }, { ...row, version: "20260101000000" }]) {
    assert.throws(() => validateHistory(migrations, [changed]), /Recorded migration differs/);
  }
});

test("offline plan needs no credentials and unsafe writes fail before network use", () => {
  const script = path.join(root, "scripts/supabase-release.mjs");
  const env = { ...process.env, SUPABASE_PROJECT_ID: "", SUPABASE_ACCESS_TOKEN: "" };
  assert.match(execFileSync(process.execPath, [script, "plan"], { env, encoding: "utf8" }), /local-only/);
  for (const args of [["apply-schema"], ["deploy-functions"], ["plan", "--remote=true"], ["release", "--migrations=all"]]) {
    assert.throws(() => execFileSync(process.execPath, [script, ...args], { env, stdio: "pipe" }));
  }
});

test("history reads are read-only and SQL error details are not exposed", async () => {
  const { managementQuery, readHistory } = await lib;
  const calls = [];
  const query = managementQuery("example", "secret", async (_url, options) => {
    calls.push(JSON.parse(options.body));
    return { ok: true, json: async () => calls.length === 1 ? [{ installed: false }] : [] };
  });
  assert.deepEqual(await readHistory(query), []);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].read_only, true);
  const failed = managementQuery("example", "secret", async () => ({ ok: false, status: 500, json: async () => ({ sensitive: "private" }) }));
  await assert.rejects(failed("select 1"), (error) => /500/.test(error.message) && !/secret|private|select 1/.test(error.message));
});

test("function release covers all handlers, protects and removes secret files, and stops after CLI failure", async () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "pocketcart-release-cli-"));
  try {
    const capture = path.join(temp, "calls.jsonl");
    const hook = path.join(temp, "offline.mjs");
    fs.writeFileSync(hook, `globalThis.fetch = async (url, options) => {
      if (!url.startsWith('https://api.supabase.com/') || !JSON.parse(options.body).read_only) throw Error('Unexpected network/write');
      return { ok: true, json: async () => [{ installed: false }] };
    };`);
    fs.writeFileSync(path.join(temp, "npx"), `#!${process.execPath}
const fs = require('node:fs');
const args = process.argv.slice(2);
const file = args[args.indexOf('--env-file') + 1];
const input = args.includes('--env-file') ? fs.readFileSync(file, 'utf8') : '';
fs.appendFileSync(process.env.RELEASE_CAPTURE, JSON.stringify({ args, input })+'\\n');
if (args.includes(process.env.RELEASE_FAIL_FUNCTION)) process.exit(1);
`, { mode: 0o700 });
    const env = { ...process.env, PATH: `${temp}${path.delimiter}${process.env.PATH}`, RELEASE_CAPTURE: capture,
      SUPABASE_PROJECT_ID: "jmxbvqrvxshlybeomagw", SUPABASE_ACCESS_TOKEN: "fake-test-token",
      PUSH_FUNCTION_SECRET: "test-only-canary", RELEASE_FAIL_FUNCTION: "" };
    const run = () => execFileSync(process.execPath, ["--import", hook, path.join(root, "scripts/supabase-release.mjs"), "deploy-functions"], { env, stdio: ["ignore", "pipe", "pipe"] });
    run();
    const calls = fs.readFileSync(capture, "utf8").trim().split("\n").map(JSON.parse);
    const release = await (await lib).loadRelease(root);
    const deploy = calls.find((call) => call.args.includes("deploy"));
    assert.deepEqual(deploy.args.slice(4, 4 + release.functions.length), release.functions);
    const secret = calls.find((call) => call.args.includes("secrets"));
    assert.equal(secret.input, 'PUSH_FUNCTION_SECRET="test-only-canary"\n');
    assert.equal(fs.existsSync(secret.args[secret.args.indexOf("--env-file") + 1]), false);
    assert.ok(calls.every((call) => call.args.includes(`supabase@${release.cliVersion}`) && !call.args.join(" ").includes("test-only-canary")));
    assert.ok(calls.at(-1).args.includes("list"));
    fs.writeFileSync(capture, "");
    env.RELEASE_FAIL_FUNCTION = "billing-status";
    assert.throws(run);
    const stopped = fs.readFileSync(capture, "utf8").trim().split("\n").map(JSON.parse);
    assert.ok(stopped.at(-1).args.includes("billing-status"));
    assert.ok(!stopped.some((call) => call.args.includes("list")));
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});
