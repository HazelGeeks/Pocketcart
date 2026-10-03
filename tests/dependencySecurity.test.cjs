const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const braces = require("braces");
const forge = require("node-forge");

test("audit gate rejects backported and transitive high advisories without exceptions", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "pocketcart-audit-gate-"));
  try {
    fs.writeFileSync(
      path.join(root, "npm"),
      "#!/usr/bin/env node\nprocess.stdout.write(process.env.POCKETCART_AUDIT_FIXTURE);\n",
      { mode: 0o755 },
    );
    const run = (vulnerabilities) =>
      spawnSync(process.execPath, [path.join(__dirname, "../scripts/check-npm-audit.mjs")], {
        encoding: "utf8",
        env: {
          ...process.env,
          PATH: `${root}${path.delimiter}${process.env.PATH}`,
          POCKETCART_AUDIT_FIXTURE: JSON.stringify({ vulnerabilities }),
        },
      });
    const rejected = run({
      braces: { severity: "high", via: [{ source: 1240992 }] },
      "node-forge": { severity: "high", via: [{ source: 1240912 }] },
      micromatch: { severity: "high", via: ["braces"] },
    });
    assert.equal(rejected.status, 1);
    assert.match(rejected.stderr, /no exceptions/);
    assert.match(rejected.stderr, /micromatch.*1240992/);
    const clean = run({});
    assert.equal(clean.status, 0, clean.stderr);
    assert.match(clean.stdout, /zero high or critical/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("patched image-size keeps Metro's buffer and file asset paths working", async () => {
  const { default: imageSize } = require("image-size");
  for (const [file, width, height] of [
    ["assets/icon.png", 1024, 1024],
    ["store-assets/google-play/feature-graphic.jpg", 1024, 500],
  ]) {
    const size = imageSize(fs.readFileSync(path.join(__dirname, "..", file)));
    assert.equal(size.width, width);
    assert.equal(size.height, height);
  }
  const { getAssetData } = require("metro/private/Assets");
  const asset = await getAssetData(
    path.join(__dirname, "../assets/icon.png"),
    "assets/icon.png",
    [],
    "ios",
    "/assets",
  );
  assert.equal(asset.width, 1024);
  assert.equal(asset.height, 1024);
});

test("braces preserves ordinary glob compilation, expansion and escaped literals", () => {
  assert.equal(braces.compile("src/{hooks,services}/*.ts"), "src/(hooks|services)/*.ts");
  assert.deepEqual(braces.expand("file{1..3}.ts"), ["file1.ts", "file2.ts", "file3.ts"]);
  assert.equal(braces.stringify(braces.parse("a/{b,c}/d")), "a/{b,c}/d");
  assert.equal(braces.compile(String.raw`\{literal\}`), "{literal}");
});

test("braces rejects deeply nested and unclosed patterns before recursive walking", () => {
  for (const pattern of [
    "{".repeat(4000) + "a,b" + "}".repeat(4000),
    "(".repeat(4000) + "x" + ")".repeat(4000),
    "{".repeat(4000) + "x",
  ]) {
    for (const method of ["parse", "compile", "expand", "stringify"]) {
      assert.throws(() => braces[method](pattern), /nesting exceeds security limit/);
    }
  }
});

test("braces guards direct AST input and cyclic ASTs in all public walkers", () => {
  for (const method of ["compile", "expand", "stringify"]) {
    let ast = { type: "text", value: "x", nodes: [] };
    for (let i = 0; i < 200; i++) ast = { type: "root", nodes: [ast] };
    assert.throws(() => braces[method](ast), /nesting exceeds security limit/);
    const cyclic = { type: "root", nodes: [] };
    cyclic.nodes.push(cyclic);
    assert.throws(() => braces[method](cyclic), /nesting exceeds security limit/);
  }
});

test("RSA verification accepts valid signatures and rejects nested DigestAlgorithm garbage", () => {
  const { publicKey, privateKey } = forge.pki.rsa.generateKeyPair({ bits: 1024, e: 3 });
  const md = forge.md.sha256.create().update("Pocketcart security regression");
  const digest = md.digest().bytes();
  assert.equal(publicKey.verify(digest, privateKey.sign(md)), true);
  const asn1 = forge.asn1;
  const node = (type, constructed, value) =>
    asn1.create(asn1.Class.UNIVERSAL, type, constructed, value);
  for (const includeNull of [false, true]) {
    const children = [node(asn1.Type.OID, false, asn1.oidToDer(forge.pki.oids.sha256).bytes())];
    if (includeNull) children.push(node(asn1.Type.NULL, false, ""));
    const sign = () =>
      privateKey.sign(
        asn1
          .toDer(
            node(asn1.Type.SEQUENCE, true, [
              node(asn1.Type.SEQUENCE, true, children),
              node(asn1.Type.OCTETSTRING, false, digest),
            ]),
          )
          .bytes(),
        "NONE",
      );
    assert.equal(publicKey.verify(digest, sign()), true);
    children.push(node(asn1.Type.OCTETSTRING, false, "garbage"));
    assert.throws(() => publicKey.verify(digest, sign()), /valid RSASSA-PKCS1-v1_5/);
  }
});

test("security patch verification fails for unpatched, changed and nested dependency copies", async () => {
  const { checkSecurityPatches } = await import("../scripts/apply-security-patches.mjs");
  const patches = require("../scripts/security-patches.json");
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "pocketcart-security-"));
  const lock = { packages: {} };
  try {
    for (const patch of patches) {
      const install = `node_modules/${patch.package}`;
      lock.packages[install] = { version: patch.version };
      fs.mkdirSync(path.join(root, install, path.dirname(patch.file)), { recursive: true });
      fs.copyFileSync(
        path.join(__dirname, "..", install, patch.file),
        path.join(root, install, patch.file),
      );
      fs.writeFileSync(
        path.join(root, install, "package.json"),
        JSON.stringify({ version: patch.version }),
      );
    }
    const saveLock = () =>
      fs.writeFileSync(path.join(root, "package-lock.json"), JSON.stringify(lock));
    saveLock();
    assert.equal(checkSecurityPatches({ root }), patches.length);
    const patch = patches[0];
    const file = path.join(root, "node_modules", patch.package, patch.file);
    const patched = fs.readFileSync(file, "utf8");
    let original = patched;
    for (const replacement of patch.replacements)
      original = original.replaceAll(replacement.after, replacement.before);
    fs.writeFileSync(file, original);
    assert.throws(() => checkSecurityPatches({ root }), /patch missing/);
    checkSecurityPatches({ root, apply: true });
    assert.equal(fs.readFileSync(file, "utf8"), patched);
    assert.equal(checkSecurityPatches({ root, apply: true }), patches.length);
    fs.writeFileSync(file, `${patched}\n// unexpected source`);
    assert.throws(() => checkSecurityPatches({ root, apply: true }), /unexpected source/);
    fs.writeFileSync(file, patched);
    const nested = `node_modules/parent/node_modules/${patch.package}`;
    fs.cpSync(path.join(root, "node_modules", patch.package), path.join(root, nested), {
      recursive: true,
    });
    lock.packages[nested] = { version: patch.version };
    saveLock();
    assert.equal(checkSecurityPatches({ root }), patches.length + 1);
    fs.writeFileSync(path.join(root, nested, patch.file), original);
    assert.throws(() => checkSecurityPatches({ root }), /patch missing/);
    lock.packages[nested].version = "unexpected-version";
    saveLock();
    assert.throws(() => checkSecurityPatches({ root }), /Review security backport/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("vendored dependency integrity rejects modified source and unpatched registry copies", async () => {
  const { checkVendoredSecurity } = await import("../scripts/check-vendored-security.mjs");
  const manifest = require("../scripts/vendor-security-manifest.json");
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "pocketcart-fork-integrity-"));
  const lock = { packages: {} };
  try {
    for (const fork of manifest) {
      const install = `node_modules/${fork.alias}`;
      fs.cpSync(path.join(__dirname, "..", fork.directory), path.join(root, install), {
        recursive: true,
      });
      fs.cpSync(path.join(__dirname, "..", fork.directory), path.join(root, fork.directory), {
        recursive: true,
      });
      lock.packages[install] = { version: fork.version };
    }
    fs.writeFileSync(path.join(root, "package-lock.json"), JSON.stringify(lock));
    assert.ok(checkVendoredSecurity(root) > 0);
    const source = path.join(root, "node_modules/node-forge/lib/rsa.js");
    const patched = fs.readFileSync(source, "utf8");
    fs.writeFileSync(
      source,
      patched.replace("obj.value[0].value.length !==", "false && obj.value[0].value.length !=="),
    );
    assert.throws(() => checkVendoredSecurity(root), /hash mismatch/);
    fs.writeFileSync(source, patched);
    const pkgFile = path.join(root, "node_modules/node-forge/package.json");
    fs.writeFileSync(pkgFile, JSON.stringify({ name: "node-forge", version: "1.4.0" }));
    assert.throws(() => checkVendoredSecurity(root), /Unreviewed dependency/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("Expo certificate signing and CSR verification work with the patched crypto fork", () => {
  const signing = require("@expo/code-signing-certificates");
  const pair = forge.pki.rsa.generateKeyPair({ bits: 2048 });
  const cert = signing.generateSelfSignedCodeSigningCertificate({
    keyPair: pair,
    validityNotBefore: new Date("2026-01-01"),
    validityNotAfter: new Date("2027-01-01"),
    commonName: "Pocketcart synthetic build signing test",
  });
  signing.validateSelfSignedCertificate(cert, pair);
  const pem = signing.convertCertificateToCertificatePEM(cert);
  assert.equal(signing.convertCertificatePEMToCertificate(pem).verify(cert), true);
  assert.ok(
    signing.signBufferRSASHA256AndVerify(pair.privateKey, cert, Buffer.from("synthetic manifest")),
  );
  const csr = signing.generateCSR(pair, "Pocketcart synthetic CSR");
  assert.equal(signing.convertCSRPEMToCSR(signing.convertCSRToCSRPEM(csr)).verify(), true);
});
