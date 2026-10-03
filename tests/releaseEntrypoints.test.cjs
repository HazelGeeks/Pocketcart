const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

test("EAS commands use the installed reviewed version, literal arguments and propagate failure", async () => {
  const { runEas, easVersion } = await import("../scripts/eas-cli.mjs");
  let calls = 0;
  const result = runEas(["build", "--message", "literal $(not-a-command)"], {
    spawn(command, args, options) {
      calls++;
      assert.equal(command, process.execPath);
      assert.equal(require("../node_modules/eas-cli/package.json").version, easVersion());
      assert.deepEqual(args, [path.resolve("node_modules/eas-cli/bin/run"), "build", "--message", "literal $(not-a-command)"]);
      assert.equal(options.shell, false);
      return { status: 7 };
    },
  });
  assert.equal(calls, 1);
  assert.equal(result, 7);
  assert.throws(() => runEas([], { spawn: () => ({ error: new Error("private") }) }), /Could not start/);
});

test("store submission refuses implicit/latest, duplicate and invalid targets before CLI use", async () => {
  const { submissionArgs } = await import("../scripts/submit-store.mjs");
  const id = "10000000-0000-0000-0000-000000000001";
  for (const args of [
    ["ios"], ["ios", "--latest"], ["ios", "--id"], ["ios", "--id", "--non-interactive"],
    ["ios", "--id", "invalid"], ["all", "--id", id], ["ios", "--id", id, "--id", id],
    ["ios", "--id", id, "--path", "missing.ipa"], ["ios", "--path", "missing.ipa"],
  ]) assert.throws(() => submissionArgs(args));
  assert.deepEqual(submissionArgs(["ios", "--id", id, "--non-interactive"]),
    ["submit", "--platform", "ios", "--profile", "production", "--id", id, "--non-interactive"]);
  assert.throws(() => execFileSync(process.execPath, ["scripts/submit-store.mjs", "ios"], { stdio: "pipe" }));
});

test("explicit local artifacts preserve spaces and reject mismatched platforms or directories", async () => {
  const { submissionArgs } = await import("../scripts/submit-store.mjs");
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "pocketcart-store-target-"));
  try {
    const ipa = path.join(temp, "reviewed build.ipa");
    fs.writeFileSync(ipa, "synthetic test artifact");
    assert.equal(submissionArgs(["ios", "--path", ipa]).at(-1), ipa);
    assert.throws(() => submissionArgs(["android", "--path", ipa]));
    const directory = path.join(temp, "directory.ipa"); fs.mkdirSync(directory);
    assert.throws(() => submissionArgs(["ios", "--path", directory]));
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});

test("an unreviewed CLI version range fails before starting the installed tool", async () => {
  const { runEas } = await import("../scripts/eas-cli.mjs");
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "pocketcart-cli-version-"));
  try {
    fs.writeFileSync(path.join(temp, "eas.json"), JSON.stringify({ cli: { version: "latest" } }));
    assert.throws(() => runEas([], { root: temp, spawn: () => assert.fail("Must not launch CLI") }), /exact reviewed version/);
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});

test("EAS resolves real inherited profiles with the patched schema dependencies", async () => {
  const { createRequire } = require("node:module");
  const easRequire = createRequire(path.resolve("node_modules/eas-cli/package.json"));
  const { EasJsonAccessor, EasJsonUtils, Platform } = easRequire("@expo/eas-json");
  const accessor = EasJsonAccessor.fromProjectPath(process.cwd());
  for (const platform of [Platform.IOS, Platform.ANDROID]) {
    const production = await EasJsonUtils.getBuildProfileAsync(accessor, platform, "production");
    assert.equal(production.node, "22.22.3");
    assert.equal(production.autoIncrement, true);
    assert.equal((await EasJsonUtils.getBuildProfileAsync(accessor, platform, "preview")).distribution, "internal");
    assert.equal((await EasJsonUtils.getBuildProfileAsync(accessor, platform, "production-local")).autoIncrement, false);
  }
});

test("patched EAS project generation preserves nested config with the security-fixed merge API", async () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "pocketcart-eas-project-"));
  try {
    fs.writeFileSync(path.join(temp, "app.json"), JSON.stringify({ expo: {
      ios: { supportsTablet: false }, android: { permissions: ["CAMERA"] }, extra: { existing: "kept" },
    } }));
    const { generateAppConfigAsync } = require("../node_modules/eas-cli/build/commandUtils/new/projectFiles.js");
    await generateAppConfigAsync(temp, {
      id: "10000000-0000-0000-0000-000000000001", name: "Test app", slug: "test-app", ownerAccount: { name: "testowner" },
    });
    const result = JSON.parse(fs.readFileSync(path.join(temp, "app.json"))).expo;
    assert.equal(result.ios.supportsTablet, false);
    assert.equal(result.ios.bundleIdentifier, "com.testowner.testapp");
    assert.deepEqual(result.android.permissions, ["CAMERA"]);
    assert.equal(result.extra.existing, "kept");
    assert.equal(result.extra.eas.projectId, "10000000-0000-0000-0000-000000000001");
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});
