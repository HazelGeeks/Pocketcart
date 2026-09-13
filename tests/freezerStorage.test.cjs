const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { validateStorageName } = require('../.tmp-tests/utils/freezerStorage.js');
const { emptyFreezerItemDraft, validateFreezerItemDraft } = require('../.tmp-tests/utils/freezerItem.js');
const locationId = '12345678-1234-1234-1234-123456789abc';
function load(file, mocks) {
  const mod = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports: mod.exports, require(name) {
    if (mocks[name]) return mocks[name];
    if (name.startsWith('../utils/')) return require(`../.tmp-tests/utils/${name.split('/').pop()}.js`);
    throw Error(name);
  }});
  return mod.exports;
}
test('storage names and appliance types are validated and named food destinations are preserved', () => {
  assert.deepEqual(validateStorageName(' Kitchen refrigerator ', 'fridge'), { ok: true, name: 'Kitchen refrigerator' });
  for (const [name, area] of [[' ', 'fridge'], ['a'.repeat(61), 'freezer'], ['Pantry', 'pantry']]) {
    assert.equal(validateStorageName(name, area).ok, false);
  }
  const draft = { ...emptyFreezerItemDraft(), name: 'Milk', storageUnitId: locationId };
  assert.equal(validateFreezerItemDraft(draft).value.storageUnitId, locationId);
  assert.equal(validateFreezerItemDraft({ ...draft, storageUnitId: 'invalid' }).ok, false);
  assert.equal(validateFreezerItemDraft({ ...draft, storageArea: 'pantry' }).ok, false);
});
test('named storage creation retries use the same id, family ownership and guarded renames', async () => {
  const writes = [], filters = [];
  let familyId = null, scopeError = null;
  const query = {
    upsert(payload) { writes.push(payload); return this; },
    update(payload) { writes.push(payload); return this; },
    eq(...args) { filters.push(args); return this; }, is(...args) { filters.push(args); return this; },
    select() { return this; }, async single() { return { data: { id: locationId, ...writes.at(-1) }, error: null }; },
  };
  const service = load('src/services/freezerStorage.ts', {
    './myFreezer': { freezerScope: async () => ({ familyId, error: scopeError }), freezerError: error => error?.message ?? null },
    './supabaseClient': { supabase: { from: () => query } },
  });
  const params = { userId: 'user', expectedFamilyId: null, name: ' Kitchen ', area: 'fridge', creationId: locationId };
  await service.saveFreezerStorage(params); await service.saveFreezerStorage(params);
  assert.equal(writes[0].name, 'Kitchen'); assert.equal(writes[0].id, writes[1].id);
  assert.equal(writes[0].user_id, 'user'); assert.equal(writes[0].family_id, null);
  familyId = 'family'; await service.saveFreezerStorage({ ...params, expectedFamilyId: familyId });
  assert.equal(writes[2].user_id, null); assert.equal(writes[2].family_id, familyId);
  await service.saveFreezerStorage({ ...params, name: 'Renamed', unit: { id: locationId, updated_at: 'version' } });
  assert.equal(JSON.stringify(writes[3]), JSON.stringify({ name: 'Renamed' }));
  assert.ok(filters.some(([field, value]) => field === 'updated_at' && value === 'version'));
  scopeError = 'Your family changed';
  assert.match((await service.saveFreezerStorage(params)).error, /family changed/);
  assert.equal(writes.length, 4);
});
test('pre-migration food reads and unnamed writes work, but named destinations never silently disappear', async () => {
  const writes = [];
  const oldRow = { id: 'food', name: 'Milk', storage_area: 'fridge' };
  const missing = { code: '42703', message: 'column freezer_items.storage_unit_id does not exist' };
  const query = {
    select(fields) { this.fields = fields; return this; },
    eq() { return this; }, is() { return this; }, order() { return this; },
    insert(payload) { writes.push(payload); return this; },
    async range() { return this.fields.includes('storage_unit_id') ? { data: null, error: missing } : { data: [oldRow], error: null }; },
    async single() { return this.fields.includes('storage_unit_id') ? { data: null, error: missing } : { data: oldRow, error: null }; },
  };
  const service = load('src/services/myFreezer.ts', {
    './family': { loadFamily: async () => null },
    './supabaseClient': { hasSupabaseEnv: true, supabase: { auth: { getUser: async () => ({ data: { user: { id: 'user' } }, error: null }) }, from: () => query } },
  });
  assert.equal((await service.listMyFreezerItems('user')).data[0].name, 'Milk');
  const draft = { ...emptyFreezerItemDraft(), name: 'Milk' };
  assert.equal((await service.saveMyFreezerItem({ userId: 'user', draft })).error, null);
  assert.equal(writes.length, 2); assert.equal('storage_unit_id' in writes[1], false);
  assert.match((await service.saveMyFreezerItem({ userId: 'user', draft: { ...draft, storageUnitId: locationId } })).error, /storage_unit_id/);
  assert.equal(writes.length, 3);
});

test('emoji and color choices validate, persist on create and edit, and allow restoring the default icon', async () => {
  const { validateStorageAppearance } = require('../.tmp-tests/utils/freezerStorageAppearance.js');
  assert.equal(validateStorageAppearance({ emoji: '🍱', color: '#245EA8' }).ok, true);
  assert.equal(validateStorageAppearance({ emoji: null, color: '#176B45' }).ok, true);
  assert.equal(validateStorageAppearance({ emoji: 'invalid', color: '#176B45' }).ok, false);
  assert.equal(validateStorageAppearance({ emoji: '🍱', color: 'red' }).ok, false);
  const writes = [];
  const query = {
    upsert(payload) { writes.push(payload); return this; }, update(payload) { writes.push(payload); return this; },
    eq() { return this; }, is() { return this; }, select() { return this; },
    async single() { return { data: { id: locationId, ...writes.at(-1) }, error: null }; },
  };
  const service = load('src/services/freezerStorage.ts', {
    './myFreezer': { freezerScope: async () => ({ familyId: null, error: null }), freezerError: error => error?.message ?? null },
    './supabaseClient': { supabase: { from: () => query } },
  });
  const params = { userId: 'user', expectedFamilyId: null, name: 'Kitchen', area: 'fridge', creationId: locationId,
    appearance: { emoji: '🍎', color: '#A83F65' } };
  const added = await service.saveFreezerStorage(params);
  assert.equal(added.data.emoji, '🍎'); assert.equal(added.data.color, '#A83F65');
  const changed = await service.saveFreezerStorage({ ...params, unit: { id: locationId, updated_at: 'original' },
    appearance: { emoji: null, color: '#7050A0' } });
  assert.equal(changed.data.emoji, null); assert.equal(changed.data.color, '#7050A0');
  assert.equal('storage_area' in writes[1], false);
  await service.saveFreezerStorage({ ...params, appearance: { emoji: 'bad', color: '#176B45' } });
  assert.equal(writes.length, 2);
});

test('pre-appearance locations remain readable and appearance writes report missing schema without silently losing choices', async () => {
  const oldUnit = { id: locationId, name: 'Original', storage_area: 'fridge' };
  const missing = { code: '42703', message: 'column freezer_storage_units.emoji does not exist' };
  let reads = 0, writes = 0;
  const query = {
    select(fields) { this.fields = fields; return this; }, eq() { return this; }, is() { return this; }, order() { return this; },
    async range() { reads++; return this.fields.includes('emoji') ? { data: null, error: missing } : { data: [oldUnit], error: null }; },
    update() { writes++; return this; }, async single() { return { data: null, error: missing }; },
  };
  const service = load('src/services/freezerStorage.ts', {
    './myFreezer': { freezerScope: async () => ({ familyId: null, error: null }), freezerError: error => error?.message ?? null },
    './supabaseClient': { supabase: { from: () => query } },
  });
  const listed = await service.listFreezerStorage('user', null);
  assert.equal(listed.error, null); assert.equal(listed.data[0].name, 'Original'); assert.equal(reads, 2);
  const saved = await service.saveFreezerStorage({ userId: 'user', expectedFamilyId: null, name: 'Original', area: 'fridge', creationId: locationId,
    unit: { ...oldUnit, updated_at: 'original' }, appearance: { emoji: '🏠', color: '#176B45' } });
  assert.equal(saved.data, null); assert.match(saved.error, /database update/); assert.equal(writes, 1);
});

test('storage deletion checks inventory scope and version, and never reports a rejected or stale delete as successful', async () => {
  const filters = []; let scopeError = null, response = { data: { id: locationId }, error: null }, calls = 0;
  const query = {
    delete() { calls++; return this; }, eq(...args) { filters.push(args); return this; }, is(...args) { filters.push(args); return this; },
    select() { return this; }, async maybeSingle() { return response; },
  };
  const service = load('src/services/freezerStorage.ts', {
    './myFreezer': { freezerScope: async () => ({ familyId: 'family', error: scopeError }), freezerError: error => error?.message ?? null },
    './supabaseClient': { supabase: { from: () => query } },
  });
  const unit = { id: locationId, updated_at: 'original' };
  assert.equal(await service.deleteFreezerStorage('user', 'family', unit), null);
  assert.ok(filters.some(([field, value]) => field === 'family_id' && value === 'family'));
  assert.ok(filters.some(([field, value]) => field === 'updated_at' && value === 'original'));
  response = { data: null, error: null };
  assert.match(await service.deleteFreezerStorage('user', 'family', unit), /changed|already deleted/);
  response = { data: null, error: { code: '42501', message: 'permission denied' } };
  assert.match(await service.deleteFreezerStorage('user', 'family', unit), /Nothing was deleted/);
  scopeError = 'Your family changed';
  assert.match(await service.deleteFreezerStorage('user', 'family', unit), /family changed/);
  assert.equal(calls, 3);
});
