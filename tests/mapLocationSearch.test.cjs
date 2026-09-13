const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function service(os, location) {
  const mod = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/services/mapLocationSearch.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports: mod.exports, Error, require(name) {
    if (name === 'react-native') return { Platform: { OS: os } };
    if (name === 'expo-location') return location;
    throw Error(name);
  } });
  return mod.exports.searchMapLocations;
}
test('postal lookup normalizes Canadian codes and keeps a readable result address', async () => {
  let query;
  const lookup = service('ios', {
    geocodeAsync: async value => { query = value; return [{ latitude: 49, longitude: -123 }]; },
    reverseGeocodeAsync: async () => [{ city: 'Vancouver', region: 'BC', country: 'Canada', postalCode: 'V5K 0A1' }],
  });
  const results = await lookup('v5k0a1');
  assert.equal(query, 'V5K 0A1, Canada');
  assert.equal(results[0].label, 'Vancouver, BC, V5K 0A1, Canada');
});
test('Android permission denial never starts geocoding', async () => {
  let called = false;
  const lookup = service('android', { requestForegroundPermissionsAsync: async () => ({ granted: false }), geocodeAsync: async () => { called = true; return []; } });
  await assert.rejects(lookup('Vancouver'), /Allow location access/); assert.equal(called, false);
});
test('invalid and duplicate coordinates are removed; reverse lookup failure preserves valid locations', async () => {
  const lookup = service('ios', {
    geocodeAsync: async () => [{ latitude: 49, longitude: -123 }, { latitude: 49, longitude: -123 }, { latitude: NaN, longitude: 0 }, { latitude: 100, longitude: 0 }],
    reverseGeocodeAsync: async () => { throw Error('unavailable'); },
  });
  const results = await lookup('Somewhere'); assert.equal(results.length, 1); assert.match(results[0].label, /49.0000, -123.0000/);
});
test('web reports address lookup availability instead of silently returning no results', async () => {
  await assert.rejects(service('web', {})('Vancouver'), /mobile app/);
});
