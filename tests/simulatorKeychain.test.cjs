const test = require("node:test");
const assert = require("node:assert/strict");

test("simulator entitlement section decoding handles little-endian otool output", async () => {
  const { decodeSimulatorEntitlements: decode } = await import("../scripts/simulator-keychain.mjs");
  assert.equal(decode("0000000100001000 6d783f3c 003e3f6c\n"), "<?xml?>");
  assert.equal(decode("Contents of (__TEXT,__entitlements) section\n"), "");
  assert.equal(decode("0000000100001000 invalid"), "");
});

test("Keychain preflight requires an app identifier and its own access group", async () => {
  const { hasSimulatorKeychainAccess: check } = await import("../scripts/simulator-keychain.mjs");
  const id = "AU7PKKMSB8.com.pocketcart.app";
  assert.equal(check({ "application-identifier": id, "keychain-access-groups": [id] }, "com.pocketcart.app"), true);
  assert.equal(check({}, "com.pocketcart.app"), false);
  assert.equal(check({ "application-identifier": id }, "com.pocketcart.app"), false);
  assert.equal(check({ "application-identifier": id, "keychain-access-groups": ["other"] }, "com.pocketcart.app"), false);
  assert.equal(check({ "application-identifier": id, "keychain-access-groups": [id] }, "com.other.app"), false);
});
