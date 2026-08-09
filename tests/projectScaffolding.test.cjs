const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");

function projectPath(relativePath) {
  return path.join(projectRoot, relativePath);
}

function readProjectFile(relativePath) {
  return fs.readFileSync(projectPath(relativePath), "utf8");
}

test("service domains expose directory entry points without file-folder collisions", () => {
  const serviceDomains = {
    adminBackoffice: [
      "types",
      "auth",
      "users",
      "products",
      "stores",
      "prices",
      "audit",
      "productIdentityReviews",
      "schemaReadiness",
    ],
    marketData: ["types", "products", "stores", "prices"],
  };

  for (const [domain, exports] of Object.entries(serviceDomains)) {
    const indexPath = `src/services/${domain}/index.ts`;
    const indexSource = readProjectFile(indexPath);

    assert.equal(fs.existsSync(projectPath(`src/services/${domain}.ts`)), false);
    for (const exportedModule of exports) {
      assert.match(indexSource, new RegExp(`export \\* from "\\./${exportedModule}";`));
    }
  }
});

test("style domains use directory entry points without file-folder collisions", () => {
  for (const styleDomain of ["src/styles", "src/screens/nativeAppStyles"]) {
    assert.equal(fs.existsSync(projectPath(`${styleDomain}.ts`)), false);
    assert.equal(fs.existsSync(projectPath(`${styleDomain}/index.ts`)), true);
  }
});

test("screen style modules remain small and responsibility-focused", () => {
  const styleDirectories = ["src/styles", "src/screens/adminStyles", "src/screens/nativeAppStyles"];

  for (const relativeDirectory of styleDirectories) {
    const styleOwners = new Map();
    const styleFiles = fs
      .readdirSync(projectPath(relativeDirectory))
      .filter((fileName) => fileName.endsWith(".ts"));

    for (const fileName of styleFiles) {
      const relativePath = `${relativeDirectory}/${fileName}`;
      const source = readProjectFile(relativePath);
      const lineCount = source.trimEnd().split(/\r?\n/).length;
      assert.ok(lineCount <= 300, `${relativePath} has ${lineCount} lines; expected at most 300`);

      for (const match of source.matchAll(/^  ([A-Za-z][A-Za-z0-9]*): \{/gm)) {
        const styleName = match[1];
        const previousOwner = styleOwners.get(styleName);
        assert.equal(previousOwner, undefined, `${styleName} is declared by both ${previousOwner} and ${relativePath}`);
        styleOwners.set(styleName, relativePath);
      }
    }
  }
});

test("style aggregators include each extracted style domain", () => {
  const adminStyles = readProjectFile("src/screens/adminScreenStyles.ts");
  const accountStyles = readProjectFile("src/screens/nativeAppStyles/accountSettingsStyles.ts");

  for (const styleDomain of ["adminOverviewStyles", "adminFlyerStyles", "adminSidebarStyles", "adminProductEditorStyles"]) {
    assert.match(adminStyles, new RegExp(`\\.\\.\\.${styleDomain}`));
  }
  for (const styleDomain of ["settingsStyles", "accountAuthStyles", "personalizationStyles"]) {
    assert.match(accountStyles, new RegExp(`\\.\\.\\.${styleDomain}`));
  }
});
